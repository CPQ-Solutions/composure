br_utils.create_plugin ({	
'name':'document default',
'author':'Michael Wheeler',
'description':'Enables version control for a Doc Default within BigMachines.',
regex_urls: ['/admin/commerce/rules'],
'get_parameters':function(doc, jQuery) {
	var params = {};

	params.action_name = jQuery("td.bottom-bar", doc).html();
	params.process_id = jQuery("input[name='process_id']", doc).attr("value");
	params.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
		
	return params;
},
'matches_page':function(p) {
	var cond1 = br_bread.title_bar_by_count( (p['action_name']||""), 0) == "Document";
	var cond2 = p['cm_rule_meta_id'];
	var cond3 = p['process_id'];
	
	return (cond1 && cond2 && cond3);
},
'content': content_doc_default,
});
function content_doc_default(params) {
		var jQuery = this.jQuery, doc = this.doc;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "document default";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = br_bread.title_bar_short_name(this.parameters['action_name']);
		f += '.' + this.parameters['process_id'];
		
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {return "DocumentDefaults"+"\\";};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".bml";};
	/**
	 * actions
	 */
	//this.send_to_editor = function() {};
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
	this.faster = function() {
		this.commerce_script_default_faster();
	}
	/**
	 * Identify myself
	 */
	this.get_parameters = function(doc) {
		this.parameters.action_name = jQuery("td.bottom-bar", doc).html();
		this.parameters.process_id = jQuery("input[name='process_id']", doc).attr("value");
		this.parameters.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
				
		return this.parameters;
	};
	/**
	 * @param doc - a dom object representing a web page
	 * @bool returns true if it tests the page against a list of parameters and finds a match
	 */
	this.matches_page = function() {
		var p = this.parameters;
		
		var cond1 = br_bread.title_bar_by_count( (p['action_name']||""), 0) == "Document";
		var cond2 = p['cm_rule_meta_id'];
		var cond3 = p['process_id'];
		
		return (cond1 && cond2 && cond3);
	};
	
}
content_doc_default.prototype = new BR_Content();
