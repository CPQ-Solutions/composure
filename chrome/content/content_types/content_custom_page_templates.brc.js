(function() { br_utils.create_plugin ({	
	name:'Custom Page Templates',
	/** Take Credit! **/
	author:'Kenny Browne', 
	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	regex_urls: ["edit_xsl_template.jsp"],
	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc, jQuery) {
		var params = {};
		return params;
	},
	/**
	* 3rd step: test the page
	* If this function returns true, then the plugin will be launched.
	*/
	'matches_page':function(params) {
		var cond1 = true;
		return (cond1);
	},
	'content': plugin,
	});
	/** Write your plugin! **/
	function plugin(params) {
		var $, jQuery = $ = this.jQuery, doc = this.doc, me = this, $checked;
		this.get_script_type = function() {return "homepage_xsl_admin";};
	
		var get_link = function() {
			var url_text, url_end, end, next_table_cell, matches;

			url_text= doc.location.href; 
			end = url_text.indexOf(".com") + 5;
			url_text = url_text.substring(0, end);			

			next_table_cell = $checked.parent().next().html();
			
			matches = next_table_cell.match(/'(.*)'/);

			if(!matches || matches.length !== 2) {
				return;
			}

			url_end = matches[1];

			url_end += url_end.indexOf("ImageServer?") > -1 ? "&" : "?";
			url_end += "cache_breaker="+new Date().getTime();

			return url_text + url_end;
		};
	
		this.get_script = function() {
			function callee(callback) {
				var complete_link = get_link();
				if(!complete_link) {
					throw("No homepage checkbox found, can't open file.");
				}

				jQuery.get(complete_link, null, function(data, success){
					var result = data;

					callback(result);
				}, 'html');
			};

			return callee;
		};  
		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		//this.plugin_created_successfully = function() { /* Tests to guarentee that your plugin only runs once */ }
		//this.on_page_load = function() { this.initiate_display(); };
		//this.faster = function() { /* code in here will run when "faster" is checked as an option */ };

		var checkbox_template = _.template("<input type='radio' value='<%= name %>' name='br_file_sel'/>"+
				"<img src='resource://br_images/logo.png'/>" +
				"<div class='br_progress <%= name %>' style='display: none'><progress></progress></div>" );
		
		var add_checkboxes = function() {
			jQuery("input.form-input[type='file']",doc).each(function() {
				var name = jQuery(this).attr("name");
				jQuery(this).after(checkbox_template({name: name}));
			});

			jQuery("input[name='br_file_sel']", doc).click(function() {
				$checked = jQuery(this);
			});
		};

		this.initiate_display = function() {
			var opts, m, i, ii;
			m = this.get_menu();
			m.render();
			add_checkboxes();
		};


		/**
		* These functions describe what to name files saved using version control
		*/
		this.get_filename = function() {return $checked.val()};
		this.get_extension = function() {
			var ext = "xsl", 
				sel = $checked.val(),
				found = sel.match("js|css");
			if(found && found.length === 1) {
				ext = found[0];
			}
			return "."+ext;
		};
		this.get_local_directory = function() {return "HomePageAdmin";};


		function ajax_submit() {
			var form = jQuery("[name='bmForm']",doc), 
					progress_div = jQuery(".br_progress."+$checked.val(), form),
					progress = jQuery("progress",progress_div),
					input = jQuery("input[name ='"+$checked.val()+"']", doc),
					file = input.get(0).files[0],
					data_ = {};
			
			progress.attr("value", 0).attr("max", 100);

			data_.formaction = "updateXslTemplate";
			data_[$checked.val()] = file;
			br_load.ajax({
				type: "POST",
				multiform: true,
				url: doc.location.protocol+"//"+doc.location.hostname+"/admin/homepage/define_xsl_template.jsp",
				data: data_,
				success: function(data) {
					br_log.notify("Updated " + $checked.val());
					jQuery(progress_div).hide();
				},
				beforeSend: function(xhr) {
					xhr.onprogress = function(e) {
						progress.attr("value", e.loaded);
						progress.attr("max", e.total);
					}
					xhr.onloadstart = function(e) {
						jQuery(progress_div).show();
					};
					xhr.onloadend = function(e) {
						jQuery(progress_div).hide();
						input.val("");
					}
				}
			});
		}


		this.read_from_file = function(restore_ext) {
			br_log.server("READ FROM FILE: homepage_xsl_admin");

			restore_ext = restore_ext || "";
			var dir = me.get_temp_directory();
			
			var input = jQuery("input[name ='"+$checked.val()+"']", doc);
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
					br_editor.saveFileToDisk( file_location.path, me.get_filename() +restore_ext+ me.get_extension(), data.content );
					//read from file
					me.read_from_file(restore_ext);
				});
			}
		};
	}
	plugin.prototype = new BR_Content();
}());
