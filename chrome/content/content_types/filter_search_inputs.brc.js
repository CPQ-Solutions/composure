br_utils.create_plugin(function () {
	var package = {
		name : 'filter_search_inputs',
		
		/** Take Credit! **/
		author : 'Kenny Browne',
		
		/** Decide when the plugin runs. **/
		/**
		 * 1st step: url compare
		 *	Each regular expression in this array will be compared to the URL on page load.
		 * If any of these match, then we move on to the next filter.
		 */
		regex_urls : ['edit_rule_inputs.jsp'],
		
		/**
		 * 2nd step: scrape the page
		 * Use this function to grab anything off the page that you want to use later.
		 */
		get_parameters : function (doc, jQuery) {
			var params = {};
			params.url = doc.location.href;
			return params;
		},
		
		/**
		 * 3rd step: test the page
		 * If this function returns true, then the plugin will be launched.
		 */
		'matches_page' : function (params) {
			var cond1 = true;
			//var cond2 = (params['title']||"").indexOf('some-value') > -1;
			
			return (cond1);
		},
		'content' : plugin,
	};
	
	/** Write your plugin! **/
	function plugin(params) {
		var $,
		jQuery = $ = this.jQuery,
		doc = this.doc;
		this.get_script_type = function () {
			return package.name;
		};
		var that = this;
		var page = 0;
		var indices = [];
		var scrollSpecial = true;
		/**
		 * content and elements on page
		 */
		this.get_script_type = function () {
			return "filter_and_search_inputs";
		};
		/**
		 * File naming and directories -
		 *
		 * These functions are called whenever the plugin
		 * is making a decision about where to save a file
		 */
		this.get_filename = function () {};
		this.get_extension = function () {};
		this.get_local_directory = function () {};
		this.plugin_created_successfully = function () {
			if (jQuery("#paginateAttributes", doc).length > 0) {
				return true;
			}
			return false;
		}
		/**
		 * Entry points -
		 * These functions are called by the firefox plugin directly
		 */
		this.on_launch_and_save = function () { //don't do anything
		}
		
		/**
		 * Sets the Window scroll action and moves down chain to hideElements
		 */
		this.initiate_display = function () {
			var i = 0;
			if (this.noButton()) {
				var domIdArr = ["_section0", "_section1", "_section2", "_section_import"];
				for (var x = 0, limit = domIdArr.length; x < limit; x++) {
					var domId = "#" + domIdArr[x];
					var dom = domIdArr[x];
					br_log.firebug(dom);
					jQuery(domId, doc).prepend("<input type='button' id='clear_found" + dom + "' value='Clear'/>");
					jQuery(domId, doc).prepend("<input type='button' id='find_hidden_att" + dom + "' value='Find'/>");
					jQuery(domId, doc).prepend("<input type='text' id='attSearch" + dom + "' value=''/>");
					jQuery("#find_hidden_att" + dom + "", doc).click(function () {
						var dom = jQuery(this).closest("div").attr("id");
						br_log.firebug(dom);
						that.findHidden(dom);
					});
					jQuery("#clear_found" + dom + "", doc).click(function () {
						var domNew = jQuery(this).attr("id").split("clear_found")[1];
						br_log.firebug(domNew);
						that.clearFound(domNew);
					});
					
					jQuery(doc).scroll(this.setScrollAction);
				}
			}
			
		};
		
		var getTRTags = function (dom) {
			var trTags = jQuery("div#" + dom, doc).children("table").children("tbody").children("tr");
			br_log.firebug(jQuery("div#" + dom, doc));
			var ret_tags = [];
			
			// build list of tags on "modify" tab
			for (var x = 0, xx = trTags.length; x < xx; x++) {
				if (trTags[x].className == "bgcolor-form" || trTags[x].className == "bgcolor-list-even") {
					ret_tags.push(trTags[x]);
				}
			}
			
			//only run the above search once
			//getTRTags = function() { return ret_tags; };
			
			return ret_tags;
		}
		this.removeTabs = function () {
			var tabs = doc.getElementsByClassName('page-tabs tab-strip clearfix');
			jQuery(tabs[0], doc).hide();
		}
		this.noButton = function () {
			var button = doc.getElementById("attSearch");
			return !button;
		}
		
		this.clearFound = function (dom) {
			br_log.firebug(doc.getElementById("attSearch"+dom));
			scrollSpecial = false;
			this.hideElements();
			var trTags = getTRTags();
			var numResults = indices.length;
			doc.getElementById("attSearch"+dom).value = "";
			br_log.firebug(doc.getElementById("attSearch"+dom));
			br_log.firebug("find_hidden_att"+dom);
			br_log.firebug(doc.getElementById("find_hidden_att"+dom));
			jQuery("#find_hidden_att"+dom,doc).click();
		}
		this.shouldPopulate = function () {
			var position = jQuery(doc).scrollTop();
			alert(position);
			var height = jQuery(doc).height();
			alert(height);
			var hme = height - 800;
			alert(hme);
			var pastThresh = ((height - 800) > position);
			alert(pastThresh);
			return (scrollSpecial) && (pastThresh)
		}
		this.findHidden = function (domId) {
			indices = [];
			scrollSpecial = false;
			this.hideElements(domId);
			var trTags = getTRTags(domId);
			var numResults = indices.length;
			br_log.firebug(numResults);
			br_log.firebug(doc.getElementById("attSearch" + domId));
			var attName = doc.getElementById("attSearch" + domId).value;
			br_log.firebug(doc.getElementById("attSearch" + domId));
			br_log.firebug(attName);
			var resultArr = [];
			var k = 0;
			for (i = 0; i < numResults; i++) {
				var tempAtt = trTags[indices[i]];
				jQuery(tempAtt).find("td").each(function(){
					if (jQuery(this).text().toLowerCase().indexOf(attName.toLowerCase()) !== -1) {
						
						br_log.firebug(jQuery(this).text().toLowerCase().indexOf(attName.toLowerCase()));
						resultArr[k] = tempAtt;
						k++;
					}
				})
				
			}
			br_log.firebug(k);
			var resLen = resultArr.length;
			
			for (i = 0; i < resLen; i++) {
				jQuery(resultArr[i], doc).show();
				resultArr[i].children[0].style.backgroundColor = '#FFFFFF';
			}
			
		}
		
		/**
		 * Hides all attributes then moves down chain to display first 30 elements
		 */
		this.hideElements = function (dom) {
			var i = 0;
			var trTags = getTRTags(dom);
			for (var x = 0, xx = trTags.length; x < xx; x++) {
				if (trTags[x].className == "bgcolor-form" || trTags[x].className == "bgcolor-list-even") {
					indices[i] = x;
					jQuery(trTags[x], doc).hide();
					i++;
				}
			}
			
		}
	}
	
	/**
	 * Don't change below here -
	 * The following lines need to remain intact at the bottom of the function
	 */
	plugin.prototype = new BR_Content;
	
	return package;
}
	());