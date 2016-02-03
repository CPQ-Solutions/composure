(function() { BR_Utils.create_plugin ({	
	name:'quick_search',
	/** Take Credit! **/
	author:'Leon Soares', 
	/** Decide when the plugin runs. **/
	/** 
	* 1st step: url compare
	*	Each regular expression in this array will be compared to the URL on page load.
	* If any of these match, then we move on to the next filter.
	*/
	regex_urls: ["commerce/buyside/commerce_manager.jsp"],
	/**
	* 2nd step: scrape the page
	* Use this function to grab anything off the page that you want to use later.
	*/
	get_parameters:function(doc) {
		var params = {};
		params.url = doc.location.href;
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
		var IwantItbroken = false;
		this.faster = function(){IwantItbroken = true;}
		this.get_script_type = function() {return "quick_search";};
		var that = this;
		var pm = Components.classes["@mozilla.org/preferences-service;1"]
											 .getService(Components.interfaces.nsIPrefService)
											 .getBranch("extensions.sangfroid.");
		var history_editor_pref = pm.getBoolPref("open_history_editor");
		var document_editor_pref = pm.getBoolPref("open_document_editor");
		
		var filterAttributesDropdown;
		/**
		* These functions are called when the plugin is loaded. This is your starting point. 
		*/
		this.buildSearchContainer = function() {
			var searchContainer = doc.createElement("div");
			searchContainer.id = "sangfroidStyle";
			//Add the search filters dropdown
			var searchFilter = doc.createElement("span");
			//searchFilter.innerHTML = "<span>Search By :</span>"
			
			// global (good god, yall)
			filterAttributesDropdown = doc.createElement("select");
			filterAttributesDropdown.id = "filter-attr-list";
			searchFilter.appendChild(filterAttributesDropdown);
			searchFilter.className="sangfroidStyle";
			searchContainer.appendChild(searchFilter);

			//Add the searchbar
			var searchbar = doc.createElement("input");
			searchbar.type = "text";
			searchbar.id = "quick-search-bar";
			searchbar.className="sangfroidStyle";
			searchContainer.appendChild(searchbar);
			//Add the search button.
			/*var searchBtn = doc.createElement("input");
			searchBtn.type = "button";
			searchBtn.value = "Surprise Me!";
			searchBtn.id = "quick-search-now";
			searchContainer.appendChild(searchBtn);
			*/
			return searchContainer;
		};
		function createFilterMenuItem(filterSelectElement, menuLabel, menuValue){
			var menuItem = doc.createElement("option");
			menuItem.value = menuValue;
			menuItem.label = menuLabel;
			menuItem.innerHTML = menuLabel;
			filterSelectElement.appendChild(menuItem);
		}
		
		function loadSearchPlugin(searchContainer){
			jQuery("#br_log_quote_search_location",doc).append(searchContainer);
			jQuery("#sangfroidStyle",doc).append("<style>.sangfroidStyle{float:left;}#sangfroidStyle{height:10px;}</style>");
			//jQuery("#sangfroidStyle",doc).append("<table cellspacing='0' cellpadding='0' class='sangfroidStyle' id='sangfroidButton_result' style='cursor: pointer;'><tbody><tr><td class='button-left'><img src='/img/button10.gif' class='button-left'></td><td nowrap='true' class='button-middle'><div style='margin: 0px 0px 1px;'><a href='#' id='comp_search' name='comp_search' class='button-text'>Open Result</a></div></td><td class='button-right'><img src='/img/button10.gif' class='button-right'></td></tr></tbody></table>");
			//jQuery("#sangfroidStyle",doc).append("<table cellspacing='0' cellpadding='0' class='sangfroidStyle' id='sangfroidButton_history' style='cursor: pointer;'><tbody><tr><td class='button-left'><img src='/img/button10.gif' class='button-left'></td><td nowrap='true' class='button-middle'><div style='margin: 0px 0px 1px;'><a href='#' id='comp_search' name='comp_search' class='button-text'>Open History</a></div></td><td class='button-right'><img src='/img/button10.gif' class='button-right'></td></tr></tbody></table>");
			jQuery("#sangfroidStyle",doc).append("<select class='sangfroidStyle' id='sangfroid_func_val'><option value='result'>Open Quote</option><option value='search'>Open Search Results</option><option value='document'>Open Doc XML</option><option value='history'>Open History XML</option><option value='bs_id'>Copy Transaction ID</option></select>");
			jQuery("#sangfroidStyle",doc).append("<table cellspacing='0' cellpadding='0' class='sangfroidStyle' id='sangfroidButton_enter' style='cursor: pointer;'><tbody><tr><td class='button-left'><img src='/img/button10.gif' class='button-left'></td><td nowrap='true' class='button-middle'><div style='margin: 0px 0px 1px;'><a href='#' id='comp_search' name='comp_search' class='button-text'>Submit</a></div></td><td class='button-right'><img src='/img/button10.gif' class='button-right'></td></tr></tbody></table>");
			
		}
		
		function getHostnamePrefix() {
			var url = doc.location.href;
			var end = url.indexOf(".com") + 5;
			url = url.substring(0, end);

			return url;
		}
		this.buildFilters = function(searchContainer, procId, versionId) {
			var filtersUrl = getHostnamePrefix() + "/commerce/buyside/search/cm_search.jsp?&process_id="+ procId;
			jQuery.get(filtersUrl, function(responseTxt){
				var dom = jQuery("<div/>",doc).append(responseTxt);
				var allCheckboxes = jQuery("div#display [class*='bgcolor-list'] input",dom);
				var containsFilters = true;
				var firstItem = "";
				allCheckboxes.each(function() {
					var filterId = this.id.split("_list")[1];
					var name = jQuery(this).parent().next().text();
					//var temp_check = jQuery(filterChild).children("a").html().toLowerCase();
					if(name == "Quote Number"){
						firstItem = filterId;
					}else if(name.indexOf("Quote Number")>-1 && firstItem == ""){
						firstItem = filterId;
					}
					createFilterMenuItem(filterAttributesDropdown, name, filterId);
				});
				//AH System Transaction ID
				createFilterMenuItem(filterAttributesDropdown, "BS_ID", -1);
				jQuery(filterAttributesDropdown,doc).children().each(function(){
					if(jQuery(this).attr("value").indexOf(firstItem)>-1){
						jQuery(this).attr("selected", true);
					}
				});
				
				if(containsFilters){
					loadSearchPlugin(searchContainer);
					bindClick(procId, versionId);
				}
			});
		};
		
		function bindClick(processId, versionId) {
			//AH - enter behavior
			jQuery("form[name='bmDocForm']",doc).submit(function() { return false; });
			jQuery("#quick-search-bar",doc).keyup(function(event){
				if(event.keyCode == 13){
					//jQuery("#sangfroidButton_result",doc).click();
					jQuery("#sangfroidButton_enter",doc).click();
				}
			});
			
			//AH use one function instead of 2
			var quick_search_click = function (button){
				br_utils.loadLock();
				var filterId = jQuery("#filter-attr-list",doc).val();
				var searchVal = jQuery("#quick-search-bar",doc).val();
				
				var searchUrl = getHostnamePrefix()+"commerce/buyside/search/search_inputs.jsp?perform_search=true";
				searchUrl = searchUrl + "&process_id=" + processId;
				searchUrl = searchUrl + "&version_id=" + versionId;
				searchUrl = searchUrl + "&page_length=25";
				searchUrl = searchUrl + "&comp_" + filterId + "=" + "_eq";
				searchUrl = searchUrl + "&value_" +filterId + "=" + searchVal;
				searchUrl = searchUrl + "&orderHidden_" + filterId + "=1";
				searchUrl = searchUrl + "&display_as_link=" + filterId;
				searchUrl = searchUrl + "&checkedDisplayAttr=" + filterId;
				
				jQuery.get(searchUrl, function(responseTxt) {
					br_utils.loadLock();
					var quotesFoundDom = jQuery(responseTxt,doc);
					var quoteFound = false;
					var allQuotesFound = jQuery("a.list-field", quotesFoundDom);
					if(allQuotesFound.length > 0){
						//BR_Utils.reportError("here:"+allQuotesFound[0]);
						var quoteUrl = allQuotesFound[0].href;			
						quoteUrl = quoteUrl.match(/'.*'/);
						if(quoteUrl.length > 0){
							quoteUrl = quoteUrl[0].replace(/'/g,"");
							if(quoteUrl !== ""){
								quoteFound = true;
								var trans_id = /&id=(.*)/g.exec(quoteUrl);
								if(button == "history"){
									
									var history_url = getHostnamePrefix() + "admin/commerce/views/preview_xml.jsp?view_type=history&bs_id=" + trans_id[1];
									if(history_editor_pref){
										that.open_url_in_editor("history"+trans_id[1],history_url,"Could Not Find History XML");
									}else{
										gBrowser.selectedTab = gBrowser.addTab(history_url);	//@TODO
									}
								}else if( button == "document"){
									if(document_editor_pref){
										that.get_document_xml_url(function(url){
											that.open_url_in_editor("document"+trans_id[1],url,"Could Not Find Document XML");
										},trans_id[1]);
									}else{
										that.get_document_xml_url(function(url){
											gBrowser.selectedTab = gBrowser.addTab(url);
										},trans_id[1]);
									}
								}else if(button == "result"){
									gBrowser.selectedTab = gBrowser.addTab(getHostnamePrefix() + quoteUrl);	//@TODO	
								}else if(button == "bs_id"){
									that.copyToClipboard(trans_id[1]);
									br_log.notify("Copied "+trans_id[1]);
								}else if(button == "search"){
									gBrowser.selectedTab = gBrowser.addTab(searchUrl);
								}
							}
						}			
					}
					if(!quoteFound){
						alert("Could not find quote");
					}
				});
			};
			//jQuery("#sangfroidButton_result",doc).bind("click",function(){quick_search_click("result")});
			//AH - onclick of history action
			//jQuery("#sangfroidButton_history",doc).bind("click",function(){quick_search_click("history")});
			jQuery("#sangfroidButton_enter",doc).bind("click",function(){quick_search_click(jQuery("#sangfroid_func_val",doc).val())});
			//jQuery("#sangfroidButton_QuoteLink",doc).bind("click",function(){make_quote_links()});
		}
		function make_quote_links(){
			jQuery("div#cm-manager-content a.list-field",doc).each(function () {
				linkHref = this.href;
				if(linkHref.indexOf("javascript") == -1) return;
				linkParams = linkHref.split(";");
				newLinkParams = [];
				link = "/commerce/buyside/document.jsp?formaction=performAction&";
				for(m=0;m<linkParams.length;m++){
					linkParam = linkParams[m].replace(".value", "");
					if(linkParam.indexOf("bmDocForm.")>-1){
						linkVals = linkParam.split(".");
						newLinkParams[m] = linkVals[2];
					}
				}
				link = link + newLinkParams.join("&");
				this.href = link;
				jQuery(this).addClass("sangfroid_converted_link");
			});
			jQuery(".sangfroid_converted_link", doc).css({
				'color' : that.pm.getCharPref("color_text1"),
				'background-color' : that.pm.getCharPref("color_main1")
			});
		}
		//AH - actions to copy data from columns to quicksearch field
		function add_selectors(){
			var count = 0;
			jQuery("a.list-field,span.list-field",doc).each(function(){
				var elem = this;
				var this_val = jQuery(elem).html();
				var this_id = count + "_sangfroid_id";
				count = count + 1;
				var str = "<a id='" + this_id + "'  href='#' onclick='javascript:bmCancelBubble(event);' style='position:absolute;display:none;'><img src='resource://br_images/add.png'/></a>";
				jQuery(elem).parent().append(str);
				jQuery("#"+this_id,doc).click(function(){
					jQuery("#quick-search-bar",doc).val(this_val);
				});
				jQuery(elem).parent().hover(function () {
					jQuery("#"+this_id, doc).css({
						"display" : "inline"
					});
				}, function () {
					jQuery("#"+this_id, doc).css({
						"display" : "none"
					});
				});
			});
		}
		this.make_notification = function(){
			var that = this;
			var url = params['url']||"";
			var is_prod = br_utils.is_prod_site(url);
			var level = "";
			if(is_prod){
				level = "prod";
			}
			br_log.page("<div id='br_log_quote_search_location'></div><div style='height:15px;'></div>",level,function(){
				var procId = jQuery("input[name='bm_cm_process_id']",doc).val();
				var versId = jQuery("input[name='version_id']",doc).val();
				var sc = that.buildSearchContainer();
				if(jQuery("#sangfroidStyle",doc).length == 0){
					that.buildFilters(sc, procId, versId);
				}
			});
		};
		this.plugin_created_successfully = function() { return jQuery("#quick-search-now",doc).length > 0; }
		//this.on_page_load = function() { this.initiate_display(); };
		//this.faster = function() { /* code in here will run when "faster" is checked as an option */ };
		
		this.after_page_load = function() {
			/*
			var wait_time = 1000; //AH - because load order sucks
			setTimeout(function(){buildFilters(sc, procId, versId);jQuery("#sangfroid_log_load",doc).remove();}, wait_time);
			//turns onclick to link needs slight delay. Lines 208 and 106 run the function on button click as alt solution. 
			setTimeout(function(){make_quote_links();}, wait_time);
			*/
			this.initiate_display();
			this.load_enhancements();
		};
		
		this.load_enhancements = function() {
			that.make_notification();
			setTimeout(function(){
				if(IwantItbroken) make_quote_links();
				add_selectors();
			},100);
		};
		this.get_menu = function () {
			var me = this;
			//this.auto_sync(me);

			var m = br_menu(me.doc, me)
				.add_separator("br_tools", "Tools")
				.add_button_with_icon("br_refresh", "Reload Enhancements", "Reload",
					"chrome://sangfroid/content/img/ajax-loader.png", function () {
					me.load_enhancements();
				});
			if(!IwantItbroken){
				m.add_button_with_icon("br_convert", "Convert Links", "Convert",
					"chrome://sangfroid/content/img/html.png", function () {
					make_quote_links();
				});
			}
			return m;
		};
	}
	content.prototype = new BR_Content();
}());