br_utils.create_plugin (function() {

	function getUrlVars(url) {
		var url_params = [],hash;
		var hashes = url.slice(url.indexOf('?')+1).split('&');
		for(var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			url_params.push(hash[0]);
			url_params[hash[0]] = hash[1];
		}	

		return url_params;
	}

	var package = {	
		name:'step_admin',
		
		/** Take Credit! **/
		author:'Jason manners', 

		/** Decide when the plugin runs. **/
		/** 
		* 1st step: url compare
		*	Each regular expression in this array will be compared to the URL on page load.
		* If any of these match, then we move on to the next filter.
		*/
		//regex_urls: ['bigmachines.com/admin/commerce/workflow/steps'],
regex_urls: ['/admin/commerce/workflow/'],



		/**
		* 2nd step: scrape the page
		* Use this function to grab anything off the page that you want to use later.
		*/
		get_parameters:function(doc, jQuery) {
			var params = {};
			var url_params = getUrlVars(doc.location.href);
			//params.url = doc.location.href;
			//params.title = jQuery("title", doc).html();
			params.profile_id = url_params['profile_id'];
			params.step_id = url_params['step_id'];
			params.comp_action = url_params['comp_action'];
			return params;
		},




		/**
		* 3rd step: test the page
		* If this function returns true, then the plugin will be launched.
		*/
		'matches_page':function(params) {
			var cond1 = params['profile_id'] != undefined;
			var cond2 = !isNaN(params['profile_id']);
			var cond3 = params['step_id'] != undefined;
			var cond4 = !isNaN(params['step_id']);
			//var cond2 = (params['title']||"").indexOf('some-value') > -1;
			return (cond1 && cond2 && cond3 && cond4);// && cond3 && cond4);
		},
		'content': plugin,
	};



	/** Write your plugin! **/
	function plugin(params) {
		var $, jQuery = $ = this.jQuery, doc = this.doc;
		this.get_script_type = function() {return package.name;};

		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//this.on_page_load = function() { this.initiate_display(); };
		function simulateClick(elem) {
			var evt = doc.createEvent("MouseEvents");
			evt.initMouseEvent("dblclick", true, true, window,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
			var cb = elem; 
			var canceled = !cb.dispatchEvent(evt);
		}
		
		this.after_page_load = function() {
			br_log.firebug(params.comp_action);
			var intervalID = setInterval(function(){
				br_log.firebug(intervalID);
				if($('.ext-el-mask',doc).length == 0){
					clearInterval(intervalID);
					if(params.comp_action == 'profile') {
						$("[id*='x-auto-7_"+params['step_id']+"']",doc).children('img')[1].click();
						var elem = $("[id*='x-auto-7__x-auto-7_"+params['profile_id']+"']",doc)[0];
						simulateClick(elem);
					} 
					else {
						$("[id*='x-auto-7_"+params['step_id']+"']",doc).children('img')[1].click();
						var elem = $("[id*='x-auto-7_"+params['step_id']+"']",doc)[1];
						simulateClick(elem);
					}
				}
			},500);
		};
		/* Use to tear down */
		//this.on_page_unload = function() { };
		this.initiate_display = function(){};
		//this.faster = function() { /* code in here will run when "faster" is checked as an option */ };

		/**
		* These functions describe what to name files saved using version control
		*/
		//this.get_filename = function() { return "example"; };
		//this.get_extension = function() { return ".txt"; };
		//this.get_local_directory = function() { return "exampleFolder"; };
	}



	/**
	* Don't change below here - 
	* The following lines need to remain intact at the bottom of the function
	*/
	plugin.prototype = new BR_Content;

	return package;
}());
