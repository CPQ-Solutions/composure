br_utils.create_plugin(function () {
	var package = {
		name : 'gss_fer_real',
		/** Take Credit! **/
		author : 'Mike Wheeler and Kenny Browne',
		/** Decide when the plugin runs. **/
		/**
		 * 1st step: url compare
		 *	Each regular expression in this array will be compared to the URL on page load.
		 * If any of these match, then we move on to the next filter.
		 */
		regex_urls : ["/admin/scripts/search_script.jsp"],
		/**
		 * 2nd step: scrape the page
		 * Use this function to grab anything off the page that you want to use later.
		 */
		get_parameters : function (doc, jQuery) {
			var params = {};
			//params.url = doc.location.href;
			//params.title = jQuery("title", doc).html();
			return params;
		},
		/**
		 * 3rd step: test the page
		 * If this function returns true, then the plugin will be launched.
		 */
		'matches_page' : function (params) {
			var cond1 = br_utils.urlParam('gss') == "true";
			//var cond2 = (params['title']||"").indexOf('some-value') > -1;

			return (cond1);
		},
		'content' : plugin,
	};
	/** Write your plugin! **/
	function plugin(params) {
		var $,
		jQuery = $ = this.jQuery,
		doc = this.doc,
		gss_searchable,
		host,
		plugin = this,
		that = this,
		process_list = [];
		this.get_script_type = function () {
			return package.name;
		};
		//get the http(s)://SITENAME.bigmachines.com
		function get_hostname_prefix() {
			var url = doc.location.href,
			end = url.indexOf(".com") + 5;
			url = url.substring(0, end);
			return url;
		}
		host = get_hostname_prefix();
		//create an interval to poll if the specific search has completed
		//Used in do_search, doc_engine_searchable.search, and file_manager_searchable.search
		function runInterval(arr, defer, label) {
			try {
				label = label || "";
				var id = window.setInterval(function () {
						var all = arr.length;
						if (all <= 1) {
							//Clear the interval once the search is complete
							window.clearInterval(id);
							defer.resolve(label);
							return "";
						}
						_(arr).each(function (item, index, all) {
							if (Q.isFulfilled(item)) {
								arr.pop(index);
							}
						});
					}, 300);

			} catch (e) {
				br_log.firebug(e);
			}
		}
		//This is called when the Search button is clicked and processes the searches
		function do_search(ready) {
			//A call to reset all search elements
			that.clear_search();
			//Create the overlay to lock the page until the search has completed
			jQuery(".overlay", doc).css("display", "block");
			jQuery(".message", doc).css("display", "block");
			jQuery(".gif", doc).css("display", "block");
			var term = $("#br-search-string", doc).val().trim();
			//Once the processes have been found run
			ready.then(function (process_list) {
				if (typeof process_list === "string") {
					return "";
				}
				var search_list_arr = "";
				search_list_arr = jQuery(".br-select", doc).val();
				//default search_list_arr
				if (search_list_arr === null) {
					search_list_arr = ["gss"];
				}
				//Create the defers and the promises for each searchable
				var gss_defer = Q.defer(),
				header_footer_defer = Q.defer(),
				global_functions_defer = Q.defer(),
				integrations_defer = Q.defer(),
				parts_integrations_defer = Q.defer(),
				file_manager_defer = Q.defer(),
				account_integration_defer = Q.defer(),
				printer_friendly_defer = Q.defer(),
				doc_engine_defer = Q.defer();
				var gss_done = gss_defer.promise,
				header_footer_done = header_footer_defer.promise,
				global_functions_done = global_functions_defer.promise,
				integrations_done = integrations_defer.promise,
				parts_integrations_done = parts_integrations_defer.promise,
				file_manager_done = file_manager_defer.promise,
				account_integration_done = account_integration_defer.promise,
				printer_friendly_done = printer_friendly_defer.promise,
				doc_engine_done = doc_engine_defer.promise;

				//Run each search that does not process dependant
				gss_searchable.run_search(term, search_list_arr, gss_defer);
				header_footer_searchable.run_search(term, search_list_arr, header_footer_defer);
				global_functions_searchable.run_search(term, search_list_arr, global_functions_defer);
				parts_integration_searchable.run_search(term, search_list_arr, parts_integrations_defer);
				file_manager_searchable.run_search(term, search_list_arr, file_manager_defer);
				account_integration_searchable.run_search(term, search_list_arr, account_integration_defer);
				doc_engine_searchable.run_search(term, search_list_arr, doc_engine_defer);
				br_log.firebug(gss_done);
				//run all that are process dependent
				var int_defer = Q.defer(),
				xsl_defer = Q.defer(),
				int_promise = int_defer.promise,
				xsl_promise = xsl_defer.promise,
				process_defer_arr_int = [],
				process_defer_arr_xsl = [];
				_(process_list).each(function (id, index, list) {
					var defer = Q.defer(),
					p = defer.promise;
					process_defer_arr_int.push(p);
					integrations_searchable.run_search(term, id.id, id.name, search_list_arr, process_defer_arr_int);
					printer_friendly_searchable.run_search(term, id.id, id.name, search_list_arr, process_defer_arr_xsl);
				});
				//Calls to create the poll for integration_searchabel, and printer_friendly_searchable
				runInterval(process_defer_arr_int, int_defer);
				runInterval(process_defer_arr_xsl, xsl_defer);
				//Join all of the promises for each search
				/*
				 * Once complete clear the overlay lock
				 * Display results or no result div
				 */
				Q.join(int_promise, xsl_promise, gss_done, header_footer_done, global_functions_done, parts_integrations_done, file_manager_done, account_integration_done, doc_engine_done, function (inte, xsl, g, f, gf, pi, fm, ai, dc) {
					var result_num = gss_searchable.results_commerce.length +
						gss_searchable.results_config.length +
						gss_searchable.results_util.length +
						gss_searchable.results_orphaned.length +
						header_footer_searchable.results.length +
						global_functions_searchable.results.length +
						parts_integration_searchable.results.length +
						file_manager_searchable.results.length +
						account_integration_searchable.results.length +
						doc_engine_searchable.results.length;
					if (result_num === 0) {
						jQuery(".no_results", doc).css("display", "block")
					}
					jQuery(".gss-global", doc).css("display", "block");
					jQuery(".overlay", doc).css("display", "none");
					jQuery(".message", doc).css("display", "none");
					jQuery(".gif", doc).css("display", "none");
				});

			});
			return false;
		}
		/**
		 * These functions are called when the plugin is loaded. This is your starting point.
		 */
		// douglas crockford prototypal inheritance
		//The functions to clone objects
		//clone and extend
		function clone(obj) {
			function F() {}
			F.prototype = obj;
			return new F();
		}

		function extend(sup, sub) {
			return jQuery.extend(clone(sup), sub);
		}
		//This is the base searchable that the other extend
		/*
		 * This and subsequent searchables include the following functions
		 * They may be overwritten or extended and could contains additional function but these are the base
		 * 1. create_sub: creates the function to allow cloning and overwriting
		 * 2. label: The label of the object
		 * 3. id: The id of the object
		 * 4. template_url: The url the html template is located
		 * 5. css_url: (Deprecated) The url the css is located
		 * 6. detail_url: A function that will return the secondary level if necessary
		 * 7. results: the object array returned from the search
		 * 8. page: (Deprecated)
		 * 9. run_search: The function called to determine if this search should be run the run it
		 * 10. get_file: The function to get a file instead of a page
		 * 11. get_list: The function used to get the HTML element of a page from a url
		 * 12. list_url: The function to store the first level url
		 * 13. get_tempaltes: calls the css_url and the tempalte_url to return the data
		 * 14. get_title: returns the title from the element passed in
		 * 15. get_text:  returns the text from the element passed in
		 * 16. get_lines:  returns the link from the element passed in
		 * 17. get_link: returns the link to the returned data
		 * 18. each: the function to evaluate each file and find the results
		 * 19. sort_title: The function to sort the title alphabetically
		 * 20. search: The main function used to search through each level to find the results
		 * 21. render: used to display the results if any to the user
		 */
		var default_searchable = {
			create_sub : function (overrides) {
				return extend(this, overrides);
			},
			label : "Commerce, Config, Utils",
			id : "gss",
			template_url : "chrome://sangfroid/content/templates/gss_section.text",
			alt_template_url : "chrome://sangfroid/content/templates/gss_section.text",
			css_url : "chrome://sangfroid/content/templates/gss_css.text",
			detail_url : function () {},
			results : [],
			page : null,
			run_search : function (term, arr, defer) {
				var defer_search = Q.defer(),
				complete = defer_search.promise,
				that = this;
				if (arr.indexOf(this.id) > -1) {
					this.search(term, defer_search);
					complete.then(function (string) {
						defer.resolve(that.id);
					});
				} else {
					defer.resolve("");
				}

			},
			get_file : function (url) {
				var me = this,
				d = Q.defer(),
				me = this;
				jQuery.ajax({
					url : url,
					success : function (data) {
						try {

							var div = doc.createElement("div");
							div.innerHTML = data;

							d.resolve({
								page : div,
								url : url
							});
						} catch (e) {
							br_log.firebug(e)
						}
					},
					error : function (x, e) {
						if (x.status == 0) {
							d.resolve("You are offline!!\n Please Check Your Network.");
						} else if (x.status == 404) {
							d.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
						} else if (x.status == 500) {
							d.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
						} else if (e == 'parsererror') {
							d.resolve("Error.\nParsing JSON Request failed.");
						} else if (e == 'timeout') {
							d.resolve("Request Time out.");
						} else {
							d.resolve('Unknow Error.\n' + x.responseText);
						}
					}
				});

				return d.promise;
			},
			get_list : function (term) {
				var d = Q.defer(),
				me = this,
				me = this;
				jQuery.ajax({
					url : me.list_url(term),
					beforeSend: function(xhr){xhr.setRequestHeader("Referer", host + "/admin/scripts/search_script.jsp");},
					success : function (data, st) {
						var div = doc.createElement("div");
						div.innerHTML = data;
						me.page = div;
						d.resolve(div);
					},
					error : function (x, e) {
						if (x.status == 0) {
							d.resolve("You are offline!!\n Please Check Your Network.");
						} else if (x.status == 404) {
							d.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
							return "";
						} else if (x.status == 500) {
							d.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
							return "";
						} else if (e == 'parsererror') {
							d.resolve("Error.\nParsing JSON Request failed.");
						} else if (e == 'timeout') {
							d.resolve("Request Time out.");
						} else {
							d.resolve('Unknow Error.\n' + x.responseText);
						}
					}
				});
				return d.promise;
			},
			list_url : function (term) {
				return host + "/admin/scripts/search_script.jsp?ignore_case=1&formaction=searchBmScript&search_string=" + term;
			},
			get_templates : function () {
				var css = br_load.css(this.css_url),
				html = br_load.template(this.template_url);
				return Q.join(html, css, function (html, css) {
					return {
						html : html,
						css : css
					};
				});
			},
			get_title : function (page) {
				return page;
			},
			get_text : function (page) {
				var text = $(page).val();
				return "<pre>" + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "<\pre>";
			},
			get_lines : function (page, term, delimiter) {
				var me = this,
				text = me.get_text(page),
				arr = text.split(delimiter),
				res = "",
				re = "";
				if (jQuery("[name*='search_word']", doc).attr("checked")) {
					re = new RegExp("\\b" + term + "\\b", 'g');
					_(arr).each(function (item, indexThisFile, full) {
						if (item.toLowerCase().split(re).length === 1) {
							return;
						}
						res = res + (indexThisFile + 1) + ", ";
					});
				} else {
					_(arr).each(function (item, indexThisFile, full) {
						if (item.toLowerCase().indexOf(term.toLowerCase()) === -1) {
							return;
						}
						res = res + (indexThisFile + 1) + ", ";
					});
				}
				res = res.substring(0, res.length - 2)

					return res;
			},
			get_link : function (page) {
				return "";
			},
			each : function (callback) {
				var form = $("form[name='bmForm']", this.page);
				form = $("td.general-text", form).closest("table");
				_(form).forEach(function (val, idx, list) {
					callback(val, idx, list);
				});
			},
			sort_title : function () {
				this.results.sort(function (a, b) {
					if (a.title === b.title) {
						return 0;
					}
					return a.title < b.title ? -1 : 1;
				});
			},
			search : function (term, defer) {
				var me = this,
				promise = me.get_list(term);
				me.results = [];
				promise.then(function (data) {
					try {
						if (typeof data === "string") {
							defer.resolve("");
							return "";
						}
						me.each(function (table, idx, list) {
							if (me.get_section(table) === "Commerce") {

								me.results_commerce.push({
									title : me.get_title(table),
									text : me.get_text(table),
									line_numbers : me.get_lines(table, term),
									link : me.get_link(table)
								});
							}
						});
					} catch (e) {
						br_log.firebug(e)
					}
					me.render();
					defer.resolve("");

				});
			},
			render : function (root, number) {

				var me = this;
				me.get_templates().then(function (html_and_css) {
					try {
						var templateTop = html_and_css.html(me);
						/*if(templateTop.indexOf("You must be logged in to access this page")>-1 || templateTop.indexOf("Sangfroid Login")>-1){
						var htmler = br_load.template(me.alt_template_url);
						htmler.then(function(templater) {
						number.html("Number of Results [" + me.results.length + "]");
						if(me.results.length > 0){
						jQuery(root).closest("[class*='-all-section']").css("display", "block");
						jQuery(root).closest("[class*='-all-section']").next("br").css("visibility","visible");
						jQuery(root).closest("[class*='-all-section']").next("br").css("display","");
						}
						root.html('<div class="master-functions"><div class="max-all">Maximize-All</div><div class="min-all">Minimize-All</div></div><br/>' + templater(me));
						});
						}else{*/
						number.html("Number of Results [" + me.results.length + "]");
						if (me.results.length > 0) {
							jQuery(root).closest("[class*='-all-section']").css("display", "block");
							jQuery(root).closest("[class*='-all-section']").next("br").css("visibility", "visible");
							jQuery(root).closest("[class*='-all-section']").next("br").css("display", "");
						}

						root.html('<div class="master-functions"><div class="max-all">Maximize-All</div><div class="min-all">Minimize-All</div></div><br/>' + templateTop);
						//}
					} catch (e) {
						br_log.firebug(e)
					}
				});
			}
		}
		/*Copies default_searchable
		 * overwrites label, id, get_title, get_text, get_link, get_section, sort_title, search, and render
		 * addsresults_commerce, results_config, and results_utils, AH - orphaned records
		 */
		gss_searchable = default_searchable.create_sub({
				results_commerce : [],
				results_config : [],
				results_util : [],
				results_orphaned : [],
				get_title : function (page) {
					var title = $("td.view-header", page);
					title = $("td.view-header", page).text();
					title = title && title.match(/[\s]([\w].*)/);
					title = title && title[1];

					return title;
				},
				get_text : function (page) {
					var text = $("td.general-text", page).html();
					return text;
				},
				get_link : function (page) {
					var link = $("td.view-header", page).html();
					link = link.split("-->")[0];
					link = link.split("<!--")[1];
					link = link.split("=")[1];

					return "";
				},
				get_section : function (page) {
					var title = this.get_title(page),
					section;
					var section1 = "";
					if(title){
						section1 = title.substring(0,title.indexOf(":"));
					}
					if (title && section1.match(/Commerce/)) {
						section = "Commerce"
					} else if (title && section1.match(/Config/)) {
						section = "Config"
					} else if (title && section1.match(/Util/)) {
						section = "Util"
					} else {
						section = "Orphaned";
					}
					return section;
				},
				sort_title : function (result_set) {
					result_set.sort(function (a, b) {
						if (a.title === b.title) {
							return 0;
						}
						return a.title < b.title ? -1 : 1;
					});
					return result_set;
				},
				search : function (term, defer) {
					var me = this,
					promise = me.get_list(term);
					me.results_commerce = [];
					me.results_config = [];
					me.results_util = [];
					me.results_orphaned = [];
					promise.then(function (data) {
						try {
							me.each(function (table, idx, list) {
								if (me.get_section(table) === "Commerce" && me.get_lines(table, term, /\n/g).length > 0) {
									
									me.results_commerce.push({
										title : me.get_title(table),
										text : me.get_text(table),
										line_numbers : me.get_lines(table, term, /\n/g),
										link : me.get_link(table),
										section : me.get_section(table)
									});
								} else if (me.get_section(table) === "Config" && me.get_lines(table, term, /\n/g).length > 0) {
									
									me.results_config.push({
										title : me.get_title(table),
										text : me.get_text(table),
										line_numbers : me.get_lines(table, term, /\n/g),
										link : me.get_link(table),
										section : me.get_section(table)
									});
								} else if (me.get_section(table) === "Util" && me.get_lines(table, term, /\n/g).length > 0) {
									
									me.results_util.push({
										title : me.get_title(table),
										text : me.get_text(table),
										line_numbers : me.get_lines(table, term, /\n/g),
										link : me.get_link(table),
										section : me.get_section(table)
									});
								} else if (me.get_section(table) === "Orphaned" && me.get_lines(table, term, /\n/g).length > 0) {
									
									me.results_orphaned.push({
										title : me.get_title(table),
										text : me.get_text(table),
										line_numbers : me.get_lines(table, term, /\n/g),
										link : me.get_link(table),
										section : me.get_section(table)
									});
								}
							});
						} catch (e) {
							br_log.firebug(e)
						}
						me.results_commerce = me.sort_title(me.results_commerce);
						me.results_config = me.sort_title(me.results_config);
						me.results_util = me.sort_title(me.results_util);
						me.results_orphaned = me.sort_title(me.results_orphaned);
						var commerce_root = $(".commerce-section-results", doc),
						cofig_root = $(".config-section-results", doc),
						util_root = $(".util-section-results", doc),
						orphaned_root = $(".orphaned-section-results", doc);
						var commerce_number = $(".commerce-number-of-results", doc),
						config_number = $(".config-number-of-results", doc),
						util_number = $(".util-number-of-results", doc),
						orphaned_number = $(".orphaned-number-of-results", doc);
						me.render(commerce_root, commerce_number, me.results_commerce, "Commerce");
						me.render(cofig_root, config_number, me.results_config, "Config");
						me.render(util_root, util_number, me.results_util, "Utils");
						me.render(orphaned_root, orphaned_number, me.results_orphaned, "Orphaned");
						defer.resolve("");

					});
				},
				render : function (root, number, result, id) {
					var me = this;
					me.get_templates().then(function (html_and_css) {
						try {
							if (result.length > 0) {
								jQuery(root).closest("[class*='-all-section']").css("display", "block");
								jQuery(root).closest("[class*='-all-section']").next("br").css("visibility", "visible");
								jQuery(root).closest("[class*='-all-section']").next("br").css("display", "");
							}
							number.html("Number of Results [" + result.length + "]");
							root.html('<div class="master-functions"><div class="max-all">Maximize-All</div><div class="min-all">Minimize-All</div></div><br/>' + html_and_css.html({
									results : result,
									id : id
								}))
						} catch (e) {
							br_log.firebug(e)
						}
					});
				}
			});
		/*Copies default_searchable
		 * overwrites label, id, get_link, get_title, list_url, each, and search
		 * addsnothing
		 */
		header_footer_searchable = default_searchable.create_sub({
				label : "Header & Footer",
				id : "header_footer",
				list_url : function (term) {

					return host + "/admin/ui/branding/edit_header_footer.jsp";
				},
				get_title : function (page) {

					var title = $(page).attr("name");
					return title;
				},
				get_link : function (page) {

					return host + "/admin/ui/branding/edit_header_footer.jsp";
				},
				each : function (callback) {

					var form = $("form[name='bmForm']", this.page);
					form = $("textarea.form-input", form);
					_(form).forEach(function (val, idx, list) {
						callback(val, idx, list);
					});
				},
				search : function (term, defer) {

					var me = this,
					promise = me.get_list(term);
					me.results = [];
					promise.then(function (data) {
						try {
							me.each(function (textarea, idx, list) {
								if (me.get_lines(textarea, term, /\n/g).length > 0) {
									me.results.push({
										title : me.get_title(textarea),
										text : me.get_text(textarea),
										line_numbers : me.get_lines(textarea, term, /\n/g),
										link : me.get_link(textarea)
									});
								}
							});
						} catch (e) {
							br_log.firebug(e)
						}
						var root = $(".header-footer-section-results", doc);
						var number = $(".header-footer-number-of-results", doc);

						me.render(root, number);
						defer.resolve("");

					});
				}
			});
		/*Copies default_searchable
		 * overwrites label, id, get_link, get_title, list_url, detail_url, each, and search
		 * addsnothing
		 */
		global_functions_searchable = default_searchable.create_sub({
				label : "Global Functions",
				id : "global_functions",
				list_url : function (term) {

					return host + "/admin/scripts/list_scripts.jsp";
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("a.list-field", page).length > 0) {
						jQuery("a.list-field", page).each(function () {
							detail_links.push(host + "/admin/scripts/" + jQuery(this).attr("href"));
						});
					}

					return detail_links;
				},
				get_title : function (page) {
					var title = $("input[name='name']", page).val();
					return title;
				},
				get_link : function (page) {
					return page;
				},
				each : function (page, url, callback) {

					var form = jQuery("textarea.form-input[name='script_text']", page);
					_(form).forEach(function (val, idx, list) {
						callback(val, idx, list, page, url);
					});
				},
				search : function (term, defer) {
					var me = this,
					promise;
					me.results = [];
					promise = me.get_list(me.list_url());
					promise.then(function (data) {
						try {

							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {

									var detail_promise = me.get_file(item);
									detail_promise.then(function (data) {
										try {
											if (typeof data === "string") {
												//alert(data);
												return "";
											}
											me.each(data.page, data.url, function (textarea, idx, list, page, url) {
												if (me.get_lines(textarea, term, /\n/g).length > 0) {

													me.results.push({
														title : me.get_title(page),
														text : me.get_text(textarea),
														line_numbers : me.get_lines(textarea, term, /\n/g),
														link : me.get_link(url)
													});
												}
											});
										} catch (e) {
											br_log.firebug(e)
										}
										var root = $(".global-functions-section-results", doc);
										var number = $(".global-functions-number-of-results", doc);
										me.render(root, number);
										defer.resolve("");

									});
								})
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e)
						}
					});
				}
			});
		/*Copies default_searchable
		 * overwrites label, id, run_search, get_link, get_list, get_file, get_title, get_text, get_lines, list_url, detail_url, each, and search
		 * addstitle, sub_detail_url: get the third level information
		 */
		integrations_searchable = default_searchable.create_sub({
				label : "Integrations",
				id : "integrations",
				title : "Integration",
				run_search : function (term, id, name, arr, promise_arr) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					arr = arr || "";
					if (arr.indexOf(this.id) > -1) {
						this.search(term, id, name, defer_search, promise_arr);
						promise_arr.push(complete);
					} else {
						defer_search.resolve("");
						promise_arr.push(complete);
					}

				},
				list_url : function (id) {
					return host + "/admin/commerce/integration/list_integrations.jsp?process_id=" + id;
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("a[href*='edit_integration']", page).length > 0) {
						jQuery("a[href*='edit_integration']", page).each(function () {
							detail_links.push(host + "/admin/commerce/integration/" + jQuery(this).attr("href"));
						});
					}
					return detail_links;
				},
				sub_detail_url : function (page) {
					var queryId = jQuery("input[name='old_query_file_id']", page).attr("value"),
					queryURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + queryId;
					var parserId = jQuery("input[name='old_file_id']", page).attr("value"),
					parserURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + parserId;
					return {
						query : queryURL,
						parser : parserURL
					};
				},
				get_list : function (url) {
					var me = this;
					var d = Q.defer(),
					me = this;
					try {
						jQuery.ajax({
							url : url,
							success : function (data, st) {
								try {
									var div = doc.createElement("div");
									div.innerHTML = data;

									d.resolve(div);
								} catch (e) {
									br_log.firebug(e)
								}
							},
							error : function (x, e) {
								if (x.status == 0) {
									d.resolve("You are offline!!\n Please Check Your Network.");
								} else if (x.status == 404) {
									d.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
									return "";
								} else if (x.status == 500) {
									d.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
									return "";
								} else if (e == 'parsererror') {
									d.resolve("Error.\nParsing JSON Request failed.");
								} else if (e == 'timeout') {
									d.resolve("Request Time out.");
								} else {
									d.resolve('Unknow Error.\n' + x.responseText);
								}
							}
						});
					} catch (e) {
						br_log.firebug(e);
					}
					return d.promise;
				},
				get_file : function (url, title) {
					var me = this;
					var d = Q.defer(),
					me = this;
					jQuery.ajax({
						url : url,
						success : function (data) {
							try {
								d.resolve({
									data : data,
									title : title
								});
							} catch (e) {
								br_log.firebug(e)
							}
						},
						error : function (x, e) {
							if (x.status == 0) {
								d.resolve("You are offline!!\n Please Check Your Network.");
							} else if (x.status == 404) {
								d.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
								return "";
							} else if (x.status == 500) {
								d.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
								return "";
							} else if (e == 'parsererror') {
								d.resolve("Error.\nParsing JSON Request failed.");
							} else if (e == 'timeout') {
								d.resolve("Request Time out.");
							} else {
								d.resolve('Unknow Error.\n' + x.responseText);
							}
						}
					});
					return d.promise;
				},
				get_title : function (page) {
					var title = $("input[name='name']", page).val();
					return title;
				},
				get_text : function (page) {
					var text = page;
					return "<pre>" + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "<\pre>"; //.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>").replace(/\s\s/g, "&emsp;&emsp;").replace(/\s/g, "&nbsp;");
				},
				get_lines : function (page, term, delimiter) {
					try {
						var text = this.get_text(page),
						arr = text.split(delimiter),
						res = "";
						if (jQuery("[name*='search_word']", doc).attr("checked")) {
							var re = new RegExp("\\b" + term + "\\b", 'g');
							_(arr).each(function (item, indexThisFile, full) {
								if (item.toLowerCase().split(re).length === 1) {
									return;
								}
								res = res + (indexThisFile + 1) + ", ";
							});
						} else {
							_(arr).each(function (item, indexThisFile, full) {
								if (item.toLowerCase().indexOf(term.toLowerCase()) === -1) {
									return;
								}
								res = res + (indexThisFile + 1) + ", ";
							});
						}

						res = res.substring(0, res.length - 2)

							return res;
					} catch (e) {
						br_log.firebug(e)
					}
				},
				get_link : function (page) {

					return "";
				},
				each : function (files, callback) {
					_(files).each(function (page, idx, list) {
						var xml = page;
						if (typeof page === "object") {
							var serializer = new XMLSerializer(),
							xml = serializer.serializeToString(page);
						}
						callback(xml, idx, list);
					});
				},
				search : function (term, id, name, defer, promise_arr) {
					var me = this,
					promise;
					me.results = [];
					promise = me.get_list(me.list_url(id));
					promise.then(function (data) {
						try {
							if (typeof data === "string") {
								//alert(data);
								return "";
							}
							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {
									var detail_list_defer = Q.defer(),
									p1 = detail_list_defer.promise;
									promise_arr.push(p1);
									var detail_promise = me.get_list(item);
									var current_page = {
										url : item
									};
									detail_promise.then(function (detail_data) {
										try {
											if (typeof detail_data === "string") {
												//alert(detail_data);
												return "";
											}
											var title = me.get_title(detail_data);
											var sub_detail = me.sub_detail_url(detail_data);
											var query_promise = me.get_file(sub_detail.query, title);
											var parser_promise = me.get_file(sub_detail.parser, title);
											Q.join(query_promise, parser_promise,
												function (query_data, parser_data) {
												if (typeof query_data === "string") {
													//alert(query_data);
													return "";
												}
												if (typeof parser_data === "string") {
													//alert(parser_data);
													return "";
												}
												var files = [];
												files.push(query_data.data);
												files.push(parser_data.data);
												me.each(files, function (page, idx, list) {
													if (me.get_lines(page, term, /\n/g).length > 0) {
														var type = " : Parser";
														if (idx === 0) {
															type = " : Query";
														}
														me.results.push({
															title : name + " : " + query_data.title + type,
															text : me.get_text(page),
															line_numbers : me.get_lines(page, term, /\n/g),
															link : current_page.url
														});
													}
												});
												var root = $(".integration-section-results", doc);
												var number = $(".integration-number-of-results", doc);
												me.render(root, number);
												detail_list_defer.resolve("");
												defer.resolve("");

											});
										} catch (e) {
											br_log.firebug(e)
										}
									});
								})
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e);
						}
					});
				}
			});
		/*Copies integrations_searchable
		 * overwrites label, id, title, run_search, list_url, sub_detail_url, detail_url, and search
		 * addsnothing
		 */
		parts_integration_searchable = integrations_searchable.create_sub({
				label : "Parts Integrations",
				id : "parts_integrations",
				title : "Parts Integration",
				run_search : function (term, arr, defer) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					try {
						if (arr.indexOf(this.id) > -1) {
							this.search(term, defer_search);
							complete.then(function (string) {
								defer.resolve(that.id);
							});
						} else {
							defer.resolve("");
						}
					} catch (e) {
						defer.resolve(e);
					}
				},
				list_url : function () {
					return host + "/admin/parts/integration/list_integrations.jsp";
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("a[href*='edit_integration']", page).length > 0) {
						jQuery("a[href*='edit_integration']", page).each(function () {
							detail_links.push(host + "/admin/parts/integration/" + jQuery(this).attr("href"));
						});
					}
					return detail_links;
				},
				sub_detail_url : function (page) {
					var queryId = jQuery("input[name='old_query_file_id']", page).attr("value"),
					queryURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + queryId;
					var parserId = jQuery("input[name='old_result_file_id']", page).attr("value"),
					parserURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + parserId;

					return {
						query : queryURL,
						parser : parserURL
					};
				},
				search : function (term, defer) {
					var me = this,
					promise;
					me.results = [];
					promise = me.get_list(me.list_url());
					promise.then(function (data) {
						try {
							if (typeof data === "string") {
								//alert(data);
								defer.resolve("Error");
								return "";
							}
							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {

									var detail_promise = me.get_list(item);
									detail_promise.then(function (detail_data) {
										try {
											if (typeof detail_data === "string") {
												//alert(detail_data);
												return "";
											}
											var current_page = {
												url : item
											};
											var title = me.get_title(detail_data);
											var sub_detail = me.sub_detail_url(detail_data);

											var query_promise = me.get_file(sub_detail.query, title);
											var parser_promise = me.get_file(sub_detail.parser, title);
											Q.join(query_promise, parser_promise,
												function (query_data, parser_data) {
												if (typeof query_data === "string") {
													//alert(query_data);
													return "";
												}
												if (typeof parser_data === "string") {
													//alert(parser_data);
													return "";
												}

												var files = [];
												files.push(query_data.data);
												files.push(parser_data.data);

												me.each(files, function (page, idx, list) {
													if (me.get_lines(page, term, /\n/g).length > 0) {
														var type = " : Parser";
														if (idx === 0) {
															type = " : Query";
														}

														me.results.push({
															title : query_data.title + type,
															text : me.get_text(page),
															line_numbers : me.get_lines(page, term, /\n/g),
															link : current_page.url
														});
													}
												});
												var root = $(".parts-integration-section-results", doc);
												var number = $(".parts-integration-number-of-results", doc);
												me.render(root, number);
												defer.resolve("");

											});
										} catch (e) {
											br_log.firebug(e)
										}
									});
								})
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e)
						}
					});
				}
			});
		/*Copies integrations_searchable
		 * overwrites label, id, title, run_search, list_url, sub_detail_url, detail_url, and search
		 * addstype_array: The list of valid file manager files, get_pages: used to grab and return multiple details form a page
		 */
		file_manager_searchable = integrations_searchable.create_sub({
				label : "File Manager",
				id : "file_manager",
				title : "File Manager",
				types_array : ["*.txt", "*.js", "*.py", "*.csv", "*.yml", "*.pl", "*.html", "*.htm", "*.xml", "*.xslt", "*.xsl", "*.css", "*.php"],
				run_search : function (term, arr, defer) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					if (arr.indexOf(this.id) > -1) {
						this.search(term, defer_search);
						complete.then(function (string) {
							defer.resolve(that.id);
						});
					} else {
						defer.resolve("");
					}

				},
				list_url : function (search_string, curpos) {
					curpos = curpos || 0;
					return host + "/admin/filemanager/list_files.jsp?searchMode=true&alphaPage=&orderby=id&curpos=" + curpos + "&pattern=" + search_string;
				},
				get_pages : function (url, type) {
					var d = Q.defer(),
					me = this;
					var me = this;
					jQuery.ajax({
						url : url,
						success : function (data) {
							try {

								var div = doc.createElement("div");
								div.innerHTML = data;
								d.resolve({
									data : div,
									type : type
								});
							} catch (e) {
								br_log.firebug(e)
							}
						},
						error : function (x, e) {
							if (x.status == 0) {
								d.resolve("You are offline!!\n Please Check Your Network.");
							} else if (x.status == 404) {
								d.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
								return "";
							} else if (x.status == 500) {
								d.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
								return "";
							} else if (e == 'parsererror') {
								d.resolve("Error.\nParsing JSON Request failed.");
							} else if (e == 'timeout') {
								d.resolve("Request Time out.");
							} else {
								d.resolve('Unknow Error.\n' + x.responseText);
							}
						}
					});
					return d.promise;
				},
				detail_url : function (page, type) {
					var total_number_of_files = 0;
					var pageData = page;
					var total_number = jQuery("td.bottom-bar > table > tbody > tr > td.bottom-bar:contains(' of ')", pageData).html(); //.split(" of ")[1].split("nbsp;")[0];
					if (total_number !== null) {
						total_number_of_files = (total_number.split(" of ")[1].split("&nbsp;")[0]);
						var detail_links = [];
						var total_loops = parseInt(total_number_of_files / 10);
						for (ii = 0; ii <= total_loops; ii++) {
							var curpos = ii * 10;
							detail_links.push(host + "/admin/filemanager/list_files.jsp?searchMode=true&alphaPage=&orderby=id&curpos=" + curpos + "&pattern=" + type);
						}
						return detail_links;
					}
					return "";
				},
				sub_detail_url : function (page) {
					var sub_detail_links = [];
					jQuery("input[type='checkbox'][name='delete_id']", page).each(function () {
						var title = jQuery(this).closest("td").next().children("a").html();
						var folder = jQuery(this).closest("td").next().next().text();
						var file_id = jQuery(this).val();
						var url = get_hostname_prefix() + "/servlet/ImageServer?file_id=" + file_id;
						sub_detail_links.push({
							url : url,
							title : title,
							folder : folder
						});
					});
					return sub_detail_links;
				},
				search : function (term, defer) {
					var me = this,
					promise;
					me.results = [];
					var defer_arr = [];
					_(me.types_array).each(function (type, idx, list) {
						defer_arr.push(idx);
						promise = me.get_pages(me.list_url(type), type);
						promise.then(function (return_data) {
							try {
								if (typeof return_data === "string") {
									//alert(return_data);
									return "";
								}
								var detail_list = me.detail_url(return_data.data, return_data.type);
								if (detail_list.length > 0) {
									_(detail_list).each(function (item, indexThisFile, full) {
										defer_arr.push(indexThisFile);

										var detail_promise = me.get_list(item);
										detail_promise.then(function (detail_data) {
											try {
												if (typeof detail_data === "string") {
													//alert(detail_data);
													return "";
												}
												var title = {
													title : me.get_title(detail_data)
												};
												var sub_detail = me.sub_detail_url(detail_data);
												var title =
													_(sub_detail).each(function (item, indexThisFile, full) {
														defer_arr.push(indexThisFile);
														var sub_promise = me.get_file(item.url);
														sub_promise.then(function (file_data) {
															try {
																if (typeof file_data === "string") {
																	//alert(file_data);
																	return "";
																}

																me.each(file_data, function (page, idx, list) {
																	if (typeof page !== "undefined") {
																		if (me.get_lines(page, term, /\n/g).length > 0) {
																			me.results.push({
																				title : item.folder + " : " + item.title,
																				text : me.get_text(page),
																				line_numbers : me.get_lines(page, term, /\n/g),
																				link : item.url
																			});
																		}
																	}
																});
																var root = $(".file-manager-section-results", doc);
																var number = $(".file-manager-number-of-results", doc);
																me.render(root, number);
															} catch (e) {
																br_log.firebug(e);
															}
														});
													});
											} catch (e) {
												br_log.firebug(e)
											}
										});
									})
								} else {
									defer.resolve("");
									return "";
								}
							} catch (e) {
								br_log.firebug(e)
							}
						});

					});
					runInterval(defer_arr, defer);
				}
			});
		/*Copies integrations_searchable
		 * overwrites id, run_search, list_url, sub_detail_url, and search
		 * addsnothing
		 */
		account_integration_searchable = integrations_searchable.create_sub({
				id : "account_integration",
				run_search : function (term, arr, defer) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					if (arr.indexOf(this.id) > -1) {
						this.search(term, defer_search);
						complete.then(function (string) {
							defer.resolve(that.id);
						});
					} else {
						defer.resolve("");
					}

				},
				list_url : function () {
					return host + "/admin/accounts/list_integrations.jsp";
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("a[href*='edit_integration']", page).length) {
						jQuery("a[href*='edit_integration']", page).each(function () {
							detail_links.push(host + "/admin/accounts/" + jQuery(this).attr("href"));
						});
					}
					return detail_links;
				},
				sub_detail_url : function (page) {
					var queryId = jQuery("input[name='old_query_file_id']", page).attr("value"),
					queryURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + queryId;
					var parserId = jQuery("input[name='old_file_id']", page).attr("value"),
					parserURL = get_hostname_prefix() + 'servlet/ImageServer?file_id=' + parserId;
					return {
						query : queryURL,
						parser : parserURL
					};
				},
				search : function (term, defer) {
					var me = this,
					promise;
					me.results = [];
					promise = me.get_list(me.list_url());
					promise.then(function (data) {
						try {
							if (typeof data === "string") {
								//alert(data);
								return "";
							}
							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {
									var detail_promise = me.get_list(item);
									var current_page = {
										url : item
									};
									detail_promise.then(function (detail_data) {
										try {
											if (typeof detail_data === "string") {
												//alert(detail_data);
												return "";
											}
											var title = me.get_title(detail_data);
											var sub_detail = me.sub_detail_url(detail_data);
											var query_promise = me.get_file(sub_detail.query, title);
											var parser_promise = me.get_file(sub_detail.parser, title);
											Q.join(query_promise, parser_promise,
												function (query_data, parser_data) {
												if (typeof query_data === "string") {
													//alert(query_data);
													return "";
												}
												if (typeof parser_data === "string") {
													//alert(parser_data);
													return "";
												}
												var files = [];
												files.push(query_data.data);
												files.push(parser_data.data);
												me.each(files, function (page, idx, list) {
													if (me.get_lines(page, term, /\n/g).length > 0) {
														var type = " : Parser";
														if (idx === 0) {
															type = " : Query";
														}
														me.results.push({
															title : query_data.title + type,
															text : me.get_text(page),
															line_numbers : me.get_lines(page, term, /\n/g),
															link : current_page.url
														});
													}
												});
												var root = $(".account-integration-section-results", doc);
												var number = $(".account-integration-number-of-results", doc);
												me.render(root, number);
												defer.resolve("");

											});
										} catch (e) {
											br_log.firebug(e)
										}
									});
								})
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e);
						}
					});
				}
			});
		/*Copies integrations_searchable
		 * overwrites label, id, run_search, list_url, sub_detail_url, detail_url, get_title, get_link, each, and search
		 * addsnothing
		 */
		printer_friendly_searchable = integrations_searchable.create_sub({
				label : "Printer Friendly XSLs",
				id : "printer_friendly",
				run_search : function (term, id, name, arr, promise_arr) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					arr = arr || "";
					if (arr.indexOf(this.id) > -1) {
						this.search(term, id, name, defer_search, promise_arr);
						promise_arr.push(complete);
					} else {
						defer_search.resolve("");
						promise_arr.push(complete);
					}

				},
				list_url : function (id) {
					return host + "/admin/commerce/views/list_xslt.jsp?type_=0&process_id=" + id;
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("a[href*='edit_xslt']", page).length > 0) {
						jQuery("a[href*='edit_xslt']", page).each(function () {
							detail_links.push(host + "/admin/commerce/views/" + jQuery(this).attr("href"));
						});
					}
					return detail_links;
				},
				sub_detail_url : function (page) {
					var xsl_urls = [];
					var id = jQuery("[name='old_file_id']", page).val();
					if (jQuery("[name*='is_doc_ed_type'][checked]", page).val() === "0") {
						xsl_urls.push(host + 'servlet/ImageServer?file_id=' + id);
					}
					return xsl_urls;
				},
				get_title : function (page) {
					var title = $("input[name='xsl_name']", page).val();
					return title;
				},
				get_link : function (page) {

					return "";
				},
				each : function (page, callback) {
					var xml = page;
					if (typeof xml === "object") {
						var serializer = new XMLSerializer(),
						xml = serializer.serializeToString(page);
					}
					callback(xml);
				},
				search : function (term, id, name, defer, promise_arr) {
					var me = this,
					promise;
					me.results = [];
					promise = me.get_list(me.list_url(id));
					promise.then(function (data) {
						try {
							if (typeof data === "string") {
								//alert(data);
								return "";
							}
							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {
									var detail_list_defer = Q.defer(),
									p1 = detail_list_defer.promise;
									promise_arr.push(p1);
									var detail_promise = me.get_list(item);
									var current_page = {
										url : item
									};
									detail_promise.then(function (detail_data) {
										try {
											if (typeof detail_data === "string") {
												//alert(detail_data);
												return "";
											}
											var title = me.get_title(detail_data);
											var sub_detail = me.sub_detail_url(detail_data);
											if(sub_detail.length > 0){
												_(sub_detail).each(function (item, indexThisFile, full) {
													var list_defer = Q.defer(),
													p3 = list_defer.promise;
													promise_arr.push(p3);
													var file_promise = me.get_file(item, title);
													file_promise.then(function (sub_detail_data) {
														if (typeof sub_detail_data === "string") {
															//alert(sub_detail_data);
															return "";
														}
														me.each(sub_detail_data.data, function (page) {
															if (me.get_lines(page, term, /\n/g).length > 0) {
																me.results.push({
																	title : name + " : " + sub_detail_data.title,
																	text : me.get_text(page),
																	line_numbers : me.get_lines(page, term, /\n/g),
																	link : current_page.url
																});
															}
														});
														var root = $(".printer-friendly-section-results", doc);
														var number = $(".printer-friendly-number-of-results", doc);
														me.render(root, number);
														detail_list_defer.resolve("");
														list_defer.resolve("");
														defer.resolve("");
													});
												});
											}else{
												detail_list_defer.resolve("");
												defer.resolve("");
											}
										} catch (e) {
											br_log.firebug(e)
										}
									});
								})
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e);
						}
					});
				}
			});
		/*Copies integrations_searchable
		 * overwrites label, id, template_url, run_search, list_url, sub_detail_url, detail_url, file_detail, get_title, get_link, each, and search
		 * addsnothing
		 */
		doc_engine_searchable = integrations_searchable.create_sub({
				label : "Doc Engine XSLs",
				template_url : "chrome://sangfroid/content/templates/gss_section_integration.text",
				alt_template_url : "chrome://sangfroid/content/templates/gss_section_integration.text",
				id : "doc_engine",
				run_search : function (term, arr, defer) {
					var defer_search = Q.defer(),
					complete = defer_search.promise,
					that = this;
					if (arr.indexOf(this.id) > -1) {
						this.search(term, defer_search);
						complete.then(function (string) {
							defer.resolve(that.id);
						});
					} else {
						defer.resolve("");
					}

				},
				list_url : function () {
					return host + "/admin/doced/list_doc_editors.jsp";
				},
				detail_url : function (page) {
					var detail_links = [];
					if (jQuery("td.data-sources", page).length > 0) {
						jQuery("td.data-sources", page).each(function () {
							detail_links.push(host + "/admin/doced/list_doc_editors.jsp?pageDocEdId=" + jQuery(this).attr("id"));
						});
					}
					return detail_links;
				},
				sub_detail_url : function (page) {
					var xsl_urls = [];
					jQuery("a.xsl-icon", page).each(function () {
						var id = jQuery(this).attr("href").split("Xsl('")[1].split("')")[0];
						var var_name = jQuery(this).closest("td").prev().prev().html();
						var name = jQuery(this).closest("td").prev().prev().prev().children("a").html();
						xsl_urls.push({
							url : host + '/admin/doced/preview_xsl.jsp?view_type=docEd&docId=' + id,
							title : name + " : " + var_name
						});
					});
					return xsl_urls;
				},
				file_detail : function (page, title) {
					var xsl_urls = [];
					jQuery(page).find("[master-reference]").each(function () {
						var page = title + " : " + jQuery(this).attr("master-reference");
						var data = jQuery(this);
						try {
							var parent_node = jQuery(this).parent();
							var test = "";
							if (parent_node.get(0).nodeName.toLowerCase() === "xsl:if") {
								data = parent_node;
								test = " [condition=" + parent_node.attr("test") + "]";
							}
						} catch (e) {
							br_log.firebug(e);
						}
						xsl_urls.push({
							data : data,
							title : page + test
						});
					});
					return xsl_urls;
				},
				get_title : function (page) {
					var title = $("input[name='xsl_name']", page).val();
					return title;
				},
				get_link : function (page) {

					return "";
				},
				each : function (page, callback) {
					var xml = page;
					try {
						if (typeof xml === "object") {
							xml = $('<div/>', doc).append(xml).html();
						}
					} catch (e) {
						br_log.firebug(e);
					}
					callback(xml);
				},
				search : function (term, defer) {
					var me = this,
					promise;
					var defer_arr = [];
					me.results = [];
					promise = me.get_list(me.list_url());
					promise.then(function (data) {
						try {
							if (typeof data === "string") {
								//alert(data);
								//alert(1);
								return "";
							}
							var detail_list = me.detail_url(data);
							if (detail_list.length > 0) {
								_(detail_list).each(function (item, indexThisFile, full) {
									var detail_list_defer = Q.defer(),
									p1 = detail_list_defer.promise;
									defer_arr.push(p1);
									var detail_promise = me.get_list(item);
									var current_page = {
										url : item
									};
									detail_promise.then(function (detail_data) {
										try {
											if (typeof detail_data === "string") {
												//alert(detail_data);
												//alert(2);
												detail_list_defer.resolve("");
												return "";
											}
											var process = {
												process : jQuery("#dataSourceHolder", detail_data).html()
											};
											var sub_detail = me.sub_detail_url(detail_data);
											if (sub_detail.length > 0) {
												_(sub_detail).each(function (item, indexThisFile, full) {
													var defer2 = Q.defer(),
													p2 = defer.promise;
													defer_arr.push(p2);
													var file_promise = me.get_file(item.url, item.title);
													file_promise.then(function (sub_detail_data) {
														if (typeof sub_detail_data === "string") {
															//alert(sub_detail_data);
															//alert(3);
															defer2.resolve("");
															return "";
														}
														var file_details = me.file_detail(sub_detail_data.data, sub_detail_data.title);
														_(file_details).each(function (item, indexThisFile, full) {
															var defer3 = Q.defer(),
															p3 = defer.promise;
															defer_arr.push(p3);
															me.each(item.data, function (page) {
																if (me.get_lines(page, term, /\n/g).length > 0) {
																	var title = "",
																	var_name = "",
																	page_condition = "";
																	title = item.title.split(" : ")[0];
																	var_name = item.title.split(" : ")[1];
																	page_condition = item.title.split(" : ")[2];
																	me.results.push({
																		title : process.process + " : " + title,
																		var_name : var_name,
																		page_condition : page_condition,
																		link : current_page.url
																	});
																}
															});
															var root = $(".doc-engine-section-results", doc);
															var number = $(".doc-engine-number-of-results", doc);
															me.render(root, number);
															defer3.resolve("");
															defer2.resolve("");
															detail_list_defer.resolve("");
														});
													});
												});
											}else{
												detail_list_defer.resolve("");
												return "";
											}
										} catch (e) {
											br_log.firebug(e)
										}
									});
								});
							} else {
								defer.resolve("");
								return "";
							}
						} catch (e) {
							br_log.firebug(e);
						}
						runInterval(defer_arr, defer);
					});
				}
			});

		//This function is used for better toggling
		//It helps make the page hide when necessary or show when necessary
		this.set_display = function (element, show) {
			var is_hidden = false;
			if (jQuery(element).attr("style") === "display: none;" || jQuery(element).css("display") === "none") {
				is_hidden = true;
			}
			if (is_hidden && show) {
				jQuery(element).css("display", "none");
				jQuery(element).toggle("slow");
			}
			if (!is_hidden && !show) {
				jQuery(element).css("display", "show");
				jQuery(element).toggle("slow");
			}
		}
		//This function is used to attach clicks to each of the Max or Min buttons
		this.create_clicks = function () {
			jQuery(".br-maximize-button", doc).live("click", function () {
				that.set_display(jQuery(this).closest("div.br-title").closest("div.br-result").children(".br-result-details"), true);
				jQuery(this).closest("div.br-title").closest("div.br-result").children(".br-link").css("border-bottom", "none");
				jQuery(this).next().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".br-minimize-button", doc).live("click", function () {
				that.set_display(jQuery(this).closest("div.br-title").closest("div.br-result").children(".br-result-details"), false);
				jQuery(this).closest("div.br-title").closest("div.br-result").children(".br-link").css("border-bottom", "outset 3px #434343");
				jQuery(this).prev().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".maximize-section", doc).live("click", function () {
				that.set_display(jQuery(this).closest("[class*='all-section']").children("[class*='section-results']"), true);
				jQuery(this).next().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".minimize-section", doc).live("click", function () {
				that.set_display(jQuery(this).closest("[class*='all-section']").children("[class*='section-results']"), false);
				jQuery(this).prev().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".max-all", doc).live("click", function () {
				jQuery(this).closest("[class*='all-section']").children("[class*='section-results']").children(".br-gss-section").children(".br-results").children(".br-result").each(function () {
					that.set_display(jQuery(this).children(".br-result-details"), true);
					jQuery(this).children(".br-title").children(".br-minimize-button").css("display", "block");
					jQuery(this).children(".br-title").children(".br-maximize-button").css("display", "none");
				});
				jQuery(this).next().toggle(); //.css("display", "block");
				jQuery(this).toggle(); //.css("display", "none");
			});
			jQuery(".min-all", doc).live("click", function () {
				jQuery(this).closest("[class*='all-section']").children("[class*='section-results']").children(".br-gss-section").children(".br-results").children(".br-result").each(function () {
					that.set_display(jQuery(this).children(".br-result-details"), false);
					jQuery(this).children(".br-title").children(".br-minimize-button").css("display", "none");
					jQuery(this).children(".br-title").children(".br-maximize-button").css("display", "block");
				});
				jQuery(this).prev().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".min-all-complete", doc).live("click", function () {
				jQuery(this).closest(".gss-global").children("[class*='all-section']").each(function () {
					that.set_display(jQuery(this).children("[class*='section-results']"), false);
					jQuery(this).children(".maximize-section").css("display", "block");
					jQuery(this).children(".minimize-section").css("display", "none");
					jQuery(this).children("[class*='section-results']").children(".master-functions").children(".max-all").css("display", "block");
					jQuery(this).children("[class*='section-results']").children(".master-functions").children(".min-all").css("display", "none");
					jQuery(this).children("[class*='section-results']").children(".br-gss-section").children(".br-results").children(".br-result").each(function () {
						that.set_display(jQuery(this).children(".br-result-details"), false);
						jQuery(this).children(".br-title").children(".br-minimize-button").css("display", "none");
						jQuery(this).children(".br-title").children(".br-maximize-button").css("display", "block");
					});
				});
				jQuery(this).prev().css("display", "block");
				jQuery(this).css("display", "none");
			});
			jQuery(".max-all-complete", doc).live("click", function () {
				jQuery(this).closest(".gss-global").children("[class*='all-section']").each(function () {
					that.set_display(jQuery(this).children("[class*='section-results']"), true);
					jQuery(this).children(".maximize-section").css("display", "none");
					jQuery(this).children(".minimize-section").css("display", "block");
					jQuery(this).children("[class*='section-results']").children(".master-functions").children(".max-all").css("display", "none");
					jQuery(this).children("[class*='section-results']").children(".master-functions").children(".min-all").css("display", "block");
					jQuery(this).children("[class*='section-results']").children(".br-gss-section").children(".br-results").children(".br-result").each(function () {
						that.set_display(jQuery(this).children(".br-result-details"), true);
						jQuery(this).children(".br-title").children(".br-minimize-button").css("display", "block");
						jQuery(this).children(".br-title").children(".br-maximize-button").css("display", "none");
					});
				});
				jQuery(this).next().css("display", "block");
				jQuery(this).css("display", "none");
			});
		}
		//This function returns the process_ids for each process on the site
		this.get_processes = function (defer) {
			var me = this;
			jQuery.ajax({
				url : host + "/admin/commerce/processes/list_processes.jsp",
				success : function (data) {
					var div = doc.createElement("div");
					div.innerHTML = data;
					jQuery("[href*='edit_process.jsp']", div).each(function () {
						process_list.push({
							id : jQuery(this).attr("href").split("id=")[1],
							name : jQuery(this).html()
						});
					});
					defer.resolve(process_list);
				},
				error : function (x, e) {
					if (x.status == 0) {
						defer.resolve("You are offline!!\n Please Check Your Network.");
					} else if (x.status == 404) {
						defer.resolve("There has been an error.  Please log a bug with all of the details including the site and the items you were searching");
						return "";
					} else if (x.status == 500) {
						defer.resolve(me.label + ' does not exist on the site.  	Please remove that from the selected options');
						return "";
					} else if (e == 'parsererror') {
						defer.resolve("Error.\nParsing JSON Request failed.");
					} else if (e == 'timeout') {
						defer.resolve("Request Time out.");
					} else {
						defer.resolve('Unknow Error.\n' + x.responseText);
					}
				}
			});
		}
		//This function revert the page to its original state
		this.clear_search = function () {
			var default_html = '<div class="master-functions"><div class="max-all">Maximize-All</div><div class="min-all">Minimize-All</div></div><br/>';
			var list = [".commerce-section", ".printer-friendly", ".config-section", ".util-section", ".orphaned-section", ".header-footer", ".global-functions", ".integration", ".file-manager", ".parts-integration"];
			_(list).each(function (item, index, all) {
				$(item + "-section-results", doc).html(default_html);
			});
			gss_searchable.results_commerce = [];
			gss_searchable.results_config = [];
			gss_searchable.results_util = [];
			gss_searchable.results_orphaned = [];
			header_footer_searchable.results = [];
			global_functions_searchable.results = [];
			parts_integration_searchable.results = [];
			printer_friendly_searchable.results = [];
			account_integration_searchable.results = [];
			integrations_searchable.results = [];
			file_manager_searchable.results = [];
			doc_engine_searchable.results = [];
			var commerce_root = $(".commerce-section-results", doc),
			cofig_root = $(".config-section-results", doc),
			util_root = $(".util-section-results", doc),
			orphaned_root = $(".orphaned-section-results", doc);
			var commerce_number = $(".commerce-number-of-results", doc),
			config_number = $(".config-number-of-results", doc),
			util_number = $(".util-number-of-results", doc),
			orphaned_number = $(".orphaned-number-of-results", doc);
			gss_searchable.render(commerce_root, commerce_number, gss_searchable.results_commerce, "Commerce");
			gss_searchable.render(cofig_root, config_number, gss_searchable.results_config, "Config");
			gss_searchable.render(util_root, util_number, gss_searchable.results_util, "Utils");
			gss_searchable.render(orphaned_root, orphaned_number, gss_searchable.results_orphaned, "Orphaned");
			header_footer_searchable.render($(".header-footer-section-results", doc), $(".header-footer-number-of-results", doc));
			global_functions_searchable.render($(".global-functions-section-results", doc), $(".global-functions-number-of-results", doc));
			parts_integration_searchable.render($(".parts-integration-section-results", doc), $(".parts-integration-number-of-results", doc));
			integrations_searchable.render($(".integration-section-results", doc), $(".integration-number-of-results", doc));
			account_integration_searchable.render($(".account-integration-section-results", doc), $(".account-integration-number-of-results", doc));
			file_manager_searchable.render($(".file-manager-section-results", doc), $(".file-manager-number-of-results", doc));
			printer_friendly_searchable.render($(".printer-friendly-section-results", doc), $(".printer-friendly-number-of-results", doc));
			doc_engine_searchable.render($(".printer-friendly-section-results", doc), $(".printer-friendly-number-of-results", doc));
			jQuery("[class*='all-section']", doc).each(function () {
				jQuery(this).next("br").css("display", "none");
				jQuery(this).css("display", "none");
			});
			jQuery(".no_results", doc).css("display", "none")
			jQuery(".gss-global", doc).css("display", "none");

		}
		//this function is called when the page loads to add the page detail and clicks
		this.on_page_load = function () {
			var form = $("form[name='bmForm']", doc);
			var button = $("#search", doc).closest("table"),
			field = $("input[name='search_string']", doc),
			defer = Q.defer(),
			ready = defer.promise;
			var checkbox = $("[name*='ignore_case']", doc);
			that.create_clicks();
			that.clear_search();
			that.get_processes(defer);
			//add the css
			var css = br_load.css("chrome://sangfroid/content/templates/gss_css.text");
			form.hide();
			field.hide();
			button.hide();
			css.then(function (css) {
				br_log.firebug(css);
				$("head", doc).append(css);
				/*if(jQuery(css).html().indexOf("You must be logged in to access this page")>-1 || template.toString().indexOf("Sangfroid Login")>-1){
				var html = br_load.css("chrome://sangfroid/content/templates/gss_css.text");
				html.then(function(css) {
				$("head",doc).append(css);
				});
				}*/

			})
			//add the default search html
			var html = br_load.template("chrome://sangfroid/content/templates/gss_default.text");
			html.then(function (template) {
				var form = $("form[name='bmForm']", doc);
				jQuery(form).after(template());
			});
			//add the page html
			var html = br_load.template("chrome://sangfroid/content/templates/gss_form.text");
			html.then(function (template) {
				//br_log.firebug("timing?");
				//br_log.firebug(template(br_utils.colorParam()));
				var form = $("form[name='bmForm']", doc);
				jQuery(form).before(template(br_utils.colorParam()));
				$("#br-search", doc).click(function () {
					do_search(ready);
				});
			});
		};
		/* Use to tear down */
		this.on_page_unload = function () {
			$("#br-search", doc).unbind();
			$("#br-search-string", doc).unbind();
		};
		this.initiate_display = function () {};
	}
	/**
	 * Don't change below here -
	 * The following lines need to remain intact at the bottom of the function
	 */
	plugin.prototype = new BR_Content;

	return package;
}
	());
