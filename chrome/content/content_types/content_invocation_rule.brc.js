br_utils.create_plugin ({	
'name':'advanced modify invoaation',
'author':'Michael Wheeler',
'description':'Enables version control for an Advanced Modify script within BigMachines.',
regex_urls: ['/admin/commerce/rules'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	params.title = jQuery("title", doc).html();
	params.action_name = jQuery("td.bottom-bar", doc).html();
	params.action_id = jQuery("input[name='action_id']", doc).attr("value");
	params.cm_rule_meta_id = jQuery("input[name='cm_rule_meta_id']", doc).attr("value");
	
	return params;
},
'matches_page':function(p) {
	var cond1 = (p['action_name']||"").indexOf('Action :') > -1;
	var cond5 = (p['action_name']||"").indexOf('Invocation Rule :') > -1;
	var cond2 = (p['title']||"").indexOf('Area: Validations') > -1;
	var cond3 = p['cm_rule_meta_id'];
	var cond4 = p['action_id'];
	
	return ((cond5));
},
'content': content_adv_modify,
});
function content_adv_modify(params) {
	var jQuery = this.jQuery, doc = this.doc;
	/**
	 * content and elements on page
	 */
	this.parameters = params;
	this.get_script_type = function() {
		return "advanced modify";
	}
	
	//this.get_script = function() {}
	//this.get_hostname = function() {}
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {		
		var f = "Invocation-"+br_bread.title_bar_by_count(this.parameters['action_name'], 1);
		f += '.' + br_bread.title_bar_end(this.parameters['action_name']);
		return this.filename_sanitize(f);
	}
	this.get_local_directory = function() {
		var d = "Invocation\\";
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
content_adv_modify.prototype = new BR_Content();
