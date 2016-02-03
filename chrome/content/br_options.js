// This objects handles getting and setting options, as well as providing functionality to the
// preferences window.
var br_options = {
	/**
	 * @params {String} field_id The css id of the attribute this selector will populate
	 * @params {Integer} mode The mode of the picker, with the options:
	 *   0   Load a file or directory.
	 *   1   Save a file or directory.
	 *  2   Select a folder/directory.
	 *  3   Load multiple files
	 */
	// Open a filepicker to browse the file system.
	// Stolen from itsalltext
	pref_editor_select : function (field_id, mode, filter) {
		var locale = document.getElementById("strings"),
		pref_field = document.getElementById('pref_' + field_id),
		nsIFilePicker = Components.interfaces.nsIFilePicker,
		fp,
		initdir,
		rv,
		file,
		field;

		fp = Components.classes["@mozilla.org/filepicker;1"].
			createInstance(nsIFilePicker);

		//https://developer.mozilla.org/en/nsifilepicker
		//modes:
		//Constant   Value   Description
		//modeOpen   0   Load a file or directory.
		//modeSave   1   Save a file or directory.
		//modeGetFolder   2   Select a folder/directory.
		//modeOpenMultiple   3   Load multiple files
		fp.init(window, "Browse", mode);

		//fp.appendFilters(nsIFilePicker.filterApps);
		if (filter) {
			fp.appendFilter(filter, filter);
		}

		initdir = br_utils.create_local_file(pref_field.value);
		try {
			initdir = initdir.parent;
			if (initdir.exists() && initdir.isDirectory()) {
				fp.displayDirectory = initdir;
			}
		} catch (e) {
			// Ignore error, the pref may not have been set or who knows.
		}

		rv = fp.show();
		if (rv == nsIFilePicker.returnOK) {
			var str = br_options.get_files_from_fp(fp);
			pref_field.value = str;
			field = document.getElementById(field_id);
			field.style.color = 'inherit';
			field.style.backgroundColor = 'inherit';
		}
		br_options.refresh_prefs();
	},
	/**
	 * @param {FilePicker} fp Results of nsiFilePicker selection
	 */
	// Parse through the results of filepicker, return a string of all the paths
	get_files_from_fp : function (fp) {
		var files = fp.files;
		if (files.hasMoreElements()) {
			var paths = [];
			while (files.hasMoreElements()) {
				var arg = files.getNext().QueryInterface(Components.interfaces.nsILocalFile).path;
				paths.push(arg);
			}

			return paths.join(";");
		} else {
			var path = fp.file.path;
			return path;
		}
	},
	// Load firefox extension preferences dynamically. Called when Sangfroid starts,
	// and then again every time a preference is changed.
	refresh_prefs : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");

		br_global.local_root = pm.getCharPref("repo_dir");
		br_global.temp_dir = pm.getCharPref("temp_dir");
		br_global.text_editor = pm.getCharPref("text_editor");
		br_global.sangfroid_active = pm.getBoolPref("active");
		//make sure default
		pm.clearUserPref("curr_version");
		br_global.sangfroid_version = pm.getCharPref("curr_version");
		br_global.debug = pm.getBoolPref("debug");
		
		var temp = pm.getCharPref("hotbox_key");
		br_global.hotbox_hotkey = isNaN(parseInt(temp)) ? 32 : parseInt(temp);

		temp = pm.getCharPref("hotbox_modifier");
		br_global.hotbox_modifier = isNaN(parseInt(temp)) ? null : parseInt(temp);

		br_global.username = pm.getCharPref("username");

		//we actively avoid storing password
		br_global.password = "";
		pm.setCharPref("password", "");

		//br_global.remote_root = pm.getCharPref("remote_repo");            // MX
		br_global.faster = pm.getBoolPref("faster");

		//override for defaults
		//var def=pm.getBoolPref("default_plugins");
		br_global.plugin_dir = pm.getCharPref("plugin_dir");
		if (!br_global.plugin_dir || br_global.plugin_dir.length < 1) {
			br_global.plugin_dir = br_global.def_plugin_dir;
		}

		br_global.list_of_plugins = pm.getCharPref("list_of_plugins");

		/*if(br_global.remote_root.length < 1) {                          //MX
		br_options.show_credentials_page();
		}*/
		/* hotbox customization */
		for (p = 1; p <= 3; p++) {
			for (r = 1; r <= 3; r++) {
				for (c = 1; c <= 4; c++) {
					/*
					0 - key
					1 - label
					2 - type
					3 - url
					4 - tab
					 */
					var position = "p" + p + "-r" + r + "-c" + c;
					var thesePrefs = pm.getCharPref("hotbox_" + position).split("~");
					jQuery("#" + position + "_label").val(thesePrefs[1]);
					jQuery("#" + position + "_key").val("Key: " + thesePrefs[0]);
				}
			}
		}
	},
	/**
	 * @return {nsIPrefService} Preference manager object pointing to extensions.sangfroid
	 */
	// Gets an nsIPrefService, used to interface with Mozilla preferences.
	get_pref_manager : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		return pm;
	},
	/**
	 * @param {DOM} node Parent node that will be emptied of all nodes
	 */
	clear_child_nodes : function (node) {
		node = node || {};
		while (node.hasChildNodes()) {
			node.removeChild(node.firstChild);
		}
	},
	// Changes faster setting. Meant to be called from Context Menu
	toggle_faster : function () {
		var pm = br_options.get_pref_manager();
		var curr = pm.getBoolPref("faster");
		pm.setBoolPref("faster", !curr);

		br_global.faster = !curr;
	},
	/**
	 * @param {String} paths JSON formatted string to be saved in prefs
	 */
	set_plugin_prefs : function (paths) {
		jQuery("#br_list_of_plugins").val(paths);

		var pm = br_options.get_pref_manager();
		pm.setCharPref("list_of_plugins", paths);
	},
	// Fired the first time a new version of Sangfroid is opened
	new_version_action : function () {
		br_options.revert_to_default(true, true);
		br_utils.set_nav_bar_button();

		var timer = setTimeout(function () {
				gBrowser.selectedTab = gBrowser.addTab("");
			}, 5000);
	},
	// Check if there is an update that calls for a revert to default
	check_new_version : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		var pm_def = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getDefaultBranch("extensions.sangfroid.");

		var n = pm_def.getCharPref("new_version");
		var curr = pm.getCharPref("curr_version");
		var res = false;
		// If the version number has changed since last start...
		if (curr !== n) {
			res = true;
			// Reset version number
			pm.setCharPref("curr_version", n);
		}
		return res;
	},
	// Load plugins from default directory, overwrite existing plugins
	revert_to_default : function (skip_render, new_only) {
		//pass the value of the default plugin text field if it is available.
		var dir = document.getElementById("br_plugin_dir");
		dir = typeof dir === "object" && dir !== null ? dir.value : br_global.plugin_dir;

		// set to default if for whatever reason it is blank
		dir = dir || br_global.def_plugin_dir;

		var list = br_plugin_files();
		if (new_only === true) {
			list.get_new(dir);
		} else {
			list.revert(dir);
		}

		if (skip_render !== true) {
			br_options.render_plugins();
		}
	},
	// Pulls the list of paths out of preferences, and renders them in
	// XUL format. This is how we build the plugin list on the "Plugin"
	// tab in the preferences.
	render_plugins : function () {
		br_log.firebug("br_options.render_plugins call");
		/*
		var pm = br_options.get_pref_manager();
		var paths = pm.getCharPref("list_of_plugins");
		paths = JSON.parse(paths);
		var active_menu=document.getElementById("br_plugin_active_menu");
		br_options.clear_child_nodes(active_menu);

		var inactive_menu=document.getElementById("br_plugin_inactive_menu");
		br_options.clear_child_nodes(inactive_menu);
		var item;
		for(var i=0, ii=paths.length; i<ii; i++) {
		item = document.createElement("listitem");
		item.setAttribute("label", paths[i].file);
		item.setAttribute("value", paths[i].id);

		if(!paths[i].id) {
		item.setAttribute("class", "br_default");
		} else {
		item.setAttribute("class", "br_custom");
		}

		if(paths[i].active) {
		active_menu.appendChild(item);
		} else {
		inactive_menu.appendChild(item);
		}
		}
		 */
	},
	// Activate/inactivate Sangfroid entirely.
	toggle_status : function (listitem, set_active) {
		var list = new br_plugin_files();
		var filename,
		id;
		for (var i = 0, ii = listitem.length; i < ii; i++) {
			filename = listitem[i].label;
			id = parseInt(listitem[i].value);
			if (!id) {
				id = undefined;
			}

			if (set_active) {
				list.activate(id, filename);
			} else {
				list.inactivate(id, filename);
			}
		}
	},
	// Activate individual plugin
	activate : function () {
		var inactive_menu = document.getElementById("br_plugin_inactive_menu");
		br_options.toggle_status(inactive_menu.selectedItems, true);
		br_init.init_plugins();
		br_options.render_plugins();
	},
	// Deactivate individual plugin
	inactivate : function () {
		var active_menu = document.getElementById("br_plugin_active_menu");
		br_options.toggle_status(active_menu.selectedItems, false);
		br_init.init_plugins();
		br_options.render_plugins();
	},
	// This funcion is run when the Preferences window is loaded.
	window_ready : function () {
		br_init.loading_function();
		br_options.refresh_prefs();
		br_utils.add_jquery();
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");

		// Handle setting the HotBox preferences
		jQuery("#br_enter_hotkey").val(String.fromCharCode(br_global.hotbox_hotkey));

		jQuery("#br_enter_hotkey").keydown(function (e) {
			//do nothing
			return false;
		}).keyup(function (e) {
			//set the values
			jQuery(this).val(String.fromCharCode(e.which));
			pm.setCharPref("hotbox_key", "" + e.which);

			return false;
		});
	},
	/**
	 * hotbox customization tab functions
	 */
	//controls the page drop down
	change_hotbox_page : function () {
		var show_grid = document.getElementById("br_hotbox_pagenum").value;
		//hide all the grids
		jQuery("#p1").hide();
		jQuery("#p2").hide();
		jQuery("#p3").hide();
		//show selected grid
		if (jQuery("#p1").attr("id") == show_grid) {
			jQuery("#p1").show();
		} else if (jQuery("#p2").attr("id") == show_grid) {
			jQuery("#p2").show();
		} else if (jQuery("#p3").attr("id") == show_grid) {
			jQuery("#p3").show();
		}
		jQuery("#br_hotbox_customize_key menupopup menuitem").each(function () {
			jQuery(this).attr("hidden", "false");
		});
	},
	//controls customize action
	open_customization : function (thisId) {
		//get prefs manager
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		//MX highlight currently-selected key
		var thesePrefs = pm.getCharPref("hotbox_" + thisId).split("~");
		for (p = 1; p <= 3; p++) {
			for (r = 1; r <= 3; r++) {
				for (c = 1; c <= 4; c++) {
					// key = 0
					// label = 1
					// type = 2
					// url = 3
					// tab = 4
					var thisPos = "p" + p + "-r" + r + "-c" + c;
					if (thisId == thisPos) {
						jQuery("#" + thisPos + "_key").css("background-color", "#FFFF00");
					} else {
						jQuery("#" + thisPos + "_key").css("background-color", "");
					}
				}
			}
		}
		jQuery("#br_hotbox_customize_archetypes").val(thesePrefs[2]);
		//hide/show what's proper for this action type
		this.select_archetype();
		jQuery("#br_hotbox_customize_selected").val(thisId);
		jQuery("#br_hotbox_customize_key").val(thesePrefs[0]);
		jQuery("#br_hotbox_customize_label").val(thesePrefs[1]);
		jQuery("#br_hotbox_customize_url").val(thesePrefs[3]);
		//MX
		jQuery("#br_hotbox_customize_tab").val(thesePrefs[4]);
		br_options.unique_key(thisId);
	},
	//MX hide existing keys    thisid = "pX-rX-cX"    check each #position_key value then hide them in the dropdown menu
	unique_key : function (thisId) {
		var idArray = thisId.split("-");
		for (r = 1; r <= 3; r++) {
			for (c = 1; c <= 4; c++) {
				var keyValue = jQuery("#" + idArray[0] + "-r" + r + "-c" + c + "_key").val();
				if ("r" + r != idArray[1] || "c" + c != idArray[2]) {
					jQuery("#br_hotbox_customize_key menupopup menuitem").each(function () {
						if ("Key: " + jQuery(this).val() == keyValue) {
							jQuery(this).attr("hidden", "true");
						}
					});
				} else {
					jQuery("#br_hotbox_customize_key menupopup menuitem").each(function () {
						if ("Key: " + jQuery(this).val() == keyValue) {
							jQuery(this).attr("hidden", "false");
						}
					});
				}
			}
		}
	},
	//drop down for action type, hide and shows url area, pastes default name to label.
	select_archetype : function () {
		var check_val = document.getElementById("br_hotbox_customize_archetypes").value;
		jQuery("#br_hotbox_customize_label").val(jQuery("#br_hotbox_customize_archetypes").attr("label"));
		if (check_val == "custom") {
			jQuery(".br_hotbox_customize_urlgroup").show();
		} else {
			jQuery(".br_hotbox_customize_urlgroup").hide();
		}
	},
	// save action
	save_customization : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		var position = document.getElementById("br_hotbox_customize_selected").value;
		var key = document.getElementById("br_hotbox_customize_key").value;
		var label = document.getElementById("br_hotbox_customize_label").value;
		var type = document.getElementById("br_hotbox_customize_archetypes").value;
		var url = "";
		var tab = "";
		if (type == "custom") {
			//MX
			//tab = document.getElementById("br_hotbox_customize_tab").getAttribute("checked");
			tab = document.getElementById("br_hotbox_customize_tab").value;
			if (tab == "")
				tab = "newtab";
			url = document.getElementById("br_hotbox_customize_url").value;
		}
		jQuery("#" + position).val(key + "~" + label + "~" + type + "~" + url + "~" + tab);
		//MX save Key and Label then setCharPref
		jQuery("#" + position + "_label").val(label);
		jQuery("#" + position + "_key").val("Key: " + key);
		//needed to save prefs
		pm.setCharPref("hotbox_" + position, key + "~" + label + "~" + type + "~" + url + "~" + tab);
		//br_options.refresh_prefs();
	},
	//MX reset functions
	revert_customization : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		for (p = 1; p <= 3; p++) {
			for (r = 1; r <= 3; r++) {
				for (c = 1; c <= 4; c++) {
					// key = 0
					// label = 1
					// type = 2
					// url = 3
					// tab = 4
					var thisPos = "p" + p + "-r" + r + "-c" + c;
					pm.clearUserPref("hotbox_" + thisPos);
					var prefArray = jQuery("#" + thisPos).val().split("~");
					jQuery("#" + thisPos + "_label").val(prefArray[1]);
					jQuery("#" + thisPos + "_key").val("Key: " + prefArray[0]);
				}
			}
		}
	},
	revert_current_customization : function () {
		var position = document.getElementById("br_hotbox_customize_selected").value;
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		pm.clearUserPref("hotbox_" + position);
		var prefArray = jQuery("#" + position).val().split("~");
		jQuery("#" + position + "_label").val(prefArray[1]);
		jQuery("#" + position + "_key").val("Key: " + prefArray[0]);
	},
	revert_hotbox : function () {
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sangfroid.");
		pm.clearUserPref("hotbox_modifier");
		pm.clearUserPref("hotbox_key");
		jQuery("#br_hotbox_modifier").val("none");
		jQuery("#br_enter_hotkey").val("");
	},
	send_bug : function () {
		/*var user_name = jQuery("#br_bug_name").val();
		var type = jQuery("#br_bug_type > radio[selected='true']").attr("label");
		var desc = jQuery("#br_bug_desc").val();
		desc = type + ": " + desc;
		var api_url = "";
		var params = {username:user_name,description:desc,foundVersion:br_global.sangfroid_version};
		jQuery.ajax({
			type:"POST",
			url:api_url,
			data:params,
			dataType:"application/x-www-form-urlencoded",
			success:function(){alert("Feedback sent.");},
			error:function(){alert("Whoops, something went wrong.");},
			async:false
		});*/
	}
};
