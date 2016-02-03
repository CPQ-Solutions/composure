br_utils.create_plugin ({	
'name':'global function',
'author':'Michael Wheeler',
'description':'Enables version control for a Jython script within BigMachines.',
regex_urls: ['admin\/scripts\/edit_script.jsp'],
'get_parameters':function(doc, jQuery) {
	var params = {};

	params.url = doc.location.href;
	params.script_text = jQuery("textarea[name='script_text']", doc).val();
	params.variable_name = jQuery("input[name='variable_name']", doc).attr("value");
						
	return params;
},
'matches_page':function(p) {
	var cond1 = (p['url']||"").indexOf('admin\/scripts\/edit_script.jsp') > -1;	  
	var cond2 = p['script_text'];
	var cond3 = p['variable_name'];
	
	return cond1 && cond2 && cond3;
},
'content': content_jython,
});
function content_jython(params) {
		var jQuery = this.jQuery, doc = this.doc;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "global function";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {return this.filename_sanitize(this.parameters['variable_name']);};
	this.get_local_directory = function() {return "GlobalFunctions\\";};
	this.get_extension = function() {return ".py";};
	/**
	 * actions
	 */
	//this.send_to_editor = function() {	};
	//this.initiate_display = function() {br_display.create_display_pane()};
}
content_jython.prototype = new BR_Content();
