br_utils.create_plugin ({	
'name':'printer friendly xsl',
'author':'Michael Wheeler',
'description':'Enables version control for an Advanced Modify script within BigMachines.',
regex_urls: ['admin\/commerce\/views\/edit_xslt.jsp'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	
	params.url = doc.location.href;
	params.old_file_id = jQuery("input[name='old_file_id']", doc).attr("value");
	params.variable_name = jQuery("input[name='variable_name']", doc).attr("value");
	params.id = jQuery("input[name='id']", doc).attr("value");
		
	return params;
},
'matches_page':function(p) {
	var cond1 = (p['url']||"").indexOf('admin\/commerce\/views\/edit_xslt.jsp') > -1;
	/*var cond2 = p['old_file_id'];
	var cond3 = p['variable_name'];
	var cond4 = p['id'];*/
	return cond1;//(cond1 && cond2 && cond3 && cond4);
},
'content': content_xsl_view,
});

function content_xsl_view(params) {
	var me = this;
		var jQuery = this.jQuery, doc = this.doc;
	//using this to keep commit from sending a blank file
	this.downloaded_script = "";
	this.parameters = params;
	
	var docVarName = "";
	var process_id = "";
	var position = -1;
	var docLocId = -1;
	
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "printer friendly xsl";};
	
	this.get_script = function() {
		function callee(callback) {
			var url_text = me.parameters['url'];
			var end = url_text.indexOf(".com") + 5;
			url_text = url_text.substring(0, end);			
			url_text += '/servlet/ImageServer?file_id='+me.parameters['old_file_id'];

			jQuery.get(url_text, null,function(data, success){
				var result = data;

				callback(result);
			}, 'html');
		};

		return callee;
	};

	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = this.parameters['variable_name']+"."+this.parameters['id'];
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {return 'XSL-ImageServer\\';};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".xsl";};
	
	/**
	 * actions
	 */	
	
	this.read_from_file = function(restore_ext) {
		br_log.firebug("READ FROM FILE: xsl view");
		restore_ext = restore_ext || "";
		var dir = me.get_temp_directory();
		var file_value = br_editor.readFile(dir.path, me.get_filename() + restore_ext + me.get_extension());
		
		jQuery('input[name=xsl_file]', doc).val(br_utils.append_all(dir, '\\'+me.get_filename() + me.get_extension()).path);
		
		jQuery('input[name=xsl_file]', doc).each(function() {
			br_display.show_success_effect(this);
		});
	}
	var cond2 = jQuery("input[name='old_file_id']", doc).attr("value");
	var cond3 = jQuery("input[name='variable_name']", doc).attr("value");
	var cond4 = jQuery("input[name='id']", doc).attr("value");
	
	if(cond2 && cond3 && cond4){
		this.get_menu = function () {
			var me = this;
			//this.auto_sync(me);
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
	}else{
		this.initiate_display = function() {
			this.make_notification();
		};
		this.make_notification = function(){
			var that = this;
			var url = params['url']||"";
			var is_prod = br_utils.is_prod_site(url);
			var level = "";
			if(is_prod){
				level = "prod";
			}
			
			that.doc_link(level);
		};
	}
	/**
	 * This function is called by the rails overlay to read data into the content 
	 * pane. Passes in a URL where we can find the content, it is then up to the 
	 * plugin to download the data and make use of it.
	 *
	 * @param url {String} Contains the URL of the where to find the content
	 */
	this.restore = function(url) {
		br_log.firebug("RESTORE: stylesheet");
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
	this.doc_link = function (level) {
		docVarName = jQuery("select[name='doc_varname'] option[selected='true']",doc).val();
		process_id = jQuery("input[name='process_id']",doc).val() || -1;
		var url = me.get_hostname_prefix();
		if(process_id == -1){
			process_id = /process_id=(\d*)?/g.exec(jQuery("table.plain-button[onmouseout*=process_id]",doc).attr("onmouseout")) || -1;
			process_id = process_id[1] || -1;
		}
		if(process_id == -1){
			process_id = /process_id=(\d*)?/g.exec(params.url) || -1;
			process_id = process_id[1] || -1;
		}
		if(docVarName.indexOf("_DOCDESIGNER_") > -1){
			docVarName = docVarName.substring(13,docVarName.length);
			url = url + "admin/document-designer/"+process_id+"/list?docNameComp="+docVarName;
			br_log.page("",level,function(){
				jQuery("#br_current_notify_div",doc).append("<a href='" +url+ "'>" +docVarName+ "</a>");
				jQuery("#br_current_notify_div",doc).append("<br/>");
			});
		}else{
			url = url + "admin/doced/list_doc_editors.jsp";
			//call the process list page to get the position
			jQuery.get(me.get_hostname_prefix()+"admin/commerce/processes/list_processes.jsp",function(page_data){
				var search_doc = jQuery(page_data,doc);
				var counter = 0;
				jQuery("a[href*='edit_process.jsp?id=']",search_doc).each(function () {
					var id = this.href.split("=")[1];
					if(id == process_id){
						//jQuery("body",doc).append("<div id='posit' style='display:none;'>"+counter+"</div>");
						position = counter;
						//call the doc engine page and get the doc engine folder id
						jQuery.get(url,function(page_data){
							var search_doc = jQuery(page_data,doc);
							docLocId = jQuery(".data-sources",search_doc)[position].id;
							//call the doc engine folder page and grab the link for the edit document page
							jQuery.get(me.get_hostname_prefix()+"admin/doced/list_doc_editors.jsp?pageDocEdId="+docLocId,function(page_data){
								br_log.page("",level,function(){
									var search_doc = jQuery(page_data,doc);
									br_log.firebug(jQuery("td",search_doc));
									br_log.firebug(docVarName);
									jQuery("#br_current_notify_div",doc).append("<p>Related Documents:</p>");
									jQuery("td:contains('"+docVarName+"')",search_doc).next().next().next().children().each(function(){
										link = this.href;
										jQuery("#br_current_notify_div",doc).append("<a href='"+link+"'>"+docVarName+"</a>");
										jQuery("#br_current_notify_div",doc).append("<br/>");
									});
								});
							});
						});
					}
					counter++;
				});
			});
/*			jQuery.get(url,function(page_data){
				var search_doc = jQuery(page_data,doc);
				docLocId = jQuery(".data-sources",search_doc)[position].id;
			});
			jQuery.get(me.get_hostname_prefix()+"admin/doced/list_doc_editors.jsp?pageDocEdId="+docLocId,function(page_data){
				br_log.page("",level,function(){
					jQuery("#br_current_notify_div",doc).append("<p>Related Documents:</p>");
					jQuery("td:contains('"+docVarName+"')",search_doc).prev().children().each(function(){
						jQuery("#br_current_notify_div",doc).append(this);
						jQuery("#br_current_notify_div",doc).append("<br/>");
					});
				});
			});*/
		}
	};

	//this.initiate_display = function() {this.make_notification()};
	//this.commit = function(commitMessage, do_prompt) {	}
	//this.open_script_in_editor = function() {	}
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
}
content_xsl_view.prototype = new BR_Content();
