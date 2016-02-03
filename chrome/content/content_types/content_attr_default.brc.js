br_utils.create_plugin ({	
'name':'attribute default scripts',
'author':'Michael Wheeler',
'description':'Enables version control for an Attribute Default script within BigMachines.',
regex_urls: ['/admin/commerce'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	params.action_name = jQuery("td.bottom-bar", doc).html();
	params.attribute_id = jQuery("input[name='attribute_id']", doc).attr("value");
	params.action_id = jQuery("input[name='action_id']", doc).attr("value");
	params.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
			
	return params; 
},
'matches_page':function(p) {
	var cond1 = (p['action_name']||"").indexOf('Attribute :') > -1;
	var cond2 = p['cm_rule_meta_id'];
	var cond3 = p['action_id'];
	var cond4 = p['attribute_id'];
	
	return (cond1 && cond2 && !cond3 && cond4);
},
'content': content_attr_default,
});
function content_attr_default(params) {
		var jQuery = this.jQuery, doc = this.doc;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "attribute default";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = "Default-"+br_bread.title_bar_end(this.parameters['action_name']);
		f += '.' + this.parameters['attribute_id'];
		
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {
		return this.directory_sanitize(br_bread.title_bar_by_count(this.parameters['action_name'], 2)+"\\");
	};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".bml";};
	/**
	 * actions
	 */
	this.faster = function() {
		this.commerce_script_default_faster();
	}
	//this.send_to_editor = function() {};
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
}
content_attr_default.prototype = new BR_Content();
