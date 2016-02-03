br_utils.create_plugin ({	
'name':'global script search',
'author':'Michael Wheeler',
'description':'Change display properties of global script search page in BigMachines',
/**
 * @param {DOM} doc The document object of the page that we are testing against
 * @return {Object} params A hashmap intended to hold information for identifying the page,
 */
regex_urls: ['admin\/scripts\/search_script.jsp'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	
	params.url = doc.location.href;
	//params.title = jQuery("title", doc).html();
	
	return params;
},
/**
 * @param {Object} params A hashmap, usually generated by get_parameters
 * @return {Boolean} True if this plugin should be used on this page
 */
'matches_page':function(p) {
	var cond1 = (p.url||"").indexOf('admin\/scripts\/search_script.jsp') > -1;
	//var cond2 = (p['title']||"").indexOf('some-value') > -1;

	return (cond1);
},
'content': global_script_search,
});
/**
 * @param {Object} params A hash map of information about the page
 * @extends BR_Content
 */
function global_script_search(params) {
		var jQuery = this.jQuery, doc = this.doc;
	/**
	 * content and elements on page
	 */
	
	this.get_script_type = function() {return "global_script_search";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	/**
	 * File naming and directories -
	 * 
	 * These functions are called whenever the plugin 
	 * is making a decision about where to save a file
	 */
	this.get_filename = function() {};
	this.get_extension = function() {};
	this.get_local_directory = function() {};
	/**
	 * Entry points - 
	 * These functions are called by the firefox plugin directly
	 */
	//this.on_launch_and_save = function() {	}
	//this.on_page_load = function() { this.initiate_display(); };
	//this.read_from_file = function() {  };
	this.faster = function() {
	};
	/**
	 * actions
	 */
	this.initiate_display = function() {
		var counter = 0;
		jQuery("pre",doc).each(function() {
			jQuery(this).attr("id", "pre_id"+counter);
			br_display.create_toggle_link("#pre_id"+counter,"br_toggle_"+counter,doc);
			
			counter += 1;
		});
	};
	//this.save_script_to_disk = function() {  };
	//this.open_script_in_editor = function() {  };
}
global_script_search.prototype = new BR_Content();
