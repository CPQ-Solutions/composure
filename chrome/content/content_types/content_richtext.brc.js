br_utils.create_plugin ({	
'name':'content_richtext',
'author':'Aaron Hall',
'description':'Open Rich Text Stuff In Editor',
'regex_urls': ["/spring/richtexteditor"],
/**
 * @param {DOM} doc The document object of the page that we are testing against
 * @return {Object} params A hashmap intended to hold information for identifying the page,
 */
'get_parameters':function(doc) {
	var params = {};
	
	params.url = doc.location.href;
	params.title = jQuery("title", doc).html();
	
	return params;
},
/**
 * @param {Object} params A hashmap, usually generated by get_parameters
 * @return {Boolean} True if this plugin should be used on this page
 */
'matches_page':function(params) {
	return true;
},
'content': content_richtext,
});
/**
 * @param {Object} params A hash map of information about the page
 * @extends BR_Content
 */
function content_richtext(params) {
	/**
	 * content and elements on page
	 */
	this.get_script = function() {
		var iframe_doc = jQuery("#richtext_Ed_Center_rte_ifr",doc)[0].contentWindow.document;
		
		return jQuery("body",iframe_doc).html();
	}
	this.get_script_type = function() {return "content_richtext";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	/**
	 * File naming and directories -
	 * 
	 * These functions are called whenever the plugin 
	 * is making a decision about where to save a file
	 */
	this.get_filename = function() {
		return "Rich_Text";
	};
	this.get_extension = function() {
		return ".html";
	};
	this.get_local_directory = function() {
		return "\\";
	};
	
	/**
	 * actions
	 */
	this.get_node_for_read = function() {
		var iframe_doc = jQuery("#richtext_Ed_Center_rte_ifr",doc)[0].contentWindow.document;
		
		return jQuery("body",iframe_doc).get(0);
	};
	
	this.get_menu = function() { 
		var me = this;
		//this.auto_sync(me);
		
		var m = br_menu(me.doc, me)
		  .add_separator("br_editing", "Editor")
		  .add_button_with_icon("br_open_temp","Open in Editor", "Open",
				"chrome://sangfroid/content/img/edit.png", function() { me.open_temp_file(); })
		  .add_button_with_icon("br_read_temp","Read from Editor", "Read",
				"chrome://sangfroid/content/img/restore.png", function() { me.read_from_file(); } );
		  //.add_separator("br_synching", "Remote Repository")
		  //.add_button_with_icon("br_sync","Sync with Server", "Sync",
			//	"chrome://sangfroid/content/img/save.png",function() { me.save_and_sync(); } )
		  //.add_button_with_icon("br_history","View Versions", "View", 
			//	"chrome://sangfroid/content/img/find.png", function(){ me.view_revisions(); });
		
		return m;
	};
	
	//need to change read behavior for html
	this.read_from_file = function(dir) {
		dir = dir || this.get_temp_directory().path;

		var file_value = br_editor.readFile(dir, this.get_filename() + this.get_extension());
		var node = this.get_node_for_read();
		
		if( node && file_value ) {
			br_log.firebug(typeof(file_value));
			jQuery(node).html(file_value);
			node.focus();

			// firing onchange event programmatically
			// since this often won't be fired when set by js
			//send_event_to_page(node, "change");

			br_log.firebug("DEFAULT_READ_FROM_FILE: "+ this.get_script_type());
			br_display.show_success_effect(node);
			this.pub("read-complete");
		} else {
			br_log.error("There was a problem reading from the file.");
		}
	};
}
content_richtext.prototype = new BR_Content();
