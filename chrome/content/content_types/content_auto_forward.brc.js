br_utils.create_plugin ({	
'name':'auto_forward',
'author':'Michael Wheeler',
'description':'Enables version control for a Transition Rule script within BigMachines.',
regex_urls: ['/admin/commerce/rules'],
'get_parameters':function(doc, jQuery) {
	var params = {};

	params.action_name = jQuery("td.bottom-bar", doc).html();
	params.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
						
	return params;
},
'matches_page':function(p) {
	var cond1 = br_bread.title_bar_start(p['action_name']||"") == "Step";
	var cond2 = p['cm_rule_meta_id'];

	return (cond1 && cond2);
},
'content': content_auto_forward,
});



function content_auto_forward(params) {
		var jQuery = this.jQuery, doc = this.doc;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "auto_forward";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
	  //starting with this string:
	  //Step : Standard Commerce Process > Pending Area VP Review
 
		var f = br_bread.title_bar_by_count(this.parameters['action_name'], 2);
		f = jQuery.trim(f);
		
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {
	  //starting with this string:
	  // Transition Rule : Transaction > Submitted to Customer > Customer Service > Receive PO > Receive PO
		var d = "AutoForwarding\\";
		return this.directory_sanitize(d);
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
	//this.on_page_load = function() { this.initiate_display(); };
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
}
content_auto_forward.prototype = new BR_Content();
