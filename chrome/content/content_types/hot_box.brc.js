br_utils.create_plugin ({ 
'name':'hot_box',
'author':'Mike Wheeler, Kenny Browne, Mark Myers',
'description':'Creates an overlay interface to rapidly navigate and fire JavaScript commands',
/**
 * @param {DOM} doc The document object of the page that we are testing against
 * @return {Object} params A hashmap intended to hold information for identifying the page,
 */
regex_urls: [''],
'get_parameters':function(doc, jQuery) {
  var params = {};

	params.url = doc.location.href;
	//params.loginform = doc.getElementById("login-form");
  
  return params;
},
/**
 * @param {Object} params A hashmap, usually generated by get_parameters
 * @return {Boolean} True if this plugin should be used on this page
 */
'matches_page':function(params) {
	return br_utils.is_bmi_site();
},
'content': hot_box,
});
/**
 * @param {Object} params A hash map of information about the page
 * @extends BR_Content
 */

function hot_box(params) {
	var that = this, 
		modifier_down = false,
		jQuery = that.jQuery,
		doc = that.doc;
	//position - page, row, column: p#-r#-c#
	var linkInfo = [];

	var pm = Components.classes["@mozilla.org/preferences-service;1"]
											 .getService(Components.interfaces.nsIPrefService)
											 .getBranch("extensions.sangfroid.");
	
	//build linkInfo from preferences
	for(p=1;p<=3;p++){
		for(r=1;r<=3;r++){
			for(c=1;c<=4;c++){
				// key = 0
				// label = 1
				// type = 2
				// url = 3
				// tab = 4
				var thisPos = "p"+p+"-r"+r+"-c"+c;
				var thesePrefs = pm.getCharPref("hotbox_"+thisPos).split("~");
				if(thesePrefs[2] == "") continue;
				linkInfo.push({position: thisPos, key: thesePrefs[0].toLowerCase(), description: thesePrefs[1]});
				switch(thesePrefs[2]){
					case "custom":
						linkInfo[linkInfo.length-1].url = thesePrefs[3];
						linkInfo[linkInfo.length-1].tab = thesePrefs[4];
						//linkInfo[linkInfo.length-1].tab = thesePrefs[4] == "true";
						break;
					case "data_table":
						linkInfo[linkInfo.length-1].callback = get_data_table_link;
						break;
					case "errors_editor":
						linkInfo[linkInfo.length-1].callback = (function(){that.open_logs();});
						break;
					case "proxy_in":
						linkInfo[linkInfo.length-1].callback = that.do_proxy_login;
						break;
					case "proxy_out":
						linkInfo[linkInfo.length-1].callback = proxy_logout;
						break;
					case "bs_id":
						linkInfo[linkInfo.length-1].callback = (function(){that.bs_id_clipboard();});
						break;
					case "printer_friendly":
						linkInfo[linkInfo.length-1].callback = (function(){gBrowser.selectedTab = gBrowser.addTab(that.get_xsl_url());});
						break;
					case "view_historyxml":
						linkInfo[linkInfo.length-1].callback = (function(){gBrowser.selectedTab = gBrowser.addTab(that.get_history_url());});
						break;
					case "view_documentxml":
						linkInfo[linkInfo.length-1].callback = (function(){that.get_document_xml_url(function(url){gBrowser.selectedTab = gBrowser.addTab(url);});});
						break;
					case "editor_historyxml":
						linkInfo[linkInfo.length-1].callback = (function(){that.open_url_in_editor("history"+jQuery("input[name='id']",doc).val(),that.get_history_url(),"Could Not Find History XML");});
						break;
					case "editor_documentxml":
						linkInfo[linkInfo.length-1].callback = (function(){that.get_document_xml_url(function(url){that.open_url_in_editor("document"+jQuery("input[name='id']",doc).val(),url,"Could Not Find Document XML");});});
						break;
					case "editor_mappingfile":
						linkInfo[linkInfo.length-1].callback = (function(){that.open_url_in_editor("mapping",that.get_hostname_prefix() + "/admin/commerce/reports/view_mapping_file.jsp","Can't find mapping file, check if reporting is enabled and a file is uploaded.");});
						break;
					case "deployment_center":
						linkInfo[linkInfo.length-1].callback = open_deployment_center;
						break;
				}
				
			}
		}
	}

	this.stripslashes = function(str) {
		str=str.replace(/\\'/g,"'");
		str=str.replace(/\\/g,"");
		return str;
	}

	this.is_command_shortcut = function(event) {
		var actualkey=String.fromCharCode(event.keyCode);
		for(i=0; i<linkInfo.length; i++) {
			if(linkInfo[i].key == actualkey.toLowerCase() && linkInfo[i].position.indexOf("p" + that.hotbox.current_page()) > -1) {
				return true;
			}
		}
	}


	var search = false;
	var searchstr = "";

	var valid_hotbox_page = function(url) {
		url = url || "";
		var url_is_doc_engine = url.indexOf('.com\/spring\/documenteditor') > -1;
		var url_is_doc_designer = url.indexOf('.com\/admin\/document-designer') > -1;
		var url_is_rte = url.indexOf('\/spring\/richtexteditor') > -1;
		var url_is_html_attr = url.indexOf('admin/htmleditor/html_editor.jsp') > -1;
		var url_is_homepage = url.indexOf('www.bigmachines.com') > -1;

		return br_utils.is_bmi_site() && !url_is_doc_engine && !url_is_doc_designer && !url_is_html_attr && !url_is_rte && br_global.sangfroid_active && !url_is_homepage;
	};


	var hotboxOn = false;
	this.runKey = function(event)
	{
		var actualkey=String.fromCharCode(event.keyCode);
		var url_text = that.get_hostname_prefix();
		for(var i=0; i<linkInfo.length; i++){
			if(linkInfo[i].key == actualkey.toLowerCase() && linkInfo[i].position.indexOf("p" + that.hotbox.current_page()) > -1)
			{
				var new_url = linkInfo[i].url||"";
				url_text += new_url
					// AH added check for callback for verified link functions
					if(new_url !== "" && !linkInfo[i].callback) {
						//MX
						if(linkInfo[i].tab == "window"){
							window.open(url_text,'', 'toolbar=0,menubar=0,location=0,directories=0,status=0,scrollbars=1,resizable=1,width=400,height=900');
						}
						else if(linkInfo[i].tab == "newtab"){
							gBrowser.selectedTab = gBrowser.addTab(url_text);
						}
						else{
							openUILink(url_text);
						}
						/*if(linkInfo[i].tab)
						  {
						  gBrowser.selectedTab = gBrowser.addTab(url_text);
						  }
						  else{
						  openUILink(url_text);
						  }*/
						// insert your saving routine here
					} else if(linkInfo[i].callback  && (typeof linkInfo[i].callback === "function")) {
						linkInfo[i].callback();
					}
				controlAlso = false;
				that.hotbox.log(linkInfo[i]);
				return false;
			}
		}
	}

	function isFormEvent(e) {
		// this function checks if the supplied event came from a form element
		es = e.target.nodeName;
		return (es == 'HTML' || es == 'BODY' || es == 'DIV' || es == 'A' || es == 'FIELDSET' ? false: true);
	}
	var my_keydown = function(e) {
		if(!that.hotbox) {return;}

		//deal with modifier
		if(br_global.hotbox_modifier === null || e.keyCode === br_global.hotbox_modifier) {
			modifier_down = true;
		}

		var pageLocations = doc.location;
		if(pageLocations) {
			pageLocations = pageLocations.href || "";
		} else {
			return;
		}

		if(isFormEvent(e)) {
			return;
		}

		if(!valid_hotbox_page(pageLocations)) {
			return;
		}

		if(!that.hotbox.visible()) {        
			if (e.keyCode === br_global.hotbox_hotkey && modifier_down) {
				hotboxOn = true;
				that.hotbox.show();
				e.preventDefault();   
			}
		} else {
			//check for repeat of open command, or else escape
			if ((e.keyCode === br_global.hotbox_hotkey && modifier_down) || e.keyCode === 27) {
				hotboxOn = false;
				that.hotbox.hide();

				e.preventDefault();

				//check for ctrl
			} else if (e.keyCode === 17) {
				that.hotbox.decrement();

				//check for shift
			} else if(e.keyCode === 16) {
				that.hotbox.increment();

				//all others
			} else {
				if(that.is_command_shortcut(e)) {
					that.hotbox.hide();
					that.runKey(e);

					e.preventDefault();
				}
			}
		}
	};
	var my_keyup = function(e) {
		if(e.keyCode === br_global.hotbox_modifier) {
			modifier_down = false;
		}
	};

	/*
	 * Everything below here is support - including functions that are
	 * called from commands, and repository functions as well.
	 */

	this.plugin_created_successfully = function() {
		return false;
	}
	this.get_script_type = function() {return "hot_box";};
	this.get_filename = function() { return ""; };
	this.get_extension = function() { return ""; };
	this.get_local_directory = function() { return ""; };
	this.on_page_load = function() {
		window.setTimeout(that.initiate_display, "0");
	}
	this.initiate_display = function() {
		that.hotbox = br_hotbox(linkInfo, doc, jQuery);

		that.hotbox.keydown(my_keydown);
		that.hotbox.keyup(my_keyup);
	};
	this.open_folder = function() {
		var dir = br_utils.create_local_file(this.get_full_local_directory());

		if(!dir.exists()) {
			alert("Folder Doesn't Exist, Sync with Server First.");  
			return;
		}
		var file = this.get_filename() + this.get_extension();

		br_editor.saveFileToDisk(dir.path, file, br_global.username + " touched this file.");

		br_editor.openContainingFolder( dir.path, file );
	};

	this.write_to_status_display = function(out, err) {
		var lines = out.split('\n');
		var hasValue = false;
		out='';
		for ( var i = 0, ii = lines.length; i < ii; i++) {
			var line=lines[i].split(' ');
			if(line.length > 1) {
				out += line[1] + "\n";
				hasValue = true;
			}
		}
		br_display.displayMessage("Unsynched Files:<br/>"+out);
	};

	var log_download = function(that, url, log_name, callback) {
		var param = {"fileName":log_name};

		jQuery.post(url, param, function(data, st) {
			//parse out text area
			var full_log = jQuery(data,doc).find("textarea").text();

			if(full_log.length < 1) {
				return;
			}

			callback(full_log);
		});
	};

	var with_log = function(that, callback) {
		var url = that.get_hostname_prefix();
		//the log url
		url += "admin/log/log_file.jsp";

		//v11
		log_download(that, url, "bm.log", callback);
		//v10
		log_download(that, url, "/bigmac/logs/bm.log", callback);
	};

	this.open_logs = function() {
		var that = this;
		with_log(that, function(full_log) {
			var file_location = that.get_temp_directory();
			br_editor.saveFileToDisk( file_location.path, "bm.log.txt", full_log );
			br_editor.launchEditor( file_location.path, "bm.log.txt" );
		});
	};

	this.search_logs = function() {
		//create url
		var doc = Application.activeWindow.activeTab.document;
		var url = doc.location.href;
		var end = url.indexOf(".com") + 5;
		url = url.substring(0, end);

		//the log url
		url += "admin/log/log_file.jsp";

		//the log params
		var log_name =  "/bigmac/logs/bm.log";
		var param = {"fileName":log_name};

		var path = 'D:\\logfiles' + this.get_hostname() + ".txt";
		jQuery.post(url, param, function(data, st) {
			//parse out text area
			var sfdc = data.match(/[a-zA-Z0-9]*\-[a-zA-Z0-9]*\.salesforce.com/g);

			br_display.displayMessage(sfdc.join("<br/>"));
		});
	};

	this.html_endlines = function(str) {
		var lines = str.split('\n');
		var out=str;
		for ( var i = 0, ii = lines.length; i < ii; i++) {
			out= ''
				var line=lines[i].split(' ');
			if(line.length > 1) {
				out += line[1] + "<br/>";
			}
		}
		return out;
	};

	//will check two locations for the data tables, and link to the first one it finds
	function get_data_table_link() {
		var root = that.get_hostname_prefix();
		var urls = [root+'admin/scripts/list_tables.jsp', root+'admin/scripts/edit_tables.jsp'];

		var link_found = that.find_valid_url(urls);

		link_found.then(function(link) {
			gBrowser.selectedTab = gBrowser.addTab(link);
		});
	}

	function proxy_logout() {
		br_log.notify("Checking if user can proxy out.");
		var url = that.get_hostname_prefix();
		jQuery.get(url+"/commerce/display_company_profile.jsp","",function(data){
			var testData = jQuery("<div/>",doc).append(data);
			//AH - verify user is proxied
			jQuery.get(url+"commerce/profile/edit_profile.jsp?_bm_trail_refresh_=true&navType=0","",function(data){
				var testData = jQuery("<div/>",doc).append(data);
				//check company
				jQuery("td:contains('*Company Name:') ~ td",testData).each(function(index){
					if(jQuery(this).html() == "BigMachines.com"){
						br_log.error("Can't proxy out as a service login.");
					}else{
						//let's do it
						var param = {"proxy_logout":"true","_bm_trail_refresh_":"true"};
						var logout = jQuery.get(url + "/logout.jsp?", param, function(data, st) {
							that.do_proxy_login();
						});
					}
				});
			});
		});
	}

	function open_deployment_center () {
		var process_id = jQuery("input[name='process_id']",doc).val() || -1;
		if(process_id == -1){
			var process_id = /process_id=(\d*)?/g.exec(jQuery("table.plain-button[onmouseout*=process_id]",doc).attr("onmouseout")) || -1;
			process_id = process_id[1] || -1;
		}
		if(process_id == -1){
			var process_id = br_utils.urlParam("process_id");
			process_id = process_id || -1;
		}
		if(process_id == -1 && params.url.indexOf("edit_process.jsp") > -1){
			var process_id = br_utils.urlParam("id");
			process_id = process_id || -1;
		}
		var segment_id = jQuery("input[name='segment_id']",doc).val() || -1;
		if(segment_id == -1){
			var segment_id = jQuery("input[name='ref_id']",doc).val() || -1;
		}
		if(process_id != -1){
			gBrowser.selectedTab = gBrowser.addTab(that.get_hostname_prefix()+"admin/commerce/processes/schedule_events.jsp?process_id="+process_id);
		}else if (segment_id != -1){
			gBrowser.selectedTab = gBrowser.addTab(that.get_hostname_prefix()+"admin/configuration/schedule_deployment.jsp?ref_type=2&ref_category=1&ref_id="+segment_id+"&attribute_category=2&_fromQlink=0");
		}else{
			br_log.error("I'm sorry, Dave. I can't let you deploy that.");
		}
	}

}

hot_box.prototype = new BR_Content();
