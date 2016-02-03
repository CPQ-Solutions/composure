br_utils.create_plugin ({ 
'name':'integration xsl',
'author':'Kenny Browne',
'description':'Allows the plugin to work on the integration xsl page.',
regex_urls:['admin\/parts\/integration\/edit_integration.jsp'],
'get_parameters' : function(doc, jQuery) {
	var params = {};
	params.old_query_file_id = jQuery("input[name='old_query_file_id']", doc).attr("value");
	params.variable_name = jQuery("input[name='variable_name']", doc).attr("value");
	params.old_file_id = jQuery("input[name='old_result_file_id']", doc).attr("value");
	params.url = doc.location.href;   
	return params;
},
/**
 * @param doc - a dom object representing a web page
 * @bool returns true if it tests the page against a list of parameters and finds a match
 */
'matches_page' : function(p) {  
	var cond1 = (p['url']||"").indexOf('admin\/parts\/integration\/edit_integration.jsp') > -1;
	var cond2 = p['old_query_file_id'];
	var cond3 = p['variable_name'];
	var cond4 = p['old_file_id'];
	
	return (cond1 && cond2 && cond3 && cond4);
},
'content': content_parts_integration,
});

function content_parts_integration(params) {
	var jQuery = this.jQuery, doc = this.doc;
  var me = this;
	//using this to keep commit from sending a blank file
	this.downloaded_script = "";
	this.parameters = params;

	
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "content_parts_integration";};
	
	this.get_script = function() {
		function callee(callback) {
			var url_text = me.parameters['url'];
			var end = url_text.indexOf(".com") + 5;
			url_text = url_text.substring(0, end);			
			url_text += '/servlet/ImageServer?file_id='+jQuery("#br_header_footer",doc).attr("value");

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
		var selectedFile = jQuery("#br_header_footer",doc).attr("value");
		var textarea = jQuery("#br_header_footer",doc).children("option[value='"+selectedFile+"']").html();
		var f = this.parameters['variable_name']+"."+textarea;
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {return 'XSL-ImageServer\\';};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".xsl";};
	
	/**
	 * Entry points
	 */
  // this.open_temp_file = function() {    
  //  var that = this;
  //  var file_location = this.get_temp_directory();
  //  this.save_script_to_disk( function() {
  //    br_editor.launchEditor( file_location.path, that.get_filename() + that.get_extension() );
  //  }, file_location.path );
  // };
	
	/**
	 * actions
	 */ 
	this.read_from_file = function(restore_ext) {
		br_log.server("READ FROM FILE: parts integration");
	  restore_ext = restore_ext || "";
	  
		var dir = this.get_temp_directory().path;
		var file_value = br_editor.readFile(dir, this.get_filename() + this.get_extension());
		var selectedFile = jQuery("#br_header_footer",doc).attr("value");
		var textarea = jQuery("#br_header_footer",doc).children("option[value='"+selectedFile+"']").html();
		if(textarea == 'SOAP'){
			selectedFile = "query_file";    
		}else{
			selectedFile = "result_file";
		}
		jQuery('input[name='+selectedFile+']', doc).val(dir+'\\'+this.get_filename() +restore_ext+ this.get_extension());
		
		jQuery('input[name='+selectedFile+']', doc).each(function() {
			br_display.show_success_effect(this);
		});
	};
	
	this.restore = function(url) {
		br_log.server("RESTORE: parts integration");
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
	
	this.on_page_load = function() {    
		this.initiate_display();
	};
	//this.read_from_file = function() {  };
	//this.faster = function();
	/**
	 * actions
	 **/
	
	this.initiate_display = function() {
		var m = this.get_menu();
		var opts = [ {'id':'query_file','value':params.old_query_file_id,'label':'SOAP'},
								 {'id':'result_file','value':params.old_file_id,'label':'Parser'} ];
		
		m.add_separator("br_sel_head", "Select File", "br_editing");
		m.add_dropdown("br_header_footer", opts, "br_editing");
		m.render();
	};
	
	//this.commit = function(commitMessage, do_prompt) {  }
	//this.open_script_in_editor = function() {}
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
}
content_parts_integration.prototype = new BR_Content();
