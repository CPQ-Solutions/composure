br_utils.create_plugin ({	
'name':'configuration rule r11',
'author':'Kenny Browne, Michael Wheeler',
'description':'Enables version control for a config rule within BigMachines > 10.',
regex_urls: ['admin/configuration/rules/edit_rule'],
'get_parameters':function(doc, jQuery) {
	var params = {};
	
	params.url = doc.location.href;
	//version 11
	params.rule_type = jQuery("input[name='rule_type']", doc).attr("value");
	params.var_name = jQuery("input[name='varName']", doc).attr("value");
	params.ref_type = "5";
	params.rule_id = jQuery("input[name='rule_id']", doc).attr("value");
						
	return params;
},
'matches_page':function(p) {
	return (true);
},
'content': content_config_ruler11,
'multiple_loads': true
});

function content_config_ruler11(params) {
	var $ = this.jQuery, doc = this.doc, me = this;

	function select_buttons() {
		return $("button[class*='x-btn-text']",doc);
	}
	function is_condition_button(arg) {
		return $(arg).html().indexOf("View/Edit the BML Function")>-1;
	}
	function is_message_button(arg) {
		return ($(arg).closest("table").closest("td").closest("table").closest("td").closest("table").closest("td").prev().html()||"").indexOf("textarea")>-1;
	}
	function is_displayPrice_button(arg) {
		return ($(arg).closest("table").closest("td").closest("table").closest("td").closest("table").closest("td").closest("table").closest("div[class*='x-component']").closest("div[class*='x-form-element']").prev().html()||"").indexOf("user?") >-1 ;
	}
	function is_addedToPrice_button(arg) {
		return ($(arg).closest("table").closest("td").closest("table").closest("td").closest("table").closest("td").closest("table").closest("div[class*='x-component']").closest("div[class*='x-form-element']").prev().html()||"").indexOf("price?") >-1 ;
	}
	function is_function_button(arg) {
		var test = $(arg).html().indexOf("Edit Function") > -1 || $(arg).html().indexOf("Define BML Function") > -1;
		return test;
	}
	function replace_selectedButton_value(newValue){
		//$("input[id='selectedButton']",doc).attr('value',newValue);
		br_global.selectedButton = newValue;
	}

	this.set_button_clicks = function(){	
		if(br_global.selectedButton === undefined) {
			br_global.selectedButton = "true";
		}
		var button_string = "";
		select_buttons().each(function(){ 
				var that = this;
				//br_utils.reportInfo($(that).html());
				if(is_condition_button(that)) {
				$(that).click(function() {
						replace_selectedButton_value('condition');
					});
				}else if(is_message_button(that)) {
				$(that).click(function() {
						replace_selectedButton_value('message');
					});		
				}else if(is_displayPrice_button(that)) {
				$(that).click(function() {
						replace_selectedButton_value('displayPrice');
					});		
				}else if(is_addedToPrice_button(that)) {
				$(that).click(function() {
						replace_selectedButton_value('addedToPrice');
					});	
				}else if(is_function_button(that)) {
				$(that).click(function() {
						replace_selectedButton_value('function');
					});		
				}
		});
		if($("input[id='selectedButton']",doc).length < 1) {
			$("#br_menu_div",doc).append("<input id='selectedButton' style='display: none;'></input>");
		}
		//br_display.displayMessage(br_global.selectedButton);
		$("#br_menu_div #selectedButton", doc).attr("value", br_global.selectedButton);
	};

	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {return "config rule r11";};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f,name;
		var name = $("div[class*='x-view-item x-view-item-sel']",doc).html();
		br_global.selectedButton = br_global.selectedButton || "";
		
		if(this.parameters['var_name']) {
			f = this.parameters['var_name']+".";
		}

		if(br_global.selectedButton === "function") {
			if(typeof name !== "string") {
				f += "";
			} else {
				f = f+(name.substring(77))+".";
			}
		} else if(br_global.selectedButton === "false"){
			f = f+"recItem";		
		}
		f = f+br_global.selectedButton;	

		if(this.parameters['rule_id']) {
			f = f +"."+this.parameters['rule_id'];
		}

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
	this.get_extension = function() {return ".bml";};
	/**
	 * actions
	 */
	this.faster = function() {
		//var frame = $("#frame_bm_script", doc).contents().get();
		//$("#container",frame).remove();
	};

	/**
	 * Simple Blocking object. To have it unblock after a set time,
	 * pass in the time in milliseconds as a string.
	 * Pass in -1 to require a call to unset the block
	 **/
	var blocker = function(time) {
		time = time || "1000";
		
		var blocked = false, timer;
	
		function unset() {
			blocked = false;
		}
		
		function set() {
			blocked = true;
			if(time !== -1) {
				timer = window.content.setTimeout(unset, time);
			}
		}

		function is_blocked() {
			return blocked;
		}
		
		return {
			set: set,
			unset: unset,
			is_blocked: is_blocked
		}
	}

	function watch_for_remove(el, callback) {
		$(el).unbind("DOMNodeRemoved");
		$(el).bind("DOMNodeRemoved", callback);
	}
	function watch_for_insert(el, callback) {
		$(el).unbind("DOMNodeInserted");
		$(el).bind("DOMNodeInserted", callback);
	}
	function watch_for_change(el, callback) {
		$(el).unbind("DOMAttrModified");
		$(el).bind("DOMAttrModified", callback);
	}

	this.on_page_load = function(){
		this.initiate_display();
		
		// we are going to use this blocker to avoid massive event firing
		var b=blocker("2000"), 
		modified_callback = function(e) {
			var target = e.target;
			if(b.is_blocked()) { return; }

			if(!(target && target.tagName)) { return; }

			if(target.tagName.toLowerCase() === "button") {
				b.set();
				me.set_button_clicks();
				//br_utils.reportInfo(target.tagName);
			}
		}

		watch_for_change($("body",doc), modified_callback);
		
		var t = setTimeout(this.set_button_clicks, "1500");
	}
}
content_config_ruler11.prototype = new BR_Content();
