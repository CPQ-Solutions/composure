(function() { br_utils.create_plugin ({	
	'name':'file manager',
	'author':'Kenny Browne',
	'description':'Allows the plugin to work on the file manager.',
	regex_urls: ['admin\/filemanager\/list_files.jsp'],
	'get_parameters' : function(doc, jQuery) {
			var params = {};
			params.url = doc.location.href;		
			return params;
	},
		/**
		 * @param doc - a dom object representing a web page
		 * @bool returns true if it tests the page against a list of parameters and finds a match
		 */
	'matches_page' : function(p) {	
		var cond1 = (p['url']||"").indexOf('admin\/filemanager\/list_files.jsp') > -1;
		return cond1;
		},
	'content': content_file_manager,
	});
	function content_file_manager(params) {
		var me = this, new_filename = null;
		var jQuery = this.jQuery, doc = this.doc;
		
		this.downloaded_script = "";

		function get_pathname(checked) {
			var pathname = jQuery("input[value='"+jQuery(checked).attr("value")+"']",doc).next().next().next().attr("value");

			return pathname;
		}

		function check_for_valid_type() {
			var fn = me.get_filename() || "";
			var types = fn.split(".");
			
			if(typeof types.length < 2) {
				br_log.error("This file extension is currently unsupported: " + fn);
				return false;
			}

			var types_array = ["txt", "js", "py", "csv", "yml", "pl", "html", "htm", "xml", "xslt", "xsl", "css", "php"];

			var match = _.include(types_array, _.last(types));

			if(match === true) {
				return true;
			} else {
				br_log.error("This file extension is currently unsupported: " + fn);
				return false;
			}
		}

		function validates_checkbox(callback) {
			if(typeof callback !== "function") {
				return;
			}

			var replace = function() {
				if(jQuery("input[type='checkbox']:checked",doc).length !== 1) {
					br_log.error("Please check one and only one checkbox.");
					return false;
				}

				callback.apply(this, arguments);
			}

			return replace;
		}

		function validates_type(callback) {
			if(typeof callback !== "function") {
				return;
			}

			var replace = function() {
				if(check_for_valid_type() !== true) {
					return false;
				}

				//call the function, can pass arguments through
				callback.apply(this, arguments);
			}

			return replace;
		}

		function validates_all(callback) {
			if(typeof callback !== "function") {
				return;
			}

			callback = validates_type(callback);
			callback = validates_checkbox(callback);

			return callback;
		}

		// call with no arguments to get the first checked checkbox on the page
		function get_folder_and_filename(checkbox) {
			checkbox = checkbox || jQuery("input[type='checkbox']:checked", doc);

			var downloadlocation = jQuery(checkbox).attr("value");
			var pathname = get_pathname(checkbox) || "";
			var path = pathname.split("/");

			var ret = {};
			if(path.length !== 2) {
				ret = {filename: pathname, folder: "Default\\"};
			} else{
				ret = {filename: path[1], folder: path[0]};
			}
			
			return ret;
		}

		/**
		 * content and elements on page
		 */
		 
		this.get_script_type = function() {return "file manager";};
		
		this.get_script = function() {
			function callee(callback) {
				/**
				 * Put together the URL string that we will download teh XSL from
				 */
				var checked = jQuery("input[type='checkbox']:checked", doc);
				var downloadlocation = jQuery(checked).attr("value");

				var url_text = params['url'];
				var end = url_text.indexOf(".com") + 5;
				url_text = url_text.substring(0, end);			
				url_text += 'servlet/ImageServer?file_id='+downloadlocation;
				jQuery.get(url_text, null,function(data, success){
						callback(data);

						var checked = jQuery("input[type='checkbox']:checked", doc);
						var path_object = build_path_object(me.get_filename());
						hide_if_unavailable(path_object, downloadlocation);
				}, 'html');
			}

			return callee;
		};//do nothing
		
		/**
		 * File naming and directories
		 */
		this.get_filename = function(checkbox) { 
			var res = get_folder_and_filename(checkbox);

			return res.filename;
		};

		this.get_local_directory = function(checkbox) {
			var res = get_folder_and_filename(checkbox);

			return 'FileManager\\' + res.folder;
		};

		this.get_temp_directory = function(checkbox) {
			var file_location;

			br_global.temp_dir = typeof br_global.temp_dir === "string" ? br_global.temp_dir : "";

			if(br_global.temp_dir !== "") {
				file_location = br_utils.create_local_file(br_global.temp_dir);
			} 
		
			if(!file_location) {
				file_location = br_utils.get_special_file("TmpD");
			}

			br_utils.append_all( file_location, this.get_hostname() );
			br_utils.append_all( file_location, this.get_local_directory(checkbox) );
			return file_location;
		};

		//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
		
		this.get_extension = function() {return "";};
		
		/**
		 * Entry points
		 */
		/**
		 * actions
		 */	

	function send_event_to_page(element, evt_type) {
		if(element instanceof jQuery) {
			element = jQuery(element).get(0);
		}

		var evt = document.createEvent("HTMLEvents");
		evt.initEvent(evt_type, false, false);
		element.dispatchEvent(evt);
	}
		function hide_if_unavailable(path_object, fileid) {
			if(path_object.exists() === true) {
				jQuery("#replace_file"+fileid, doc).show();
			} else {
				jQuery("#replace_file"+fileid, doc).hide();
			}
		}
		function build_path_object(filename, checkbox) {
			var path_object = me.get_temp_directory(checkbox);
			
			br_utils.append_all(path_object, filename);

			return path_object;
		}
		function create_new_file() {
			
		}
		this.build_interface = function () {
			var that = this;
			var value = 1;
			// the upload file input
			var $upload = jQuery("input[name='id']", doc);
			
			$upload.closest("tr").after("<tr><td colspan='2'><a href='#' id='sangfroid_add_file'><img src='resource://br_images/logo.png'/>Create New File with Sangfroid</a></td></td>");

			jQuery("#sangfroid_add_file",doc).click(function(){
				br_log.server("FILEMANAGER CREATE FILE");
				var first_checkbox = jQuery("input[type='checkbox']:first",doc);
				new_filename=prompt("Please enter filename, including extension.");

				if(!new_filename) {return;}

				new_filename = me.filename_sanitize(new_filename);

				var path_object = build_path_object(new_filename, first_checkbox);
				$upload.attr("value",path_object.path);

				// send a space, because the file manager doesn't allow blank files to be uploaded
				br_editor.saveFileToDisk(path_object.parent.path, new_filename, " ");

				send_event_to_page(jQuery("#add_file",doc).closest("table"), "click");
				
				return false;
			});

			jQuery("input[type='checkbox']", doc).each(function() {
				var n = jQuery("input[type='checkbox']", doc);
				var numofCheckbox = 0;

				if(n.length<2) {
					numofCheckbox = 1;
				} else {
					numofCheckbox = n.length-1;
				}

				if(numofCheckbox >= value){
					value = value + 1;
					var fileid = jQuery(this).attr("value"),
						folder = me.get_local_directory(this),
						filename = me.get_filename(this),
						folderid = jQuery("input[name='folder_id']", doc).attr("value"),
						addRow = "<tr><td>",
						endRow = "</td></tr>";

					var form = 	"<form action='replace_file.jsp' enctype='multipart/form-data' method='post' name='MpFormSangfroid"+fileid+"'>" +
						"<INPUT id='testVal' type='hidden' name='formaction' VALUE='replaceHtmlImgFile'>" +
						"<INPUT  type='hidden' name='folder_id' VALUE='"+ folderid +"'>" +
						"<INPUT type='hidden' name='file_id' VALUE='"+ fileid +"'>" +
						"<INPUT type='hidden' name='curpos' VALUE='0'>" +
						"<INPUT id='br_input_id_"+fileid+"' name='id' type='file' style='display:none' value=\"\">" +
						"<INPUT type='submit' id='replace_file"+fileid+"' class='ajax-submit' value='Replace From Editor'/>" +
						"<div class='br-progress' style='display:none; width:130px; height: 18px;'><progress><img src='chrome://big_repo/content/img/ajax-loader.gif'/></progress></div>"+
						"</FORM>";

					jQuery("input[name='hidden_ids'][value='"+fileid+"']",doc).next().next().next().next().next().append(addRow+form+endRow);

					var path_object = build_path_object(filename,this);
					hide_if_unavailable(path_object, fileid);

					jQuery("#br_input_id_"+fileid, doc).attr("value", path_object.path);

				}
			});
			jQuery(".ajax-submit", doc).click(function() {
				var button = this,
					form = jQuery(button).closest("form"), 
					progress = jQuery(".br-progress", form),
					file = jQuery("[name='id']", form).get(0).files[0];
				
					jQuery("progress",progress).attr("value", 0).attr("max", 100);
					br_load.ajax({
						type: "POST",
						multiform: true,
						url: doc.location.protocol+"//"+doc.location.hostname+"/admin/filemanager/replace_file.jsp",
						data: {
							formaction: jQuery("input[name=formaction]", form).attr("value"),
							folder_id: jQuery("input[name=folder_id]", form).attr("value"),
							file_id: jQuery("input[name=file_id]", form).attr("value"),
							curpos: jQuery("input[name=curpos]", form).attr("value"),
							id: file
						},
						success: function(data) {
							br_log.notify("Updated File");
							jQuery(progress).hide();
							jQuery(button).show();
						},
						beforeSend: function(xhr) {
							xhr.onprogress = function(e) {
								jQuery("progress",progress).attr("value", e.loaded);
								jQuery("progress",progress).attr("max", e.total);
							}
							xhr.onloadstart = function(e) {
								jQuery(progress).show();
								jQuery(button).hide();
							};
							xhr.onloadend = function(e) {
								jQuery(progress).hide();
								jQuery(button).show();
							}
						}
					});
				return false;
			});
		};

		this.plugin_created_successfully = function() {
			var test = jQuery("#sangfroid_add_file",doc).length > 0;
			return test;
		}

		
		this.restore = function(url) {
			br_log.server("RESTORE: file manager");
			if(url) {
				if(!confirm("File Manager Files Do Not Support Auto-Revert.\n\nClick Okay to Copy to Clipboard.")) {
					return;
				}

				jQuery.get(url, null, function(data) {
					br_utils.copy_to_clipboard(data.content);
					br_log.notify("Revision copied to clipboard.");
				});
			}
		};

		this.initiate_display = function() {
			var menu = this.get_menu();
			var f_id = br_utils.urlParam('f_id');
			if(f_id){
				br_log.notify("Opening folder with id: "+f_id);
				jQuery("body",doc).append("<a id='folder_"+f_id+"' href='javascript:changeFolder(document.bmForm, "+f_id+")'>"+f_id+"</a>");
				jQuery("#folder_"+f_id,doc)[0].click();
			}
			menu.remove("br_read_temp");
			menu.render();
			me.build_interface();
			me.save_and_sync = validates_all(me.save_and_sync);
			me.open_temp_file = validates_all(me.open_temp_file);
		}; 
		
		this.get_menu = function () {
			var me = this;

			var m = br_menu(me.doc, me)
				.add_separator("br_editing", "Editor")
				.add_button_with_icon("br_open_temp", "Open in Editor", "Open",
					"chrome://sangfroid/content/img/edit.png", function () {
					me.open_temp_file();
				})
				.add_button_with_icon("br_read_temp", "Read from Editor", "Read",
					"chrome://sangfroid/content/img/restore.png", function () {
					me.read_from_file();
				})
				return m;
		};
	}
	content_file_manager.prototype = new BR_Content();
}());
