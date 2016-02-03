// ### Obsolete old menu ###
// BR_Menu is obsolete, use br_menu instead. Function to throw descriptive error.
var BR_Menu = function (doc, me) {
	var name = me && me.get_script_type && me.get_script_type();
	throw new Error("Plugin '" + name + "' called BR_Menu function. Please fix capitalization - use br_menu instead.");
},

// ## br_menu object ##
// This is the default menu library. Create an instance
// then call the chaining methods to build your menu. Render draws it on the
// provided document object.
//
// The menu takes a document object to represent the page to be rendered on,
// as well as a plugin object that will be accessible through the menu options.
//
/**
 * EXAMPLE:
 * var m = br_menu(me.doc, me)
 *   .add_separator("br_editing", "Editor")
 *   .add_button_with_icon("br_open_temp","Open in Editor", "Open",
 *         "chrome://sangfroid/content/img/edit.png", function() { me.open_temp_file(); })
 *   .add_button_with_icon("br_read_temp","Read from Editor", "Read",
 *         "chrome://sangfroid/content/img/restore.png", function() { me.read_from_file(); } )
 *   .add_separator("br_synching", "Remote Repository")
 *   .add_button_with_icon("br_sync","Sync with Server", "Sync",
 *         "chrome://sangfroid/content/img/save.png",function() { me.save_and_sync(); } )
 *   .add_button_with_icon("br_history","View Versions", "View",
 *         "chrome://sangfroid/content/img/find.png", function(){ me.view_revisions(); });
 *
 *  m.render();`
 **/
br_menu = function (doc, me) {
	if (!doc) {
		throw new Error("Error creating menu: document not provided.");
	}
	var jQuery = me.jQuery;
	if (!jQuery) {
		throw new Error("Error creating menu: plugin with local jQuery not provided.");
	}
											 
	var widget_list = [],
	html_ready,
	css_ready,
	templates_ready,
	dom = br_dom(jQuery);

	// br_load is used to grab our templates
	css_ready = br_load.css("resource://br_templates/menu.css");
	html_ready = br_load.template("resource://br_templates/menu.html");

	// templates_ready combines the HTML and CSS into one promise
	templates_ready = Q.join(css_ready, html_ready, function (css, html) {
			return {
				css : css,
				html : html
			};
		});

	function add_widget(obj, before) {
		if (get_index_from_id(obj.id) > -1) {
			return;
		}

		if (before) {
			insert_widget(obj, before);
		} else {
			widget_list.push(obj);
		}
	}

	function insert_widget(obj, before) {
		var before_index = get_index_from_id(before);

		if (before_index > -1) {
			widget_list.splice(before_index, 0, obj);
		} else {
			widget_list.push(obj);
		}
	}

	function replace_widget(id, obj) {
		var index = get_index_from_id(id);

		if (index > -1) {
			widget_list[index] = obj;
		}
	}

	function remove_widget(id) {
		var index = get_index_from_id(id);
		if (index > -1) {
			br_utils.remove(widget_list, index);
		}
	}

	function move_widget(id, before) {
		var curr_index = get_index_from_id(id);
		var temp = widget_list[curr_index];
		br_utils.remove(widget_list, curr_index);
		insert_widget(temp, before);
	}

	function get_index_from_id(id) {
		for (var i = 0, ii = widget_list.length; i < ii; i++) {
			if (id === widget_list[i].id) {
				return i;
			}
		}
		return -1;
	}

	function bind_to_button(element, click) {
		var new_click = function () {
			click();
			return false;
		};

		dom.add_click_function(element, new_click, doc);
	}
	function toggle_menu() {
		var button_div = doc.getElementById("br_button_div");
		jQuery(button_div).toggleClass("expanded");
	}
	function bind_clicks() {
		var menu = doc.getElementById("br_menu_div"),
		curr_element,
		curr_function;

		dom.add_click_function(menu, toggle_menu, doc);

		for (var i = 0, ii = widget_list.length; i < ii; i++) {
			if (widget_list[i].type === "button") {
				curr_function = widget_list[i].click;
			} else if (widget_list[i].type === "dropdown") {
				//will be turned into "return false" later
				curr_function = function () {};
			} else {
				//skip everything else
				continue;
			}
			curr_element = doc.getElementById(widget_list[i].id);
			jQuery(curr_element).css("cursor","pointer");
			bind_to_button(curr_element, curr_function);
		}
	}

	function render_menu() {
		// The templates ready promise is used here, to make sure the menu is
		// loaded before rendering.
		return Q.when(templates_ready, function (data) {
			destroy_menu();
			
			var head = doc.head;
			head = head || doc.getElementsByTagName("head")[0];

			var completed_menu = data.html({
					widget : widget_list
				});
			
			data.css.innerHTML = br_utils.replaceCSSPrefs(data.css);
			
			dom.append(head, data.css);
			dom.append(doc.body, completed_menu);
			
			bind_clicks();
		});
	}

	function destroy_menu() {
		if (is_rendered(jQuery, doc)) {
			jQuery("#br_menu_div", doc).remove();
		}
	}

	function is_rendered() {
		return br_menu.is_rendered(jQuery, doc);
	}

	// ### Public interface starts here ###
	return {
		/* ####id
		 * will be the HTML Element ID of the button. Can be used to refer to it later
		 * ####before
		 * is the id of another element in the menu that you want to insert before
		 * ####icon
		 * is the url of an image
		 * ####click
		 * is the callback to be fired when the button is clicked
		 */
		add_button_with_icon : function (id, label, short_label, icon, click, before) {
			var button = {
				type : "button",
				id : id,
				label : label,
				short_label : short_label,
				icon : icon,
				click : click
			};
			add_widget(button, before);

			return this;
		},
		add_button : function (id, label, click, before) {
			var button = {
				type : "button",
				id : id,
				label : label,
				short_label : null,
				icon : "resource://br_images/default.png",
				click : click
			};
			add_widget(button, before);

			return this;
		},
		replace_button : function (id, label, icon, click) {
			var button = {
				type : "button",
				id : id,
				label : label,
				short_label : null,
				icon : icon,
				click : click
			};
			replace_widget(id, button);

			return this;
		},
		/* ####id
		 * will be the HTML Element ID of the button. Can be used to refer to it later
		 * ####before
		 * is the id of another element in the menu that you want to insert before
		 * ####values
		 * represents the dropdown values in the format:
		 *	[ {'value':'header','label':'Header'},
		 *	{'value':'footer','label':'Footer'} ];
		 */
		add_dropdown : function (id, values, before) {
			var dropdown = {
				type : "dropdown",
				id : id,
				values : values
			};
			add_widget(dropdown, before);

			return this;
		},
		replace_dropdown : function (id, values) {
			var dropdown = {
				type : "dropdown",
				id : id,
				values : values
			};
			replace_widget(id, dropdown);

			return this;
		},
		add_separator : function (id, label, before) {
			var separator = {
				type : "separator",
				id : id,
				label : label
			};
			add_widget(separator, before);

			return this;
		},
		remove : function (id) {
			remove_widget(id);

			return this;
		},
		move : function (id, before) {
			move_widget(id, before);

			return this;
		},
		render : function () {
			return render_menu();
		},
		get_list : function () {
			return widget_list;
		},
		is_rendered : is_rendered,
		destroy_menu : destroy_menu,
		doc : doc
	};
}

br_menu.is_rendered = function (jQuery, doc) {
	jQuery = jQuery || window.jQuery;
	doc = doc || window.content.document;
	return jQuery("#br_menu_div", doc).length > 0;
}
