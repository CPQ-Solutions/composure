br_utils.create_plugin ({	
'name':'configuration_rule',
'author':'Michael Wheeler',
'description':'Enables version control for a config rule within BigMachines.',
regex_urls: ['spring\/configrule'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	params.url = doc.location.href;

	params.rule_type = jQuery("input[id='rule_type']", doc).attr("value");
	params.var_name = jQuery("input[name='variableName']", doc).attr("value");
	params.ref_type = jQuery("input[id='ref_type']", doc).attr("value");
	params.rule_id = jQuery("input[name='rule_id']", doc).attr("value");
	params.field_name = jQuery("input[id='field_name']", doc).attr("value");
						
	return params;
},
'matches_page':function(p) {
	return (true);
},
'content': content_config_rule,
'multiple_loads': true
});


function content_config_rule(params) {
		var jQuery = this.jQuery, doc = this.doc;
		/*clicker = "<input id='testasdfahsdhfk' value='home' onclick=\"alert('woohoo')\"></input>" + 
					"<input id='testmastere' value='homess' onclick=\"getElementById('testasdfahsdhfk').onclick()\"></input>";
				/*"<script>(function(){" +
				//"document.getElementById('textarea').change();" +
				"alert('called');" +
				"}());</script>";
		
		jQuery("body",doc).append(clicker);*/
		
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "config_rule";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = this.parameters['var_name']+".";
		if(params.url.indexOf("admin/configuration/rules/edit_rule") > -1){
		//alert("test");
		f = f+(jQuery("div[class*='x-view-item x-view-item-sel']",doc).html().substring(77));
		//doc.getElementById('testasdfahsdhfk').onclick();
		//alert("fail");
		//alert(jQuery("textarea[id='textarea']",doc).html());
		//f = f+jQuery("span[id='x-auto-100-label']",doc).html();
		}else{
		f = f+this.parameters['field_name'];
		}
		f = f +"."+this.parameters['rule_id'];
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {
	/**
	 * These map the config ref_type and rule_type to a legible
	 * human readable format for directory names
	 */
		var rule_type_map = {
			 '1': 'Recommendations'
			,'2': 'Constraints'
			,'3': 'BOM'
			,'4': 'Pricing'
			,'6': 'ConfigFlows'
			,'7': 'SearchFlows'
			,'9': 'RecommendedItems'
			,'10': 'Tabs'
			,'11': 'Hiding'
		};
		var ref_type_map = {
			 '1': 'AllProducts'
			,'2': 'ProductFamily'
			,'3': 'ProductLine'
			,'4': 'Model'
			,'5': 'Rules'
		};

		var rule_level = ref_type_map[this.parameters['ref_type']] || this.parameters['ref_type'];
		var rule_type = rule_type_map[this.parameters['rule_type']] || this.parameters['rule_type'];
		var d = 'Config\\' + rule_level + '\\' + rule_type + '\\';
		
		return this.directory_sanitize(d);
	};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".bml";};
	/**
	 * actions
	 */
	this.faster = function() {
		//var frame = jQuery("#frame_bm_script", doc).contents().get();
		//jQuery("#container",frame).remove();
		
	};



	//this.send_to_editor = function() {};
	/*
	this.initiate_display = function() {		
		//initiate_display can be called more than once - testing to make sure we only draw once
		var me=this;
		br_display.create_display_pane(this.get_script_type());
		
		br_utils.reportInfo('Initiating Display...');
		//buttons appear in the order they are created, top to bottom
		br_display.add_launch_editor_button();
		br_display.add_read_file_button();
		br_display.add_commit_button();
		
		br_display.add_separator_to_display_pane();
		br_display.add_button_to_display_pane('Open Containing Folder', 'br_folder_button', function() {
			me.open_folder();
			return false;
		});
		//br_display.add_get_url_button(me);
		br_display.add_view_revisions_button();
		
		br_display.show_display_pane();
		//br_display.show_buttons();
	};	*/
}
content_config_rule.prototype = new BR_Content();
