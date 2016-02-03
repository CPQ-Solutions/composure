br_utils.create_plugin ({	
'name':'unknown file',
'author':'Michael Wheeler',
'description':'The default plugin that is run if no other plugin is recognized.',
'get_parameters':function(doc, jQuery) {
	return {};
},
'matches_page':function(params) {
	//this can always be false, the core plugin will select this plugin automatically
	return false;
},
'content':content_unknown_file, 
});
function content_unknown_file(params) {
	var jQuery = this.jQuery, doc = this.doc;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "unknown file";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};

	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		return "unknown_file";
	};
	//this.get_local_directory = function() {return br_bread.title_bar_by_count(this.parameters['action_name'], 2)+"\\";};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	this.get_extension = function() {return ".txt";};
	/**
	 * actions
	 */
	//this.send_to_editor = function() {	};
	this.on_page_load= function() {this.initiate_display();}
	this.initiate_display = function() {br_display.create_display_pane(this.get_script_type())};
}
content_unknown_file.prototype = new BR_Content();

