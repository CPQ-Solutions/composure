(function() { br_utils.create_plugin ({	
	name:'account_filter',
	
	


	/** Take Credit! **/
	author:'Mike Wheeler', 




	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	regex_urls: ["/admin/accounts/edit_filter_script.jsp"],





	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc, jQuery) {
		var params = {};
		//params.url = doc.location.href;
		//params.title = jQuery("title", doc).html();
		params.id = jQuery("input[name='id']", doc).val();
		return params;
	},




	/**
	* 3rd step: test the page
	* If this function returns true, then the plugin will be launched.
	*/
	'matches_page':function(params) {
		var cond1 = params.id ? true : false;
		//var cond2 = (params['title']||"").indexOf('some-value') > -1;

		return (cond1);
	},
	'content': content,
	});



	/** Write your plugin! **/
	function content(params) {
		var jQuery = this.jQuery, doc = this.doc;
		this.get_script_type = function() {return "account_filter";};

		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//this.plugin_created_successfully() { /* Tests to guarentee that your plugin only runs once */ }
		//this.on_page_load = function() { this.initiate_display(); };
		//this.faster = function() { /* code in here will run when "faster" is checked as an option */ };



		/**
		* These functions describe what to name files saved using version control
		*/
		this.get_filename = function() {return "filter_id_"+params.id;};
		this.get_extension = function() {return ".bml";};
		this.get_local_directory = function() { return "account_filter"; };
	}
	content.prototype = new BR_Content();
}());
