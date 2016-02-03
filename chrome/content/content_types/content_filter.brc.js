br_utils.create_plugin ({	
'name':'advanced filter script',
'author':'Kenny Browne',
'description':'Enables version control for an Advanced Filter script within BigMachines.',
regex_urls: ['customattributes/edit_field_script.jsp'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	params.title = jQuery("title", doc).html();
	params.action_name = jQuery("td.bottom-bar", doc).html();
	params.action_id = jQuery("input[name='action_id']", doc).attr("value");
	params.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
	
	return params;
},
'matches_page':function(p) {
	return (true);
},
'content': content_adv_filter,
});
function content_adv_filter(params) {
	var jQuery = this.jQuery, doc = this.doc;
	/**
	 * content and elements on page
	 */
	this.parameters = params;
	this.get_script_type = function() {
		br_log.firebug("5");
		return "advanced filter";
	}
	//this.get_script = function() {}
	//this.get_hostname = function() {}
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = "AdvFilter-"+br_bread.title_bar_by_count(this.parameters['action_name'], 0);
		f += '.' + br_bread.title_bar_by_count(this.parameters['action_name'], 1);
		return this.filename_sanitize(f);
	}
	this.get_local_directory = function() {
		var d = "AdvFilter\\";
		return this.directory_sanitize(d);
	}
	//this.get_remote_directory = function() {}
	this.get_extension = function() {
		return ".bml";
	}
	this.faster = function () {
		this.commerce_script_default_faster();
	}
	/**
	 * actions
	 */

//	this.on_page_load = function() {
//		this.get_menu().render();
//	}
	//this.send_to_editor = function () {}
	//this.initiate_display = function () {}
}
content_adv_filter.prototype = new BR_Content();
