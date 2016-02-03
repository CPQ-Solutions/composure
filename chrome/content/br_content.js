// BR_Content is the superclass of all of the plugins. Provides an API
// to interact with the repositories, editor, and display
// functionality.
function BR_Content() {};
(function () {
	// #### Functions to identify, load scripts
	var brc = BR_Content.prototype;

	// Plugins have pub/sub available
	brc.pubs = br_pubsub(brc);
	brc.parameters = {};
	brc.nodes = {};
	brc.pm = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.sangfroid.");

	var firstProcessId = "";
	/**
	 * @return {String} Descriptive string of the type of content this object represents
	 */
	// Called to identify the current plugin
	brc.get_script_type = function () {
		return "unknown file";
	};
	/**
	 * @return {DOM Element} The node that the text to be saved and
	 * read sits in
	 */
	// Used to populate/animate nodes on a read operation.
	brc.get_node_for_read = function () {
		return this.search_nodes_for_script(true);
	};

	// A wrapper around get_script, which enables it to return a function
	// that will be run to get content asynchronously. Backwards compatible with
	// get_script calls that return a string
	brc.with_script = function (callback) {
		//handle when get_script returns text
		var my_script = this.get_script();
		if (typeof my_script === "string") {
			callback(my_script);
		}

		//handle when get_script returns a function
		if (typeof my_script === "function") {
			my_script(callback);
		}
	};

	/**
	 * EXAMPLE:
	 * this.get_script = function() {
	 *  return document.getElementById("my-textarea").value;
	 * }
	 *
	 * this.get_script = function() {
	 *  var finder = function(callback) {
	 *    br_load.get(url, param, function(data) {
	 *      callback(data);
	 *    });
	 *  };
	 *
	 *  return finder;
	 * }
	 **/
	// Get script is responsible for returning the contents of a textarea, file, or
	// other element that we want to version control. It can return either a string
	// representing the body of the script, or else a function that will call a nested
	// callback with the value of the script.
	brc.get_script = function () {
		var script = this.search_nodes_for_script(false);
		script = script ? script : "/* Put your script here */";
		return script;
	};
	/**
	 * @return {String} The hostname of the current page
	 */
	brc.get_hostname = function () {
		return window.content.document.location.hostname;
	};

	/**
	 * @return {String} The filename that we will use to save the file
	 */
	brc.get_filename = function () {
		return "unknown_file";
	};
	/**
	 * @return {String} The extension of the file be saved, including the period (".txt")
	 */
	brc.get_extension = function () {
		return ".txt";
	};

	/**
	 * @return {String} The localized directory that the we will use to save the file
	 */
	brc.get_local_directory = function () {
		return "";
	};
	/**
	 * @return {String} The full, absolute directory to be used by the editor
	 */
	brc.get_full_local_directory = function () {
		var root = this.get_local_root();
		var dir = this.get_local_directory();
		return root + "\\" + dir;
	};
	/**
	 * @return {String} The directory of the repository on the local filesystem
	 */
	brc.get_local_root = function () {
		return this.get_temp_directory().path + "\\" + this.get_hostname();
	};
	/**
	 * @return {String} The URI of the remote repository
	 */
	brc.get_remote_directory = function () {
		return br_utils.url_object(br_global.remote_root);
	};

	// The file system directory where we store local copies.
	brc.get_temp_directory = function () {
		var file_location;

		br_global.temp_dir = typeof br_global.temp_dir === "string" ? br_global.temp_dir : "";

		if (br_global.temp_dir !== "") {
			file_location = br_utils.create_local_file(br_global.temp_dir);
		}

		if (!file_location) {
			file_location = br_utils.get_special_file("TmpD");
		}

		br_utils.append_all(file_location, this.get_hostname());
		br_utils.append_all(file_location, this.get_local_directory());
		return file_location;
	};

	// #### Functions to enable the default menu
	brc.get_menu = function () {
		var me = this;
		//this.auto_sync(me);

		var m = br_menu(me.doc, me)
			.add_separator("br_editing", "Editor")
			.add_button_with_icon("br_open_temp", "Open in Editor", "Open",
				"chrome://sangfroid/content/img/edit.png", function () {
				me.open_temp_file();
			})
			.add_button_with_icon("br_read_temp", "Read from Editor", "Read",
				"chrome://sangfroid/content/img/restore.png", function () {
				me.read_from_file();
			})
			.add_button_with_icon("br_open_debug", "Open Debug Output", "Debug",
				"chrome://sangfroid/content/img/bug.png", function () {
				me.open_debug_file();
			})
			/*.add_button_with_icon("br_open_ref", "Open References", "Ref",
				"chrome://sangfroid/content/img/link.png", function () {
				me.open_references();
			})*/
			/*AH - Currently not approved
			.add_separator("br_synching", "Remote Repository")
			.add_button_with_icon("br_sync","Sync with Server", "Sync",
			"chrome://sangfroid/content/img/save.png",function() { me.save_and_sync(); } )
			.add_button_with_icon("br_history","View Versions", "View",
			"chrome://sangfroid/content/img/find.png", function(){ me.view_revisions(); });
			 */
			return m;
	};

	/* AH - no more repo
	// Wrap call to repository functions
	brc.get_repo = function(context) {
	//context - can be changed to create sandbox for unit tests
	context = context || window;

	var res = br_repo(this, context);

	return res;
	};
	 */

	// Called when "Open in Editor" is clicked. Save current script to
	// temp directory, then open in selected editor.
	brc.open_temp_file = function () {
		var me = this;

		br_log.firebug("DEFAULT_OPEN_TEMP_FILE: " + me.get_script_type());
		me.with_script(function (my_script) {
			var file_location = me.get_temp_directory();
			br_editor.saveFileToDisk(file_location.path, me.get_filename() + me.get_extension(), my_script);
			br_editor.launchEditor(file_location.path, me.get_filename() + me.get_extension());
			me.pub("open-complete");
		});
	};
	
	brc.open_debug_file = function () {
		var me = this;
		var my_debug = "Print data:\r\n";
		jQuery("ol.debugger-list-display > li",doc).each(function(n,m){
		  my_debug = my_debug + (n+1).toString() + ". " + jQuery(this).html().replace(/\&nbsp;/g, " ") + "\r\n";
		});
		my_debug = my_debug + "Return data:" + "\r\n";
		ret = jQuery("span.bmx-returnColor.wrap-break-word",doc).html();
		ret2 = jQuery("pre.wrap-break-word",doc).html();
		ret3 = jQuery("p.console-result.wrap-break-word",doc).html();
		if(ret2) ret = ret2;
		if(ret3) ret = ret3;
		if(!ret) ret = "";
		my_debug = my_debug + ret.replace(/\&nbsp;/g, " ") + "\r\n";
		
		var file_location = me.get_temp_directory();
		br_editor.saveFileToDisk(file_location.path, me.get_filename() + "_debug_ouput.txt", my_debug);
		br_editor.launchEditor(file_location.path, me.get_filename() + "_debug_ouput.txt");
		me.pub("open-complete");
	};
	
	/*brc.open_references = function () {
		var me = this;
		
	};*/

	/**
	 * @param url {String} Contains the URL of the where to find the content
	 */
	// This function is called by the rails overlay to read data into the content
	// pane. Passes in a URL where we can find the content, it is then up to the
	// plugin to download the data and make use of it.
	brc.restore = function (url) {
		var node = this.get_node_for_read(),
		me = this;

		if (url && node) {
			this.jQuery.get(url, null, function (data) {
				node.value = data.content;

				var str = "Reverted to Version Number: " + data.revert_to_version;
				str += "<br/> From Site: " + data.root_url;

				br_log.firebug("DEFAULT_RESTORE: " + me.get_script_type());

				br_display.displayMessage(str);
				br_display.show_success_effect(node);
				node.focus();
				me.pub("restore-complete");
			});
		}
	};

	/**
	 * EXAMPLE
	 * var el = doc.getElementsByTagName("input")[0];
	 * send_event_to_page(el, "change");
	 */
	// Want to fire an existing buttons "click", "change", or "load"
	// event? Use this function.
	function send_event_to_page(element, evt_type) {
		if (element instanceof this.jQuery) {
			element = this.jQuery(element).get(0);
		}

		var evt = document.createEvent("HTMLEvents");
		evt.initEvent(evt_type, false, false);
		element.dispatchEvent(evt);
	}

	/**
	 *
	 * @see br_editor#readFile
	 * @see br_display#show_success_effect
	 */
	// This function is called when "Read from File" is clicked. By default it will
	// load the associated file from the file system into a node, and then show a
	// success effect on that node when complete.
	brc.read_from_file = function (dir) {
		dir = dir || this.get_temp_directory().path;

		var file_value = br_editor.readFile(dir, this.get_filename() + this.get_extension());
		var node = this.get_node_for_read();

		if (node && file_value) {
			node.value = file_value;
			node.focus();

			// firing onchange event programmatically
			// since this often won't be fired when set by js
			send_event_to_page(node, "change");

			br_log.firebug("DEFAULT_READ_FROM_FILE: " + this.get_script_type());
			br_display.show_success_effect(node);
			this.pub("read-complete");
		} else {
			br_log.error("There was a problem reading from the file.");
		}
	};

	// Called by "Sync" being clicked. Show a prompt to allow user to save
	// patch to server.
	/*AH - why are there two?
	brc.save_and_sync = function(callback, auto) {
	var me = this;

	//br_log.firebug("DEFAULT_OPEN_TEMP_FILE: "+ me.get_script_type());
	me.with_script(function(my_script) {
	var file_location = me.get_temp_directory();
	br_editor.saveFileToDisk( file_location.path, me.get_filename() + me.get_extension(), my_script );
	//br_editor.launchEditor( file_location.path, me.get_filename() + me.get_extension() );
	//me.pub("open-complete");
	jQuery
	});
	}
	 */
	/* AH Rebuilding
	brc.save_and_sync = function(callback, auto) {
	var repo = this.get_repo(), me = this;
	callback = callback || function() { me.pub("sync-starting"); };
	repo.prompt_and_sync(callback, auto);
	br_log.firebug("DEFAULT_SAVE_AND_SYNC: "+ this.get_script_type());
	};
	 */
	//AH - save_and_sync testing
	brc.save_and_sync = function (callback, auto) {
		var me = this;
		br_log.notify("Opening File Manager...");
		me.with_script(function (my_script) {
			//save code to temp folder
			var d = new Date();
			var file_location = me.get_temp_directory();
			var file_name = me.get_filename() + "." + d.getTime() + ".txt";
			br_editor.saveFileToDisk(file_location.path, file_name, my_script);
			//base url
			var url = doc.location.href;
			var end = url.indexOf(".com") + 5;
			url = url.substring(0, end);
			//make edit folder page frame
			jQuery('body', doc).append("<iframe hidden name='make_folder_frame' id='make_folder_frame' src='" + url + "admin/filemanager/edit_folder.jsp'/>");
			jQuery('#make_folder_frame', doc).bind("load", function () {
				var frame = jQuery('#make_folder_frame', doc).contents();
				//get folderID of script folder with a promise
				var defer = Q.defer(),
				id_found = defer.promise;
				id_found = me.find_folder_id(frame);
				id_found.then(function (folderID) {
					//file manger frame so we can open the folder
					jQuery('body', doc).append("<iframe hidden name='folder_frame' id='folder_frame' src='" + url + "admin/filemanager/list_files.jsp?_bm_trail_refresh_=true'/>");
					jQuery('#folder_frame', doc).bind("load", function () {
						var frame2 = content.frames['folder_frame'].document;
						//are we done?
						if (jQuery("a:contains('" + file_name + "')", frame2).length !== 0) {
							//yes, we're done.
							br_log.notify("File \"" + file_name + "\" Saved.");
							jQuery("#folder_frame", doc).remove();
							jQuery("#make_folder_frame", doc).remove();
							jQuery(this).unbind();
						} else {
							//upload the file
							var form = frame2.bmForm;
							form.folder_id.value = folderID;
							form.curpos.value = 0;
							form.submit();
							var $upload = jQuery("input[name='id']", frame2);
							$upload.attr("value", file_location.path + "\\" + file_name);
							var element = jQuery("#add_file", frame2).closest("table");
							var evt_type = "click";
							if (element instanceof jQuery) {
								element = jQuery(element).get(0);
							}
							var evt = document.createEvent("HTMLEvents");
							evt.initEvent(evt_type, false, false);
							element.dispatchEvent(evt);
						}
					});
				});
			});
		});
	};

	//AH - view_revisions testing
	brc.view_revisions = function () {
		var me = this;
		br_log.notify("Opening File Manager...");
		//Remove menu if it was left open
		jQuery("#file_selector_div", doc).remove();
		me.with_script(function (my_script) {
			var file_name_prefix = me.get_filename();
			//base url
			var url = doc.location.href;
			var end = url.indexOf(".com") + 5;
			url = url.substring(0, end);
			//make edit folder page frame
			jQuery('body', doc).append("<iframe hidden name='make_folder_frame' id='make_folder_frame' src='" + url + "admin/filemanager/edit_folder.jsp'/>");
			jQuery('#make_folder_frame', doc).bind("load", function () {
				var frame = jQuery('#make_folder_frame', doc).contents();
				//get folderID of script folder with a promise
				var defer = Q.defer(),
				id_found = defer.promise;
				id_found = me.find_folder_id(frame);
				id_found.then(function (folderID) {
					var urls = [];
					//file manger frame so we can open the folder
					jQuery('body', doc).append("<iframe hidden name='folder_frame' id='folder_frame' src='" + url + "admin/filemanager/list_files.jsp?_bm_trail_refresh_=true'/>");
					jQuery('#folder_frame', doc).bind("load", function () {
						var frame2 = content.frames['folder_frame'].document;
						br_log.notify("Loading Archived Data...");
						//do we have files on this page?
						if (jQuery("a:contains('" + file_name_prefix + "')", frame2).length !== 0) {
							//yes, we should store them
							jQuery("a:contains('" + file_name_prefix + "')", frame2).each(function (index) {
								//append stuff to urls
								if (urls.length <= 10) {
									br_log.firebug(jQuery(this).html());
									urls.push(jQuery(this).html());
								} else {
									//check the select box
									jQuery(this).parent().parent().find("input[type='checkbox']", frame2).attr("checked", "true");
								}
							});
						}
						if (jQuery("input[type='checkbox']", frame2).is(':checked')) {
							//delete excess files
							var element = jQuery("#delete", frame2).closest("table");
							var evt_type = "click";
							if (element instanceof jQuery) {
								element = jQuery(element).get(0);
							}
							var evt = document.createEvent("HTMLEvents");
							evt.initEvent(evt_type, false, false);
							element.dispatchEvent(evt);
						} else if (jQuery("input[name='folder_id']", frame2).val() != folderID) {
							//oh yeah, i need to go to the right folder
							var form = frame2.bmForm;
							form.folder_id.value = folderID;
							form.curpos.value = 0;
							form.submit();
						} else if (jQuery("a#next_iter_link", frame2).length > 0) {
							//hit next
							var form = frame2.bmForm;
							form.curpos.value = parseInt(form.curpos.value) + 10;
							form.submit();
						} else if (urls.length > 0) {
							//peace, we out.
							br_log.notify("Data retrieved.");
							//build open interface - should probably be done with an html file
							jQuery("#br_menu_div", doc).append("<div id='file_selector_div'/>");
							jQuery("#br_button_div", doc).addClass("expanded");
							jQuery("#file_selector_div", doc).append("<form id='file_selector_form'/>");
							jQuery("#file_selector_form", doc).append("<select id='file_selector_select' size=" + urls.length + ">");
							jQuery.each(urls, function (index) {
								var urlsArr = urls[index].split(".")
									var thisDate = new Date(parseInt(urlsArr[urlsArr.length - 2]));
								jQuery("#file_selector_select", doc).append("<option value='" + urls[index] + "'>" + thisDate.toLocaleDateString() + " " + thisDate.toLocaleTimeString() + "</option>");
							});
							jQuery("#file_selector_select", doc).css("height", "125px");
							jQuery("#file_selector_form", doc).append("<br/>");
							jQuery("#file_selector_form", doc).append("<input id='file_selector_open' type='button' value='Open'/>");
							jQuery("#file_selector_form", doc).append("<input id='file_selector_cancel' type='button' value='Cancel'/>");
							//click events for buttons
							jQuery("#file_selector_cancel", doc).bind("click", function () {
								jQuery("#file_selector_div", doc).remove();
							});
							jQuery("#file_selector_open", doc).bind("click", function () {
								jQuery.get(url + "bmfsweb/playground/image/~BML_BACKUP/" + jQuery("#file_selector_select", doc).val(), "", function (data) {
									var node = me.get_node_for_read();
									if (node) {
										node.value = data;
										node.focus();
										// firing onchange event programmatically
										// since this often won't be fired when set by js
										send_event_to_page(node, "change");
										br_display.show_success_effect(node);
										me.pub("read-complete");
										//clean up
										jQuery("#file_selector_div", doc).remove();
									} else {
										br_log.error("There was a problem reading from the file.");
									}
								});
							});
							jQuery("#folder_frame", doc).remove();
							jQuery("#make_folder_frame", doc).remove();
							jQuery(this).unbind();
						} else {
							br_log.notify("No Saved Data.");
						}
					});
				});
			});
		});
	};

	//used to make the script folder and/or get its id; returns promise
	//needs context, 'frame', of where to run jQuery
	brc.find_folder_id = function (frame) {
		var folder_name = "~BML_BACKUP";
		var defer = Q.defer(),
		id_found = defer.promise;
		var folderID = jQuery("option", frame).filter(function () {
				return jQuery(this).html() == folder_name;
			}).val();
		if (typeof folderID !== "string") {
			//make folder
			jQuery("input.form-input[name='name']", frame).attr("value", folder_name);
			var element = jQuery("#create", frame).closest("table");
			var evt_type = "click";
			if (element instanceof jQuery) {
				element = jQuery(element).get(0);
			}
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent(evt_type, false, false);
			element.dispatchEvent(evt);
			br_log.notify("Created Script Folder");
			//try to get it again
			folderID = jQuery("option", frame).filter(function () {
					return jQuery(this).html() == folder_name;
				}).val();
		}
		//resolve promise
		if (typeof folderID === "string") {
			br_log.firebug(folderID);
			defer.resolve(folderID);
		}
		return id_found;
	};

	// Called when "View Revisions" is clicked. Will open up a modal browser
	// element with a view into the Sangfroid server.
	/* AH - need to remake
	brc.view_revisions = function() {
	// pass in a reference to this plugin so that overlay knows what to load
	br_rails_overlay.show(this);
	br_log.firebug("DEFAULT_VIEW_REVISIONS: "+ this.get_script_type());
	};
	 */

	// Compare checksum to remote repository
	brc.get_file_status = function (repo, on_change, on_same) {
		repo.get_status(on_change, on_same);
	}

	brc.open_folder = function () {
		var dir = this.get_full_local_directory();
		var file = this.get_filename() + this.get_extension();
		br_editor.openContainingFolder(dir, file);
	};

	// These functions are called in order when the page is finished loading.
	brc.before_page_load = function () {
		br_log.firebug(br_global.current_plugins);
	};
	// Override this function to discard the default menu
	brc.on_page_load = function () {
		//this.initiate_display();
		brc.pub("page-load");
	};
	brc.after_page_load = function () {
		this.make_notification();
		this.initiate_display();
	};

	// Called when the tab is closed. Use this to clear any pub/subs
	// or events that have been bound by the plugin to avoid memory leaks.
	brc.on_page_unload = function (e) {
		brc.pub("page-unload");
		brc.clear();
	}

	/**
	 * This is run when the focus shifts to the current browser tab
	 */
	brc.on_tab_focus = function () {
		this.initiate_display();
	};
	/**
	 * Put radical performance boosting code here - user can easily disable by unchecking
	 * the "Faster" checkbox in options
	 */
	brc.faster = function () {};
	/**
	 * actions
	 */
	/**
	 * Creates a blank file on the disk
	 *
	 * @param {Boolean} safe If set to true, this function will not overwrite the existing file
	 */
	brc.create_file_on_disk = function (safe) {
		//alert(this.get_full_local_directory());
		br_editor.createFileOnDisk(this.get_full_local_directory(), this.get_filename() + this.get_extension(), safe);
	};

	/**
	 * @see br_editor#launchEditor
	 * @see #get_filename Called to determine the name of the file to view
	 * @see #get_extension Called to determine the name of the file to view
	 * @see #get_full_local_directory Called to determine the local file location of the repository
	 */
	brc.open_script_in_editor = function () {
		br_editor.launchEditor(this.get_full_local_directory(), this.get_filename() + this.get_extension());
	};
	// Called by on_page_load, by default this sets up the button panel with a set
	// of default buttons to interact with the editor and repository
	brc.initiate_display = function () {
		this.menu = this.get_menu();

		this.menu.render();
	};
	/**
	 * @return {Boolean} True if on_load should not be run again.
	 */
	// If the property "multiple_loads" is set to true for a given plugin,
	// this function can be used to keep the plugin from loading multiple times
	// on a given page.
	brc.plugin_created_successfully = function () {
		//return br_menu.is_rendered();
	};
	/**
	 * @param {String} Filename to cleaned before writing
	 * @return {String} Filename without spaces, slashes, colons, etc.
	 */
	// #### Functions for sanitizing data
	brc.filename_sanitize = function (fn) {
		//wipe out dangerous characters, spaces, slashes
		var str = fn || "";
		str = str.replace(/:/g, '_');
		str = str.replace(/ /g, '_');
		str = str.replace(/&gt;/g, '');
		str = str.replace(/\//g, '');
		str = str.replace(/\?/g, '_');

		return str;
	};
	/**
	 * @param {String} Directory name to cleaned before writing
	 * @return {String} Directory name without spaces, slashes, colons, etc.
	 */
	brc.directory_sanitize = function (dir) {
		//wipe out spaces
		var str = dir || "";
		str = str.replace(/ /g, '_');
		str = str.replace(/&gt;/g, '');
		str = str.replace(/:/g, '_');
		str = str.replace(/\?/g, '_');

		return str;
	};
	/**
	 * @param {Boolean} return_full_node If set to true, we return a reference to the node
	 * instead of just the text of the node
	 * @return {DOM} Node that holds the text if flag is set
	 * @return {String} String of the node if flag is false
	 */
	// This function returns the text of a textarea.
	//
	// It is pretty good at guessing where a BML script is found on the page.
	// If all the normal locations come up empty it defaults to returning the
	// textarea with the longest string.
	brc.search_nodes_for_script = function (return_full_node) {
		//start with list of nodes
		this.nodes = this.nodes || {};
		this.nodes = this.nodes.length > 0 ? this.nodes : br_utils.node_manager.findnodes(window.content.document);

		//return if we get nothing
		if (this.nodes.length < 1) {
			return false;
		}

		var script_node = br_utils.node_manager.find_node_with_script(this.nodes);

		//decide whether to return a whole node, or just a text value
		var script = return_full_node ? script_node : script_node.value;

		this.clean_nodes();

		return script;
	};

	// Avoid memory leaks from "find node" operations
	brc.clean_nodes = function () {
		//clearing the nodes to avoid memory issues
		delete this.nodes;
		this.nodes = null;
	};
	brc.clean = function () {
		delete this.nodes;
		delete this.parameters;

		this.nodes = this.parameters = null;
	};

	// A helper script for a default faster script for commerce editors.
	// Doesn't include BML Libraries
	//
	// Gets rid of syntax highlighting, folds up the attributes,
	// floats the button bar, and formats the result
	brc.commerce_script_default_faster = function () {
		try {
			var jQuery = this.jQuery,
			frame = jQuery("#frame_bm_script_id", doc).contents().get();
			if (jQuery("#container", frame).length > 0) {
				/*jQuery("#container",frame).remove();*/

				jQuery("table:last", doc).parent().parent().css({
					'background' : 'white',
					'position' : 'fixed',
					'bottom' : '1%',
					'right' : '1%'
				});

				br_display.create_toggle_link('#script>table:contains("System Variable Name"):first', 'br_toggle_attr', doc);
				br_display.format_result_pipes();
			}
		} catch (e) {
			//Be irresponsible. That's kind of the point of faster
			br_log.info(e);
		}
	};
	// #### Obsolete Functions
	// Kept here for convenience of legacy plugins
	brc.write_to_status_display = function (out, err) {
		br_log.error("Obsolete write_to_status_display");
	};
	brc.commit_if_status_change = function (commitMessage, do_prompt) {
		br_log.error("Obsolete this.commit_if_status_change");
	};
	brc.commit = function (commitMessage, do_prompt) {
		br_log.error("Obsolete this.commit");
	};
	brc.save_script_to_disk = function () {
		br_log.error("saveFileToDisk is obsolete.");
	};
	brc.auto_sync = function (me) {
		var doc = me.doc;
		var jQuery = me.jQuery;
		br_log.firebug("Config: " + jQuery("button:contains('Save and')", doc).length);
		br_log.firebug("Modify: " + jQuery("#save_and_close", doc).length);
		br_log.firebug("Library: " + jQuery("button:contains('Update')", doc).length);
		br_log.firebug(jQuery("#libraryEditorContainer", doc));
		if (jQuery("#save_and_close", doc).length > 0) {
			br_log.firebug("#save_and_close");
			var overlay = "<div id='overlay' class='overlay_save' style='background-color:#000000;opacity:0.3;left:0;top:0;z-index:49000;position:absolute;width:100%;height:100%'><div style='opacity:1;font-size:25px;position:absolute;left:40%;top:45%;color:#FFFFFF;'>Please wait...</div></div>";
			jQuery("body", me.doc).append(overlay);
			jQuery(".overlay_save", me.doc).hide();
			jQuery("#save_and_close", doc).closest("table.plain-button").hide();
			jQuery("#save_and_close", doc).closest("table.plain-button").attr("id", "comp_cs");
			jQuery("#save_and_close", doc).closest("table.plain-button").closest("td").prepend('<table cellspacing="0" cellpadding="0" class="plain-button" style="cursor: pointer;"><tbody><tr><td class="button-left"><img src="/img/button10.gif" class="button-left"></td><td nowrap="true" class="button-middle"><div style="margin: 0px 0px 1px;"><a  id="save_and_close_comp" name="save_and_close_comp" class="button-text">Save and Close</a></div></td><td class="button-right"><img src="/img/button10.gif" class="button-right"></td></tr></tbody></table>');
			jQuery("#save_and_close_comp", doc).click(function () {
				setTimeout(function () {
					doc.getElementById("comp_cs").click();
					jQuery(".overlay_save", doc).hide();
					br_log.notify("The sync did not complete please finish it manually");
				}, 8000);
				jQuery(".overlay_save", doc).show();
				me.save_and_sync(function () {
					doc.getElementById("comp_cs").click();
					jQuery(".overlay_save", doc).hide();
				}, true);

			});
		} else if (jQuery("button:contains('Save and')", doc).length > 0) {
			br_log.firebug("New Save and Close");
			var update_id = jQuery("button:contains('Save and Close')", doc).closest("table").attr("id");
			var overlay = "<div id='overlay' class='overlay_save_and' style='background-color:#000000;opacity:0.3;left:0;top:0;z-index:49000;position:absolute;width:100%;height:100%'><div style='opacity:1;font-size:25px;position:absolute;left:40%;top:45%;color:#FFFFFF;'>Please wait...</div></div>";
			jQuery("body", me.doc).append(overlay);
			jQuery(".overlay_save_and", me.doc).hide();
			jQuery("#" + update_id, doc).hide();
			jQuery("#" + update_id, doc).closest("td").prepend("<table cellspacing='0' role='presentation' class='x-btn x-component  x-btn-text-icon ' id='update_comp' style='margin-right: 5px;'><tbody class='x-btn-small x-btn-icon-small-left'><tr><td class='x-btn-tl'><i>&nbsp;</i></td><td class='x-btn-tc'></td><td class='x-btn-tr'><i>&nbsp;</i></td></tr><tr><td class='x-btn-ml'><i>&nbsp;</i></td><td class='x-btn-mc'><em unselectable='on' class=''><button style='position: relative; width: 99px;' type='button' class='x-btn-text ' tabindex='0'>Save and Close<img border='0' style='width: 16px; height: 16px; background: url(&quot;https://playground.bigmachines.com/img/bmx/icons/fugue/disk_black.png&quot;) no-repeat scroll 0px 0px transparent; position: absolute; left: -19px; top: -2px;' src='https://playground.bigmachines.com/gwt/ConfigRuleEditor/clear.cache.gif' role='presentation' class=' x-btn-image'></button></em></td><td class='x-btn-mr'><i>&nbsp;</i></td></tr><tr><td class='x-btn-bl'><i>&nbsp;</i></td><td class='x-btn-bc'></td><td class='x-btn-br'><i>&nbsp;</i></td></tr></tbody></table>");
			jQuery("#update_comp", doc).click(function () {
				setTimeout(function () {
					doc.getElementById(update_id).click();
					jQuery(".overlay_save", doc).hide();
					br_log.notify("The sync did not complete please finish it manually");
				}, 8000);
				br_log.firebug(jQuery("#overlay_save_and", doc));
				jQuery(".overlay_save_and", doc).show();
				me.save_and_sync(function () {
					doc.getElementById(update_id).click();
					jQuery(".overlay_save_and", doc).hide();
				}, true);

			});
		} else if (jQuery("button:contains('Update')", doc).length > 0 && jQuery("#libraryEditorContainer", doc).length > 0) {
			br_log.firebug("Library Update");
			var overlay = "<div id='overlay' class='overlay_apply' style='background-color:#000000;opacity:0.3;left:0;top:0;z-index:49000;position:absolute;width:100%;height:100%'><div style='opacity:1;font-size:25px;position:absolute;left:40%;top:45%;color:#FFFFFF;'>Please wait...</div></div>";
			jQuery("body", me.doc).append(overlay);
			jQuery(".overlay_apply", me.doc).hide();
			var update_id = jQuery("button:contains('Update')", doc).attr("id");
			jQuery("#" + update_id, doc).closest("table.x-btn").hide();
			jQuery("#" + update_id, doc).closest("table.x-btn").closest("td").prepend('<table id="update_comp" cellspacing="0" cellpadding="0" border="0" class="x-btn-wrap x-btn x-btn-text-icon  x-btn-focus"  style="width: 75px;"><tbody><tr><td class="x-btn-left"><i>&nbsp;</i></td><td class="x-btn-center"><em unselectable="on"><button type="button" class="x-btn-text bmx-accept" >Update</button></em></td><td class="x-btn-right"><i>&nbsp;</i></td></tr></tbody></table>');
			jQuery("#update_comp", doc).click(function () {
				setTimeout(function () {
					doc.getElementById(update_id).parentNode.parentNode.parentNode.parentNode.parentNode.click();
					jQuery(".overlay_save", doc).hide();
					br_log.notify("The sync did not complete please finish it manually");
				}, 8000);
				jQuery(".overlay_apply", me.doc).show();
				me.save_and_sync(function () {
					doc.getElementById(update_id).parentNode.parentNode.parentNode.parentNode.parentNode.click();
					jQuery(".overlay_apply", me.doc).hide();
				}, true);

			});
		}

	};
	/* AH Page Downloading/Opening Utilities */
	brc.open_url_in_editor = function (filename, url, error) {
		var that = this;
		link_found = that.find_valid_url([url], error);
		link_found.then(function (link) {
			that.page_download(link, function (file_text) {
				var file_location = that.get_temp_directory();
				br_editor.saveFileToDisk(file_location.path, "bm." + filename + ".xml", file_text);
				br_editor.launchEditor(file_location.path, "bm." + filename + ".xml");
			});
		});
	};

	brc.page_download = function (page_url, callback) {
		jQuery.ajax({
			url : page_url,
			type : 'GET',
			dataType : 'text',
			timeout : 15000, // timed out for large quotes. MX change
			error : function () {
				alert('Error loading document');
			},
			success : callback
		});
	};

	brc.get_document_xml_url = function (callback,bs_id) {
		var that = this;
		
		var admin_url = that.get_xsl_url(true);

		jQuery.get(admin_url, function (responseTxt) {
			//This gets called when the list of xsl views page is asynchronously fetched. Using string ops, get a valid xsl link url.
			//The XSL link url is fetched to allow me to then fetch the xsl id
			if(typeof bs_id === "undefined") {
				bs_id = jQuery("input[name='id']", doc).attr("value");
			}
			br_log.firebug(bs_id);
			br_log.firebug(that.bs_id);
			br_log.firebug(this.bs_id);
			var contentToLookFor = "edit_xslt.jsp?id=";
			var pos1 = responseTxt.indexOf(contentToLookFor);
			var posEnd = pos1 + contentToLookFor.length + 15; //random number.
			var strExtract = responseTxt.substring(pos1, posEnd);

			var newPos1 = contentToLookFor.length;
			var newPosEnd = strExtract.indexOf("\"");
			var xsl_id = strExtract.substring(newPos1, newPosEnd);

			//We now have the xsl_Id as well as the bs_id. We are good to go and get the Doc XML.

			var view_type = "document";
			//var bs_id = jQuery("input[name='id']", doc).attr("value");

			var url = that.get_hostname_prefix() + "admin/commerce/views/preview_xml.jsp?bs_id=" + bs_id + "&xslt_id=" + xsl_id + "&view_type=" + view_type;
			callback(url);
		});
	};

	brc.on_quote_page = function () {
		var validSubUrls = ["commerce/buyside/document.jsp", "/commerce/new_equipment/products/model_configs.jsp"];

		var isUrlMatchFound = false;
		for (var j = 0; j < validSubUrls.length; j++) {
			if (content.document.baseURI.indexOf(validSubUrls[j]) > 0) {
				isUrlMatchFound = true;
				break;
			}
		}

		if (isUrlMatchFound) {
			var idEls = content.document.getElementsByName("id");
			if (idEls.length > 0 && idEls[0].tagName === "INPUT") {
				if (!isNaN(idEls[0].value)) {
					return true;
				}
			}
		}
		return false;
	};

	brc.find_valid_url = function (urls, msg, valid_test) {
		var defer = Q.defer(),
		link_found = defer.promise;

		msg = typeof msg !== "undefined" ? msg : "Invalid URL";
		//lets user pass in a callback to guarantee the url is proper
		valid_test = typeof valid_test === "function" ? valid_test : function (data) {
			return true;
		};

		urls.forEach(function (link) {
			jQuery.ajax({
				url : link,
				data : {},
				method : 'get',
				success : function (data) {
					var valid = valid_test(data);
					Q.when(valid, function (is_valid) {
						if (is_valid) {
							defer.resolve(link, data);
						}
					});
				},
				error : function () {
					br_log.notify(msg);
				}
			});
		});
		return link_found;
	};

	brc.make_notification = function () {
		var message = "";
		var level = "";
		var url = doc.location.href;
		var is_prod = br_utils.is_prod_site(url);
		if (is_prod) {
			message += "Don't Forget&#58; You're On PRODUCTION";
			level = "prod";
		}
		//br_log.firebug(jQuery("#br_notifypage_root", doc).html());
		//br_log.firebug(br_log.page_ready());
		if (message != "" && jQuery("#br_notifypage_root", doc).length == 0 && !br_log.page_ready())
			br_log.page(message, level);
	};

	brc.copyToClipboard = function (str) {
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(str);
	};

	brc.get_hostname_prefix = function () {
		var url = doc.location.href;
		var end = url.indexOf(".com") + 5;
		url = url.substring(0, end);

		return url;
	};

	brc.bs_id_clipboard = function () {
		var that = this;
		var val = jQuery("input[name='id']", doc).attr("value");
		that.copyToClipboard(val);
	};

	brc.get_xsl_url = function (no_copy) {
		var that = this;
		var url = that.get_hostname_prefix();
		var val = jQuery("input[name='bm_cm_process_id']", doc).attr("value");

		if (no_copy !== true) {
			that.bs_id_clipboard();
		}

		return url + "admin/commerce/views/list_xslt.jsp?process_id=" + val;
	};

	brc.get_history_url = function () {
		var that = this;
		var url = that.get_hostname_prefix();
		var val = jQuery("input[name='id']", doc).attr("value");

		return url + "admin/commerce/views/preview_xml.jsp?view_type=history&bs_id=" + val;
	};
	
	brc.do_proxy_login = function () {
		var that = this;
		var root = brc.get_hostname_prefix();
		var proxyPref = "admin";//br_utils.getPref("login_dest") || "admin";
		br_utils.loadLock("Searching for Proxy User...");
		//br_log.notify("Searching for Proxy User...");
		jQuery.get(root+"/internaladmin/index.jsp","",function(data){
			var testData = jQuery("<div/>",doc).append(data);
			var link = jQuery("td:contains('FullAccessWithESales')",testData).next().next().children().attr("href");

			if(!link) {
				br_log.error("Unable to proxy in - are you logged in using a service login? (Info: " + root+link + ")");
				br_utils.loadLock();
				return;
			}

			br_log.notify("Proxy User found, Logging in as Superuser...");
			
			br_utils.loadLock();
			jQuery.get(root+link,function(){
				if(proxyPref == "admin"){
					openUILink(root+"admin/index.jsp?sangfroid=awesome");
				}else if(proxyPref == "trans"){
					jQuery.get(root+"admin/commerce/processes/list_processes.jsp", function(page_data){
						var subdoc = jQuery(page_data, doc);
						var count = 0;
						jQuery("a[href*='edit_process.jsp?']", subdoc).each(function() {
							var processId = this.href.split("=")[1];
							if(jQuery("input[name='delete_list'][value='"+processId+"']",subdoc).length == 0 && count == 0){
								count = 1;
								firstProcessId = processId;
							}
						});
						if(firstProcessId == ""){
							openUILink(root+"admin/index.jsp?sangfroid=awesome");
							br_log.error("This site does not have a deployed Commerce Process");
						}else{
							openUILink(root+"commerce/buyside/commerce_manager.jsp?bm_cm_process_id="+firstProcessId);
						}
					})
				}else{
					openUILink(root);
				}
			});
		});
	};
}
	());
