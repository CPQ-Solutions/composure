br_utils.create_plugin ({	
'name':'forwarding rule',
'author':'Michael Wheeler',
'description':'Enables version control for a Forwarding Rule within BigMachines.',
regex_urls: ['/admin/rules'],
'get_parameters':function(doc,jQuery) {
	var params = {};
	
	params.title = jQuery("title", doc).html();
	params.action_name = jQuery("td.bottom-bar", doc).html();
		
	return params;
},
'matches_page':function(p) {
	var cond1 = (p['title']||"").indexOf('Area: Forwarded Group(s)') > -1;
	var cond2 = p['action_name'];

	return cond1 && cond2;
},
'content': content_forward_rule,
});
function content_forward_rule(params) {
		var jQuery = this.jQuery, doc = this.doc;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "advanced forward rule";};
	//this.get_script = function() {return this.search_nodes_for_script() || empty_script_string;};
	/**
	 * File naming and directories -
	 * 
	 * These functions are called whenever the plugin 
	 * is making a decision about where to save a file
	 */
	this.get_filename = function() {
		var fn = br_bread.title_bar_by_count( this.parameters['action_name'], 1 ) + 
						"-" +	
						br_bread.title_bar_end(this.parameters['action_name']);
		return this.filename_sanitize(fn);
	};
	this.get_extension = function() { return ".bml"; };
	this.get_local_directory = function() { return "Steps\\ForwardingRules\\" };
	/**
	 * Entry points - 
	 * These functions are called by the firefox plugin directly
	 */
	//this.on_launch_and_save = function() {	}
	/**
	 * actions
	 */
	this.faster = function() {
		this.commerce_script_default_faster();
	}
	//this.send_to_editor = function() {	};
	//this.initiate_display = function() {br_display.create_display_pane()};
}
content_forward_rule.prototype = new BR_Content();
