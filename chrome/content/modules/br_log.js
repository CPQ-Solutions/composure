// br_log provides convenient logging and console services. It writes to the Firefox and Firebug
// consoles, as well as to a log on the server, which can be viewed at
// [http://firefox.bigmachines.com/usage](http://firefox.bigmachines.com/usage)
//
// br_log also creates and renders a popup interface to show messages to the user, and keeps track of
// previous messages to show them if necessary.

/**
 * EXAMPLE:
 * br_log.notify("Show popup with this message");
 * br_log.error("Log an error, and show popup to user");
 **/
var br_log = br_log_constructor();

function br_log_constructor(me) {
	me = me || {};
	me.wait_ready = false;
	me.console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	me.show_timer = null;
	
	var pm = Components.classes["@mozilla.org/preferences-service;1"]
											 .getService(Components.interfaces.nsIPrefService)
											 .getBranch("extensions.sangfroid.");
											 
	me.notify_popup = function () {
		var css_done = br_load.css("resource://br_templates/notify_div.css"),
		temp_done = br_load.template("resource://br_templates/notify_div.html"),
		temppage_done = br_load.template("resource://br_templates/notifypage_div.html"),
		fn = {};
		
		/*AH callback test*/var callback = {};

		// fn holds functions that will be called by events
		fn.done = function () {
			remove();
			me.show_timer = null;
		};
		fn.enter = function () {
			clearTimeout(me.show_timer);
		};
		fn.leave = function () {
			me.show_timer = setTimeout(fn.done, 2000);
		};
		fn.close_log = function (type) {
			type = type || "";
			remove(type);
		};
		fn.show_more = function () {
			var el = doc.getElementById("br_previous_notify_div"),
			button = doc.getElementById("br_show_more_log");

			if (!el) {
				return;
			}

			if (el.style.display !== "block") {
				el.style.display = "block";
				button.setAttribute("class", "showing");
			} else {
				el.style.display = "none";
				button.setAttribute("class", "");
			}
		};

		// create a promise that loads up the UI
		var ready = ready_temp(temp_done, css_done);
		var ready_page = ready_temp(temppage_done, css_done);
		
		//AH - function to create UI promises
		function ready_temp(source_temp, source_css){
			return Q.join(source_temp, source_css, function (temp, css) {
				if (!doc.getElementById("br_notify_css")) {
					css.setAttribute("id", "br_notify_css");
					var head = doc.head;
					head = head || doc.getElementsByTagName("head")[0];
					css.innerHTML = br_utils.replaceCSSPrefs(css);
					head.appendChild(css);
				}
				return {
					temp : temp,
					css : css
				};
			});
		}
		function remove(type) {
			var type = type || "";
			var root_div = doc.getElementById("br_notify"+type+"_root"),
			notify_div = doc.getElementById("br_notify"+type+"_div"),
			close_div = doc.getElementById("br_"+type+"close_log_div"),
			toggle_div = doc.getElementById("br_"+type+"show_more_log");

			if (notify_div) {
				notify_div.removeEventListener("mouseover", fn.enter, false);
				notify_div.removeEventListener("mouseout", fn.leave, false);

				if(close_div) close_div.removeEventListener("click", fn.close_log, false);
				if(toggle_div) toggle_div.removeEventListener("click", fn.show_more, false);

				root_div.parentNode.removeChild(root_div);
				clearTimeout(me.show_timer);
			}
		}

		function setup_delay(element, delay) {
			me.show_timer = setTimeout(fn.done, delay);

			element.addEventListener("mouseover", fn.enter, true);
			element.addEventListener("mouseout", fn.leave, true);
		}
		
		/* RENDERERS */
		
		//default logging
		function render(param, delay) {
			delay = delay || 8000;
			return Q.when(ready, function (result) {
				var root_div,
				notify_div,
				close_div,
				toggle_div;
				root_div = doc.createElement("div");
				remove();

				root_div.innerHTML = result.temp(param);
				root_div.setAttribute("id", "br_notify_root");
				doc.body.appendChild(root_div);

				notify_div = doc.getElementById("br_notify_div");
				close_div = doc.getElementById("br_close_log_div");
				toggle_div = doc.getElementById("br_show_more_log");

				close_div.addEventListener("click", function(){fn.close_log();}, false);
				toggle_div.addEventListener("click", fn.show_more, false);

				notify_div.style.display = "block";
				setup_delay(notify_div, delay);

				return notify_div;
			});
		}

		//quote details, prod notification
		function render_page(param, delay) {
			var that = this;
			me.wait_ready = true;
			delay = delay || 8000;
			return Q.when(ready_page, function (result) {
				var root_div,
				notify_div,
				close_div,
				toggle_div;
				root_div = doc.createElement("div");
				remove("page");

				root_div.innerHTML = result.temp(param);
				root_div.setAttribute("id", "br_notifypage_root");
				doc.body.appendChild(root_div);

				notify_div = doc.getElementById("br_notifypage_div");
				close_div = doc.getElementById("br_pageclose_log_div");

				close_div.addEventListener("click", function(){fn.close_log("page");}, false);
				that.callback();
				me.wait_ready = false;
				return notify_div;
			});
		}
		//AH CALLBACK TEST
		return {
			render : render,
			render_page : render_page,
			remove : remove,
			callback : callback
		};
	};

	me.log_history = function (log_array) {
		var el = document.getElementById("sangfroid_overlay"),
		log_text;

		if (!el) {
			return [];
		}

		if (_.isArray(log_array)) {
			log_text = JSON.stringify(log_array);
			el.setAttribute("log", log_text);
			return log_array;
		} else {
			log_text = el.getAttribute("log");
			return log_text ? JSON.parse(log_text) : [];
		}
	};

	me.display_message = function (message, level, type, callback) {
		var widget = me.notify_popup();

		level = level || "";
		message = message || "";
		message = message.replace(/\n/g, "<br/>");
		type = type || "log";
		if(typeof callback === "undefined"){callback = function(){console.log(type+" "+level+": No Callback");}}
		var curr = {
			text : message,
			level : level
		};

		var g = br_global;
		log_array = me.log_history();

		var param = {
			curr : curr,
			prev : log_array.slice(0)
		};

		// prepend current to the log array, and limit to 15 entries
		log_array.splice(0, 0, curr);
		me.log_history(log_array.splice(0, 15));
		//AH - determine render function
		if(type == "log"){
			widget.render(param);
		}else if(type == "page"){
			//AH callback test
			widget.callback = callback;
			widget.render_page(param);
		}
	};

	function error(message) {
		notify(message, "error");
		server("SANGFROID_ERROR: " + message);

		var script_error = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
		script_error.init(message, message.fileName, null, message.lineNumber, null, script_error.errorFlag, null);

		me.console.logMessage(script_error);
	}

	function info(message) {
		me.console.logStringMessage("Sangfroid: " + message);
	}

	function notify(message, level) {
		level = level || "";
		me.display_message(message, level);
	}
	/*
	//AH long message
	function long_message(message, level) {
		var widget = me.notify_popup();
		level = level || "";
		message = message || "";
		message = message.replace(/\n/g, "<br/>");

		var curr = {
			text : message,
			level : level
		};

		var g = br_global;
		log_array = me.log_history();

		var param = {
			curr : curr,
			prev : log_array.slice(0)
		};

		// prepend current to the log array, and limit to 15 entries
		log_array.splice(0, 0, curr);
		me.log_history(log_array.splice(0, 15));

		var div_done = widget.render_alt(param);
	}
	*/
	function server(message) {
		if (message === undefined || message === null) {
			return;
		}
		if (!br_load || typeof br_load.get !== "function") {
			return;
		}
		if (br_global.dev_mode === true) {
			message = "DEV_MODE:::" + message;
		}

		var url = br_utils.url_object(br_global.remote_root);

		message = message.replace(/\./g, "_");
		if (url && url.path()) {
			br_load.get(url.append("/log/" + message));
		}
	}

	function firebug(message) {
		if (typeof Firebug !== "undefined" &&
			Firebug.Console &&
			typeof Firebug.Console.log === "function") {
			Firebug.Console.log(message);
		} else {
			info(message);
		}
	}
	return {
		error : function (message) {
			error(message);
		},
		info : function (message) {
			info(message);
		},
		warn : function (message) {
			notify(message, "warn");
			info("WARNING: " + message);
		},
		server : function (message) {
			server(message);
		},
		notify : function (message) {
			notify(message);
		},
		//AH - exposing new function
		page : function (message, level, callback) {
			me.display_message(message, level, "page", callback);
			//debug
			//firebug("Page Logs: " + message)
		},
		firebug : function (message) {
			firebug(message);
		},
		page_ready : function () {
			return me.wait_ready;
		}
	}
};
