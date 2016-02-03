(function() { br_utils.create_plugin ({	
	/** Tell us About the Plugin **/
	name:'mass_updates',
	description:'For the plugin in the deployment center, mass updates of attributes.',
	
	


	/** Take Credit! **/
	author:'Mike Wheeler', 




	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	//AH - add 'edit_rule_inputs.jsp' for initial load
	regex_urls: ["/admin/commerce/rules/edit_function.jsp","edit_rule_inputs.jsp"],




	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc, jQuery) {
		var params = {};
		//params.url = doc.location.href;
		params.title = jQuery("title", doc).html();
		return params;
	},




	/**
	* 3rd step: test the page
	* If this function returns true, then the plugin will be launched.
	*/
	matches_page:function(params) {
		var cond1 = (params['title']||"").indexOf("Mass update of transaction attribute values") > -1;
		//AH - avoid running on input reselect
		var cond2 = jQuery("#bm_script_id",doc).length > 0;
		return (cond1 && cond2);
	},
	'content': content,
	});



	/** Write your plugin! **/
	function content(params) {
		var me = this;
		var jQuery = this.jQuery, doc = this.doc;
		me.get_script_type = function() {return "content_mass_update";};

		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//me.plugin_created_successfully() { /* Tests to guarentee that your plugin only runs once */ }
		//me.on_page_load = function() { me.initiate_display(); };
		//me.faster = function() { /* code in here will run when "faster" is checked as an option */ };



		/**
		* These functions describe what to name files saved using version control
		*/
		me.get_filename = function() {return "mass_update";};
		me.get_extension = function() {return ".bml";};
	}
	content.prototype = new BR_Content();
}());
