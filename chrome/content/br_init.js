// Responsible for loading up Sangfroid when the Browser starts. Also tests and loads plugins every time
// a page is loaded.
var br_init = {};

// This is where it all begins. The startup function attaches stuff to the
// firefox "load" event, which is how we get started
//
// We run it immediately when this file loads.
br_init.startup = function () {
	function async_startup() {
		if (typeof br_global === "undefined") {
			// goto sleep for one second before starting; this is so we don't slow down the Firefox startup
			setTimeout(br_init.onFirefoxLoad, 1000);
		}
	}
	window.addEventListener("load", async_startup, false);
};

// Object that listens to and responds to changes to prefs
br_init.myPrefObserver = {
	register : function () {
		// First we'll need the preference services to look for preferences.
		var prefService = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);

		// For _branch we ask that the preferences for extensions.myextension. and children
		br_init.myPrefObserver._branch = prefService.getBranch("extensions.sangfroid.");

		// Now we queue the interface called nsIPrefBranch2. This interface is described as:
		// "nsIPrefBranch2 allows clients to observe changes to pref values."
		br_init.myPrefObserver._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);

		// Finally add the observer.
		br_init.myPrefObserver._branch.addObserver("", br_init.myPrefObserver, false);
	},

	unregister : function () {
		if (!br_init.myPrefObserver._branch)
			return;
		br_init.myPrefObserver._branch.removeObserver("", br_init.myPrefObserver);
	},

	observe : function (aSubject, aTopic, aData) {
		if (aTopic !== "nsPref:changed")
			return;
		// aSubject is the nsIPrefBranch we're observing (after appropriate QI)
		// aData is the name of the pref that's been changed (relative to aSubject)
		br_init.pub(aData + "_changed", [aSubject, aData]);
		br_options.refresh_prefs();
	}
};

// This is the function that will set up what functions run at different life
// cycles of Firefox loading and displaying content
br_init.onFirefoxLoad = function (event) {
	// first, load all the functions into global

	var start = new Date(),
	end;
	br_init.loading_function();
	jQuery = br_utils.get_jquery();
	br_options.refresh_prefs();

	/* AH - firefox.bigmachines.com stuff
	// check if there has been an upgrade
	if(br_options.check_new_version() === true) {
	br_options.new_version_action();
	}
	 */

	// setup the Sangfroid menu, etc.
	br_init.register_xul_elements();

	br_init.myPrefObserver.register();

	var appcontent = document.getElementById("appcontent");

	if (appcontent) {
		// On page load
		var apponload = function (ev) {
			br_init.initiate_onload(ev, this);
		};
		appcontent.addEventListener("DOMContentLoaded",
			apponload,
			true);
		// On tab select
		var apptab = function (ev) {
			br_init.initiate_onload(ev, this);
		};
		var container = gBrowser.tabContainer;
		container.addEventListener("TabSelect",
			apptab,
			true);

		end = new Date();
	}
	// refresh plugins and load them if appropriate
	
	br_options.revert_to_default(); //AH - deprecating plugin choice
	br_init.init_plugins();
	br_global.pm = Components.classes["@mozilla.org/preferences-service;1"]
												 .getService(Components.interfaces.nsIPrefService)
												 .getBranch("extensions.sangfroid.");

	// Begin check for Oracle network, prod list
	/*var net_check = br_global.pm.getCharPref("on_network");
	var d = new Date();
	var d_check = d.getTime();
	var milli_hours = 3600000 * 10;
	if(net_check == "" || net_check < d_check - milli_hours){
		br_init.get_prod_list();
		br_init.on_network();
		br_global.pm.setCharPref("on_network",d_check);
	}else{
		br_global.prod_sites = br_global.pm.getCharPref("prod_sites").split("@");
		br_global.on_network = true;
	}*/ // mcampbell removed check for ON_NETWORK
	br_global.prod_sites = br_global.pm.getCharPref("prod_sites").split("@");
	br_global.on_network = true;
	// End check for Oracle network, prod list
	
	if(br_global.on_network){br_init.content_builder();}
};

// Setup toolbar menu and preferences
br_init.register_xul_elements = function () {
	var faster = document.getElementById("sangfroid_faster");
	var refresh = document.getElementById("sangfroid_context_menu");
	var logo = document.getElementById("br_sangfroid_status");
	var logo_nav = document.getElementById("sangfroid_nav_button");
	var open_prefs = document.getElementById("sangfroid_open_prefs");
	var open_plugins = document.getElementById("sangfroid_open_plugins");
	var open_bug = document.getElementById("sangfroid_open_bug");

	if (faster) {
		faster.setAttribute('checked', br_global.faster);

		faster.addEventListener("command", function () {
			br_options.toggle_faster();
			faster.setAttribute('checked', br_global.faster);
		}, true);
	}

	if (refresh) {
		refresh.addEventListener("command", function () {
			br_init.run_all_plugin_tests();
		}, true);
	}

	if (logo) {
		if (br_utils.is_alt()) {
			jQuery("#sangfroid_nav_button").css({
				'list-style-image' : 'url(chrome://sangfroid/content/img/034.png)'
			});
		}
		if (!br_global.sangfroid_active) {
			jQuery("#sangfroid_nav_button").css({
				'list-style-image' : 'url(chrome://sangfroid/content/img/logo-off.png)'
			});
		}
		logo.addEventListener("click", function () {
			br_utils.toggle_active();
		}, false);
	}

	if (logo_nav) {
		logo_nav.addEventListener("command", function (e) {
			if (!e) {
				return;
			}
			if (!e.target) {
				return;
			}
			if (!e.target.id) {
				return;
			}

			if (e.target.id === "sangfroid_nav_button") {
				br_utils.toggle_active();
			}
		}, true);
	}

	if (open_prefs) {
		open_prefs.addEventListener("command", br_utils.configure, true);
	}

	if (open_bug) {
		open_bug.addEventListener("command", br_utils.bug_report, true);
	}

	if (open_plugins) {
		open_plugins.addEventListener("command", function () {
			gBrowser.selectedTab = gBrowser.addTab("");
		}, true);
	}
};

// Creates a global "safe" jQuery to use in other functions.
br_init.create_jquery_alias = function () {
	window.br_$ = function () {
		if (!window.doc || !window.doc.jQuery) {
			br_log.info("Called br_$ when jQuery wasn't ready. From: " + br_$.caller);
			return br_utils.get_jquery();
		};
		return doc.jQuery.apply(this, arguments);
	};
};

// Begin here.
br_init.startup();
br_init.create_jquery_alias();

// This script is called to load all the js libraries into the current window.
br_init.load_core_scripts = function (force) {
	if (force === true) {
		Services.obs.notifyObservers(null, "startupcache-invalidate", null);
		br_init.loading_function();
		br_options.refresh_prefs();
	}
};
// Add any new modules to this list
br_init.loading_function = function (context) {
	var chrome = "chrome://sangfroid/content/";
	context = context || window;

	// Load/overwrite all Sangfroid modules and libraries
	br_init.load_script(chrome + "modules/br_load.js", context);
	br_init.load_script(chrome + "modules/br_bread.js", context);
	br_init.load_script(chrome + "modules/q.js", context);
	br_init.load_script(chrome + "modules/br_pubsub.js", context);
	br_init.load_script(chrome + "modules/br_progress_listener.js", context);
	br_init.load_script(chrome + "modules/br_log.js", context);
	//AH - No longer used
	//br_init.load_script(chrome+"modules/br_chat.js",context);
	//br_init.load_script(chrome + "modules/br_overlay_master.js", context);
	br_init.load_script(chrome + "modules/diff_match_patch.js", context);
	//AH - no more SFDC
	//br_init.load_script(chrome+"modules/sfdc_api.js",context);
	br_init.load_script(chrome + "br_menu.js", context);
	br_init.load_script(chrome + "br_content.js", context);
	//br_init.load_script(chrome+"br_model.js",context);
	//AH - Don't Need
	//br_init.load_script(chrome+"br_record.js",context);
	br_init.load_script(chrome + "br_editor.js", context);
	br_init.load_script(chrome + "br_options.js", context);
	br_init.load_script(chrome + "br_utils.js", context);
	br_init.load_script(chrome + "br_global.js", context);
	br_init.load_script(chrome + "br_display.js", context);
	//br_init.load_script(chrome+"br_remote_form.js",context);
	br_init.load_script(chrome + "br_hotbox.js", context);
	//AH - Server doesn't exist
	//br_init.load_script(chrome+"br_repo.js",context);
	br_init.load_script(chrome + "br_list_of_plugins.js", context);
	//AH - Don't Need
	//br_init.load_script(chrome+"br_md5_lib.js",context);
	//br_init.load_script(chrome+"br_rails_overlay.js",context);
	br_init.load_script(chrome + "underscore-1.1.4.min.js", context);
	br_init.load_script(chrome + "br_init.js", context);
	br_init.load_script(chrome + "br_dom.js", context);

	// prepare br_init pubsub
	br_pubsub(br_init);
};

// Called on page load. Fires up the plugin tests.
br_init.initiate_onload = function (ev, frame) {
	if (br_global.sangfroid_active === true) {
		br_init.load_core_scripts();
		if(br_global.on_network){br_init.content_builder();}
	}
};

// Loads the given javascript file into memory. Identical to
// br_load.js, included here as a bootstrap.
br_init.load_script = function (path, context) {
	context = context || window;
	try {
		var jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		jsLoader.loadSubScript(path, context);
	} catch (e) {
		alert(e);
		throw new Error("br_init: Error loading path: " + path);
	}
}

// Called from dropdown menu option "Refresh Plugins"
// This code will forcibly reload all JS files
br_init.run_all_plugin_tests = function () {
	br_init.init_plugins();
	br_init.load_core_scripts(true);
	br_init.content_builder(null, true);
};

// Loads jquery, and then all plugins listed in the preference
// extensions.sangfroid.list_of_plugins.
//
// The plugins call br_utils.create_plugin to add themselves to
// the array br_global.plugin_array
//
// Then we loop through the br_global.plugin_array and run asynchronously
// run our plugin's tests. If a test passes we instantiate the object
// and pass it to "run_plugin"
//
/**
 * @param name {String} Optional - specific plugin to load
 * @param notify {Boolean} Optional - Show list of loaded plugins if true
 * @return {Array} An array of plugin objects
 */
br_init.content_builder = function (name, notify) {
	var plugin_doc,
	plugin_win,
	objects,
	times = {
		start : new Date(),
		end : new Date(),
		all : "Plugin Loading Times:",
		plugin_count : 0,
		count : 0
	};

	if (!window.content) {
		return;
	}
	plugin_win = window.content;
	doc = plugin_doc = window.content.document;

	plugin_doc.jQuery = plugin_doc.jQuery || br_utils.get_jquery();
	plugin_doc.brc = plugin_doc.brc || {};

	name = name || null;

	times.set_end = function (date, name) {
		name = name || "?";
		times.count += 1;
		times.end = date;
		times.all += name + ":" + (times.end - times.start) + "\n";

		if (times.count === times.plugin_count) {
			if (notify) {
				br_log.info("Longest plugin time: " + (times.end - times.start));
				br_log.notify("Plugins loaded:\n" + _.keys(plugin_doc.brc).join("\n"));
			}
		}
	};

	if (br_global.plugin_array.length < 1) {
		br_init.init_plugins();
	}

	objects = br_global.plugin_array;
	times.plugin_count = objects.length;

	for (var i = 0, ii = objects.length; i < ii; i++) {
		if (!name || objects[i].name === name) {
			br_init.async_load_plugin(objects[i], plugin_doc, plugin_win, times);
		}
	}
};

// For each plugin, we will run it's tests and launch it if true
br_init.async_load_plugin = function (brc, doc, win, times) {
	var browser_url,
	params,
	plugin;
	function async_func() {
		try {
			if (!doc.location) {
				times.set_end(new Date(), brc.name);
				return;
			}

			browser_url = doc.location.href;
			if (br_init.check_regex_urls(browser_url, brc.regex_urls) === false) {
				times.set_end(new Date(), brc.name);
				return;
			}
			params = brc.get_parameters(doc, doc.jQuery);

			if (brc.matches_page(params)) {
				br_global.current_plugins += brc.name + "\n";

				//override plugin-level properties
				brc.content.prototype.doc = doc;
				brc.content.prototype.jQuery = doc.jQuery;

				// We init here, because we need to pass "params"
				plugin = new brc.content(params, doc);
				plugin.doc = doc;

				//once_per_frame is deprecated
				if (brc.once_per_frame !== true && brc.multiple_loads !== true) {
					//keep the plugin from being invoked again
					doc.brc[brc.name] = true;
				}

				br_init.run_plugin(plugin, win);
			}
			times.set_end(new Date(), brc.name);
		} catch (e) {
			//don't bother users with location errors, but log them in console
			if (brc) {
				br_log.error("Problem loading plugin: " + brc.name + ". Line Number:" + e.lineNumber);
				br_log.info("Problem loading plugin: " + brc.name + ":" + e);
			} else {
				br_log.error("Problem loading plugin.");
				br_log.info("Problem loading plugin. " + e);
			}
		}
	}

	// only initiate this plugin if it has not been initiated on this document before
	if (!doc.brc[brc.name]) {
		setTimeout(async_func, 0);
	} else {
		times.set_end(new Date(), brc.name);
	}
};

br_init.run_plugin = function (brc, win) {
	var unloader;
	// don't run the same plugin repeatedly
	if (brc.plugin_created_successfully()) {
		return;
	}

	if (br_global.faster) {
		brc.faster();
	}

	// fire page loads
	brc.before_page_load();
	brc.on_page_load();
	brc.after_page_load();

	// setup teardown
	unloader = function () {
		win.removeEventListener("unload", unloader, true);
		brc.on_page_unload();
		brc = null;
	}
	win.addEventListener("unload", unloader, false);
};

br_init.check_regex_urls = function (url, reg) {
	//if no regex provided, proceed to matches_page, etc.
	if (reg === undefined) {
		return true;
	}
	//if not an array, there is an error
	if (reg.constructor.toString().indexOf("Array") == -1) {
		throw "Invalid regex_url for plugin, expected an array of regular expression statements.";
	}
	//if array is empty, proceed to matches_page, etc.
	if (reg.length === 0) {
		return true;
	}

	for (var i = 0, ii = reg.length; i < ii; i++) {
		if (url.search(reg[i]) > -1) {
			return true;
		}
	}
	return false;
};
// This function is called to load the list of plugins from
// preferences. The list is managed by br_plugin_files.
/**
 * @return {Array} List of paths to each file
 */
br_init.init_plugins = function () {
	br_global.plugin_array = [];
	var list = br_plugin_files();

	// Load all plugins into memory
	br_load.plugins(list.active());

	return list;
};
