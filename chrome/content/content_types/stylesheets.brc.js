(function() { br_utils.create_plugin ({	
	name:'stylesheets',
	/** Take Credit! **/
	author:'Mike Wheeler', 
	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	regex_urls: ["/admin/ui/branding/edit_site_branding.jsp"],
	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc, jQuery) {
		var params = {};
		//params.url = doc.location.href;
		//params.title = jQuery("title", doc).html();
		return params;
	},
	/**
	* 3rd step: test the page
	* If this function returns true, then the plugin will be launched.
	*/
	'matches_page':function(params) {
		var cond1 = true;
		//var cond2 = (params['title']||"").indexOf('some-value') > -1;

		return (cond1);
	},
	'content': content,
	});
	/** Write your plugin! **/
	function content(params) {
		var me = this;
		var jQuery = this.jQuery, doc = this.doc;
		this.get_script_type = function() {return "stylesheets";};

		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//this.plugin_created_successfully = function() { };
		//this.on_page_load = function() { this.initiate_display(); };
		//this.faster = function() { /* code in here will run when "faster" is checked as an option */ };
		this.initiate_display = function() {
			var m = this.get_menu(),
				download_links = jQuery("a.general-text",doc).filter(":contains('Download Stylesheet')"),
				mobile_link = jQuery("a.general-text",doc).filter(":contains('Download Mobile')"),
				main_link = download_links.first().attr("href"),
				alt_link = download_links.last().attr("href"),
				alt_mobile_link = mobile_link.last().attr("href"),
				input = jQuery('input[name=_additionalCSS]', doc);

			var opts = [ {'value':alt_link,'label':'Alt'},
									 {'value':alt_mobile_link,'label':'Mobile'},
									 {'value':main_link,'label':'Main'} ];
			m.add_separator("br_sel_head", "Select File", "br_editing");
			m.add_dropdown("br_css_select", opts, "br_editing");

			input.after("<span class='br-progress' style='display:none; width:130px; height: 18px;'><progress><img src='chrome://big_repo/content/img/ajax-loader.gif'/></progress></span>");
			m.render();
		};

		var handle_main = function() {
			br_log.error("This feature is disabled for the Main stylesheet. Please change the dropdown to 'Alt' to continue.");
		}

		function ajax_submit() {
			var form = jQuery("[name='bmForm']",doc), 
					progress = jQuery(".br-progress", form),
					file = jQuery("[name='_additionalCSS']", form).get(0).files[0];
				
			jQuery("progress",progress).attr("value", 0).attr("max", 100);
			br_load.ajax({
				type: "POST",
				multiform: true,
				url: doc.location.protocol+"//"+doc.location.hostname+"/admin/ui/branding/edit_site_branding.jsp",
				data: {
					formaction: "generateCSS",
					_additionalCSS: file
				},
				success: function(data) {
					br_log.notify("Updated CSS File");
					jQuery(progress).hide();
				},
				beforeSend: function(xhr) {
					xhr.onprogress = function(e) {
						jQuery("progress",progress).attr("value", e.loaded);
						jQuery("progress",progress).attr("max", e.total);
					}
					xhr.onloadstart = function(e) {
						jQuery(progress).show();
					};
					xhr.onloadend = function(e) {
						jQuery(progress).hide();
						jQuery("[name='_additionalCSS']", form).val("");
					}
				}
			});
		}

		this.read_from_file = function(restore_ext) {
			br_log.server("READ FROM FILE: stylesheet");
			// don't do anything for the main css file
			var which = jQuery("#br_css_select",doc).children(":selected").html();
			if(which === "Main") {
				handle_main();
				return;
			}

			restore_ext = restore_ext || "";
			var dir = me.get_temp_directory();
			
			var input = jQuery('input[name=_additionalCSS]', doc);
			input.val(br_utils.append_all(dir, '\\'+me.get_filename() + restore_ext + me.get_extension()).path);
			
			if(typeof FormData === "function") {
				ajax_submit();
			}

			input.each(function() {
				br_display.show_success_effect(this);
			});
		};

		this.restore = function(url) {
			br_log.server("RESTORE: stylesheet");
			var restore_ext = ".restore";
			if(url) {
				jQuery.get(url, null, function(data) {
					// write contents of file
					var file_location = me.get_temp_directory();
					br_editor.saveFileToDisk( file_location.path, me.get_filename() + restore_ext + me.get_extension(), data.content );
					//read from file
					me.read_from_file(restore_ext);
				});
			}
		};
		/**
		* These functions describe what to name files saved using version control
		*/
		this.get_script = function() {
			return function callee(callback) {
				var url_text = doc.location.href,
					end = url_text.indexOf(".com") + 5;
				url_text = url_text.substring(0, end);			
				url_text += jQuery("#br_css_select",doc).attr("value");

				jQuery.get(url_text, {}, function(data) {
					callback(data);
				});
			};
		};
		this.get_filename = function() {  
			var which = jQuery("#br_css_select",doc).children(":selected").html();
			return which + "Stylesheet";
		};
		this.get_extension = function() { return ".css"; };
		this.get_local_directory = function() { return "Stylesheets"; };
	}
	content.prototype = new BR_Content();
}());
