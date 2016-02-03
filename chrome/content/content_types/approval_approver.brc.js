(function() { br_utils.create_plugin ({	
	/** Tell us About the Plugin **/
	name:'approval approver',
	description:'',
	
	


	/** Take Credit! **/
	author:'Mike Wheeler', 




	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	regex_urls: ["/admin/commerce/rules/edit_function.jsp",
								"/admin/commerce/rules/edit_rule_inputs.jsp"],




	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc, jQuery) {
		var params = {};
		//params.url = doc.location.href;
		//params.title = jQuery("head title",doc).html();
		params.area = jQuery("input[name='area']", doc).attr("value");
		return params;
	},




	/**
	* 3rd step: test the page
	* If this function returns true, then the plugin will be launched.
	*/
	matches_page:function(params) {
		// notification
		//var cond1 = params.area === "25";
		var cond1 = params.area === "26";
		params.notify = cond1;
		
		// condition
		var cond2 = params.area === "22";
		//var cond2 = params.area === "21";
		params.condition = cond2;

		return (params.notify || params.condition);
	},
	'content': content,
	});



	/** Write your plugin! **/
	function content(params) {
		var me = this;
		var jQuery = this.jQuery, doc = this.doc;
		var breadcrumbs = jQuery("td.top-bar td.bottom-bar", doc).html();

		me.get_script_type = function() {return "approval approver";};

		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//me.plugin_created_successfully() { /* Tests to guarentee that your plugin only runs once */ }
		//me.on_page_load = function() { me.initiate_display(); };
		//me.faster = function() { /* code in here will run when "faster" is checked as an option */ };



		/**
		* These functions describe what to name files saved using version control
		*/
		me.get_filename = function() {
			var prefx = params.notify ? "notify" : "cond",
				file = br_bread.title_bar_end(breadcrumbs),
				app_id = jQuery("input[name='approver_id']", doc).attr("value");

			return me.filename_sanitize(prefx+"_"+file+"."+app_id).toLowerCase();
		};
		me.get_extension = function() {return ".bml";};
		me.get_local_directory = function() {
			return "approver";
		};
	}
	content.prototype = new BR_Content();
}());
