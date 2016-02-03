br_utils.create_plugin(function () {
	var package = {
		name : 'commAttrSorter',
		
		/** Take Credit! **/
		author : 'Jared Toporek',
		
		/** Decide when the plugin runs. **/
		/**
		 * 1st step: url compare
		 *	Each regular expression in this array will be compared to the URL on page load.
		 * If any of these match, then we move on to the next filter.
		 */
		regex_urls : ['\/admin\/commerce\/rules\/edit_rule_inputs.jsp'],
		
		/**
		 * 2nd step: scrape the page
		 * Use this function to grab anything off the page that you want to use later.
		 */
		get_parameters : function (doc) {
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
			//var cond1 = true;
			var cond1 = (params['title'] || "").indexOf("/admin/commerce/rules/edit_rule_inputs.jsp") > -1;
			var cond2 = true;
			return cond2;
		},
		'content' : plugin,
	};
	
	function plugin(params) {
		/**
		 * content and elements on page
		 */
		var $,
		jQuery = $ = this.jQuery,
		doc = this.doc;
		
		this.get_script_type = function () {
			return "commAttrSorter";
		};
		//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
		/**
		 * File naming and directories -
		 *
		 * These functions are called whenever the plugin
		 * is making a decision about where to save a file
		 */
		this.get_filename = function () {};
		this.get_extension = function () {};
		this.get_local_directory = function () {};
		/**
		 * Entry points -
		 * These functions are called by the firefox plugin directly
		 */
		//this.plugin_created_successfully() { //put code here to avoid re-running plugin code after the first time }
		//this.on_page_load = function() { this.initiate_display(); };
		//this.faster = function();
		/**
		 * actions
		 */
		this.initiate_display = function () {};
		
		//build table header for table inside div id="_section1"
		
		//include tablesorter
		jQuery("td[colspan='5']", doc).hide();
		jQuery(".form-header", doc).css("display", "none !important");
		jQuery(".form-header", doc).parent().removeClass("bgcolor-form");
		(function (jQuery) {
			jQuery.extend({
				tablesorter : new
				function () {
					var parsers = [],
					widgets = [];
					this.defaults = {
						cssHeader : "header",
						cssAsc : "headerSortUp",
						cssDesc : "headerSortDown",
						cssChildRow : "expand-child",
						sortInitialOrder : "asc",
						sortMultiSortKey : "shiftKey",
						sortForce : null,
						sortAppend : null,
						sortLocaleCompare : true,
						textExtraction : "simple",
						parsers : {},
						widgets : [],
						widgetZebra : {
							css : ["even", "odd"]
						},
						headers : {},
						widthFixed : false,
						cancelSelection : true,
						sortList : [],
						headerList : [],
						dateFormat : "us",
						decimal : '/\.|\,/g',
						onRenderHeader : null,
						selectorHeaders : 'thead th',
						debug : false
					};
					/* debuging utils */
					function benchmark(s, d) {
						log(s + "," + (new Date().getTime() - d.getTime()) + "ms");
					}
					this.benchmark = benchmark;
					function log(s) {
						if (typeof console != "undefined" && typeof console.debug != "undefined") {
							console.log(s);
						} else {
							alert(s);
						}
					}
					/* parsers utils */
					function buildParserCache(table, jQueryheaders) {
						if (table.config.debug) {
							var parsersDebug = "";
						}
						if (table.tBodies.length == 0)
							return; // In the case of empty tables
						var rows = table.tBodies[0].rows;
						if (rows[0]) {
							var list = [],
							cells = rows[0].cells,
							l = cells.length;
							for (var i = 0; i < l; i++) {
								var p = false;
								if (jQuery.metadata && (jQuery(jQueryheaders[i]).metadata() && jQuery(jQueryheaders[i]).metadata().sorter)) {
									p = getParserById(jQuery(jQueryheaders[i]).metadata().sorter);
								} else if ((table.config.headers[i] && table.config.headers[i].sorter)) {
									p = getParserById(table.config.headers[i].sorter);
								}
								if (!p) {
									p = detectParserForColumn(table, rows, -1, i);
								}
								if (table.config.debug) {
									parsersDebug += "column:" + i + " parser:" + p.id + "\n";
								}
								list.push(p);
							}
						}
						if (table.config.debug) {
							log(parsersDebug);
						}
						return list;
					};
					function detectParserForColumn(table, rows, rowIndex, cellIndex) {
						var l = parsers.length,
						node = false,
						nodeValue = false,
						keepLooking = true;
						while (nodeValue == '' && keepLooking) {
							rowIndex++;
							if (rows[rowIndex]) {
								node = getNodeFromRowAndCellIndex(rows, rowIndex, cellIndex);
								nodeValue = trimAndGetNodeText(table.config, node);
								if (table.config.debug) {
									log('Checking if value was empty on row:' + rowIndex);
								}
							} else {
								keepLooking = false;
							}
						}
						for (var i = 1; i < l; i++) {
							if (parsers[i].is(nodeValue, table, node)) {
								return parsers[i];
							}
						}
						// 0 is always the generic parser (text)
						return parsers[0];
					}
					function getNodeFromRowAndCellIndex(rows, rowIndex, cellIndex) {
						return rows[rowIndex].cells[cellIndex];
					}
					function trimAndGetNodeText(config, node) {
						return jQuery.trim(getElementText(config, node));
					}
					function getParserById(name) {
						var l = parsers.length;
						for (var i = 0; i < l; i++) {
							if (parsers[i].id.toLowerCase() == name.toLowerCase()) {
								return parsers[i];
							}
						}
						return false;
					}
					/* utils */
					function buildCache(table) {
						if (table.config.debug) {
							var cacheTime = new Date();
						}
						var totalRows = (table.tBodies[0] && table.tBodies[0].rows.length) || 0,
						totalCells = (table.tBodies[0].rows[0] && table.tBodies[0].rows[0].cells.length) || 0,
						parsers = table.config.parsers,
						cache = {
							row : [],
							normalized : []
						};
						for (var i = 0; i < totalRows; ++i) {
							/** Add the table data to main data array */
							var c = jQuery(table.tBodies[0].rows[i]),
							cols = [];
							// if this is a child row, add it to the last row's children and
							// continue to the next row
							if (c.hasClass(table.config.cssChildRow)) {
								cache.row[cache.row.length - 1] = cache.row[cache.row.length - 1].add(c);
								// go to the next for loop
								continue;
							}
							cache.row.push(c);
							for (var j = 0; j < totalCells; ++j) {
								cols.push(parsers[j].format(getElementText(table.config, c[0].cells[j]), table, c[0].cells[j]));
							}
							cols.push(cache.normalized.length); // add position for rowCache
							cache.normalized.push(cols);
							cols = null;
						};
						if (table.config.debug) {
							benchmark("Building cache for " + totalRows + " rows:", cacheTime);
						}
						return cache;
					};
					function getElementText(config, node) {
						var text = "";
						if (!node)
							return "";
						if (!config.supportsTextContent)
							config.supportsTextContent = node.textContent || false;
						if (config.textExtraction == "simple") {
							if (config.supportsTextContent) {
								text = node.textContent;
							} else {
								if (node.childNodes[0] && node.childNodes[0].hasChildNodes()) {
									text = node.childNodes[0].innerHTML;
								} else {
									text = node.innerHTML;
								}
							}
						} else {
							if (typeof(config.textExtraction) == "function") {
								text = config.textExtraction(node);
							} else {
								text = jQuery(node).text();
							}
						}
						return text;
					}
					function appendToTable(table, cache) {
						if (table.config.debug) {
							var appendTime = new Date()
						}
						var c = cache,
						r = c.row,
						n = c.normalized,
						totalRows = n.length,
						checkCell = (n[0].length - 1),
						tableBody = jQuery(table.tBodies[0]),
						rows = [];
						for (var i = 0; i < totalRows; i++) {
							var pos = n[i][checkCell];
							rows.push(r[pos]);
							if (!table.config.appender) {
								//var o = ;
								var l = r[pos].length;
								for (var j = 0; j < l; j++) {
									tableBody[0].appendChild(r[pos][j]);
								}
								//
							}
						}
						if (table.config.appender) {
							table.config.appender(table, rows);
						}
						rows = null;
						if (table.config.debug) {
							benchmark("Rebuilt table:", appendTime);
						}
						// apply table widgets
						applyWidget(table);
						// trigger sortend
						setTimeout(function () {
							jQuery(table).trigger("sortEnd");
						}, 0);
					};
					function buildHeaders(table) {
						if (table.config.debug) {
							var time = new Date();
						}
						var meta = (jQuery.metadata) ? true : false;
						
						var header_index = computeTableHeaderCellIndexes(table);
						jQuerytableHeaders = jQuery(table.config.selectorHeaders, table).each(function (index) {
								this.column = header_index[this.parentNode.rowIndex + "-" + this.cellIndex];
								// this.column = index;
								this.order = formatSortingOrder(table.config.sortInitialOrder);
								
								this.count = this.order;
								if (checkHeaderMetadata(this) || checkHeaderOptions(table, index))
									this.sortDisabled = true;
								if (checkHeaderOptionsSortingLocked(table, index))
									this.order = this.lockedOrder = checkHeaderOptionsSortingLocked(table, index);
								if (!this.sortDisabled) {
									var jQueryth = jQuery(this).addClass(table.config.cssHeader);
									if (table.config.onRenderHeader)
										table.config.onRenderHeader.apply(jQueryth);
								}
								// add cell to headerList
								table.config.headerList[index] = this;
							});
						if (table.config.debug) {
							benchmark("Built headers:", time);
							log(jQuerytableHeaders);
						}
						return jQuerytableHeaders;
					};
					// from:
					// http://www.javascripttoolbox.com/lib/table/examples.php
					// http://www.javascripttoolbox.com/temp/table_cellindex.html
					function computeTableHeaderCellIndexes(t) {
						var matrix = [];
						var lookup = {};
						var thead = t.getElementsByTagName('THEAD')[0];
						var trs = thead.getElementsByTagName('TR');
						for (var i = 0; i < trs.length; i++) {
							var cells = trs[i].cells;
							for (var j = 0; j < cells.length; j++) {
								var c = cells[j];
								var rowIndex = c.parentNode.rowIndex;
								var cellId = rowIndex + "-" + c.cellIndex;
								var rowSpan = c.rowSpan || 1;
								var colSpan = c.colSpan || 1
									var firstAvailCol;
								if (typeof(matrix[rowIndex]) == "undefined") {
									matrix[rowIndex] = [];
								}
								// Find first available column in the first row
								for (var k = 0; k < matrix[rowIndex].length + 1; k++) {
									if (typeof(matrix[rowIndex][k]) == "undefined") {
										firstAvailCol = k;
										break;
									}
								}
								lookup[cellId] = firstAvailCol;
								for (var k = rowIndex; k < rowIndex + rowSpan; k++) {
									if (typeof(matrix[k]) == "undefined") {
										matrix[k] = [];
									}
									var matrixrow = matrix[k];
									for (var l = firstAvailCol; l < firstAvailCol + colSpan; l++) {
										matrixrow[l] = "x";
									}
								}
							}
						}
						return lookup;
					}
					function checkCellColSpan(table, rows, row) {
						var arr = [],
						r = table.tHead.rows,
						c = r[row].cells;
						for (var i = 0; i < c.length; i++) {
							var cell = c[i];
							if (cell.colSpan > 1) {
								arr = arr.concat(checkCellColSpan(table, headerArr, row++));
							} else {
								if (table.tHead.length == 1 || (cell.rowSpan > 1 || !r[row + 1])) {
									arr.push(cell);
								}
								// headerArr[row] = (i+row);
							}
						}
						return arr;
					};
					function checkHeaderMetadata(cell) {
						if ((jQuery.metadata) && (jQuery(cell).metadata().sorter === false)) {
							return true;
						};
						return false;
					}
					function checkHeaderOptions(table, i) {
						if ((table.config.headers[i]) && (table.config.headers[i].sorter === false)) {
							return true;
						};
						return false;
					}
					
					function checkHeaderOptionsSortingLocked(table, i) {
						if ((table.config.headers[i]) && (table.config.headers[i].lockedOrder))
							return table.config.headers[i].lockedOrder;
						return false;
					}
					
					function applyWidget(table) {
						var c = table.config.widgets;
						var l = c.length;
						for (var i = 0; i < l; i++) {
							getWidgetById(c[i]).format(table);
						}
					}
					function getWidgetById(name) {
						var l = widgets.length;
						for (var i = 0; i < l; i++) {
							if (widgets[i].id.toLowerCase() == name.toLowerCase()) {
								return widgets[i];
							}
						}
					};
					function formatSortingOrder(v) {
						if (typeof(v) != "Number") {
							return (v.toLowerCase() == "desc") ? 1 : 0;
						} else {
							return (v == 1) ? 1 : 0;
						}
					}
					function isValueInArray(v, a) {
						var l = a.length;
						for (var i = 0; i < l; i++) {
							if (a[i][0] == v) {
								return true;
							}
						}
						return false;
					}
					function setHeadersCss(table, jQueryheaders, list, css) {
						// remove all header information
						jQueryheaders.removeClass(css[0]).removeClass(css[1]);
						var h = [];
						jQueryheaders.each(function (offset) {
							if (!this.sortDisabled) {
								h[this.column] = jQuery(this);
							}
						});
						var l = list.length;
						for (var i = 0; i < l; i++) {
							h[list[i][0]].addClass(css[list[i][1]]);
						}
					}
					function fixColumnWidth(table, jQueryheaders) {
						var c = table.config;
						if (c.widthFixed) {
							var colgroup = jQuery('<colgroup>');
							jQuery("tr:first td", table.tBodies[0]).each(function () {
								colgroup.append(jQuery('<col>').css('width', jQuery(this).width()));
							});
							jQuery(table).prepend(colgroup);
						};
					}
					function updateHeaderSortCount(table, sortList) {
						var c = table.config,
						l = sortList.length;
						for (var i = 0; i < l; i++) {
							var s = sortList[i],
							o = c.headerList[s[0]];
							o.count = s[1];
							o.count++;
						}
					}
					/* sorting methods */
					function multisort(table, sortList, cache) {
						if (table.config.debug) {
							var sortTime = new Date();
						}
						var dynamicExp = "var sortWrapper = function(a,b) {",
						l = sortList.length;
						// TODO: inline functions.
						for (var i = 0; i < l; i++) {
							var c = sortList[i][0];
							var order = sortList[i][1];
							// var s = (getCachedSortType(table.config.parsers,c) == "text") ?
							// ((order == 0) ? "sortText" : "sortTextDesc") : ((order == 0) ?
							// "sortNumeric" : "sortNumericDesc");
							// var s = (table.config.parsers[c].type == "text") ? ((order == 0)
							// ? makeSortText(c) : makeSortTextDesc(c)) : ((order == 0) ?
							// makeSortNumeric(c) : makeSortNumericDesc(c));
							var s = (table.config.parsers[c].type == "text") ? ((order == 0) ? makeSortFunction("text", "asc", c) : makeSortFunction("text", "desc", c)) : ((order == 0) ? makeSortFunction("numeric", "asc", c) : makeSortFunction("numeric", "desc", c));
							var e = "e" + i;
							dynamicExp += "var " + e + " = " + s; // + "(a[" + c + "],b[" + c
							// + "]); ";
							dynamicExp += "if(" + e + ") { return " + e + "; } ";
							dynamicExp += "else { ";
						}
						// if value is the same keep orignal order
						var orgOrderCol = cache.normalized[0].length - 1;
						dynamicExp += "return a[" + orgOrderCol + "]-b[" + orgOrderCol + "];";
						for (var i = 0; i < l; i++) {
							dynamicExp += "}; ";
						}
						dynamicExp += "return 0; ";
						dynamicExp += "}; ";
						if (table.config.debug) {
							benchmark("Evaling expression:" + dynamicExp, new Date());
						}
						eval(dynamicExp);
						cache.normalized.sort(sortWrapper);
						if (table.config.debug) {
							benchmark("Sorting on " + sortList.toString() + " and dir " + order + " time:", sortTime);
						}
						return cache;
					};
					function makeSortFunction(type, direction, index) {
						var a = "a[" + index + "]",
						b = "b[" + index + "]";
						if (type == 'text' && direction == 'asc') {
							return "(" + a + " == " + b + " ? 0 : (" + a + " === null ? Number.POSITIVE_INFINITY : (" + b + " === null ? Number.NEGATIVE_INFINITY : (" + a + " < " + b + ") ? -1 : 1 )));";
						} else if (type == 'text' && direction == 'desc') {
							return "(" + a + " == " + b + " ? 0 : (" + a + " === null ? Number.POSITIVE_INFINITY : (" + b + " === null ? Number.NEGATIVE_INFINITY : (" + b + " < " + a + ") ? -1 : 1 )));";
						} else if (type == 'numeric' && direction == 'asc') {
							return "(" + a + " === null && " + b + " === null) ? 0 :(" + a + " === null ? Number.POSITIVE_INFINITY : (" + b + " === null ? Number.NEGATIVE_INFINITY : " + a + " - " + b + "));";
						} else if (type == 'numeric' && direction == 'desc') {
							return "(" + a + " === null && " + b + " === null) ? 0 :(" + a + " === null ? Number.POSITIVE_INFINITY : (" + b + " === null ? Number.NEGATIVE_INFINITY : " + b + " - " + a + "));";
						}
					};
					function makeSortText(i) {
						return "((a[" + i + "] < b[" + i + "]) ? -1 : ((a[" + i + "] > b[" + i + "]) ? 1 : 0));";
					};
					function makeSortTextDesc(i) {
						return "((b[" + i + "] < a[" + i + "]) ? -1 : ((b[" + i + "] > a[" + i + "]) ? 1 : 0));";
					};
					function makeSortNumeric(i) {
						return "a[" + i + "]-b[" + i + "];";
					};
					function makeSortNumericDesc(i) {
						return "b[" + i + "]-a[" + i + "];";
					};
					function sortText(a, b) {
						if (table.config.sortLocaleCompare)
							return a.localeCompare(b);
						return ((a < b) ? -1 : ((a > b) ? 1 : 0));
					};
					function sortTextDesc(a, b) {
						if (table.config.sortLocaleCompare)
							return b.localeCompare(a);
						return ((b < a) ? -1 : ((b > a) ? 1 : 0));
					};
					function sortNumeric(a, b) {
						return a - b;
					};
					function sortNumericDesc(a, b) {
						return b - a;
					};
					function getCachedSortType(parsers, i) {
						return parsers[i].type;
					};
					/* public methods */
					this.construct = function (settings) {
						return this.each(function () {
							// if no thead or tbody quit.
							if (!this.tHead || !this.tBodies)
								return;
							// declare
							var jQuerythis,
							jQuerydocument,
							jQueryheaders,
							cache,
							config,
							shiftDown = 0,
							sortOrder;
							// new blank config object
							this.config = {};
							// merge and extend.
							config = jQuery.extend(this.config, jQuery.tablesorter.defaults, settings);
							// store common expression for speed
							jQuerythis = jQuery(this);
							// save the settings where they read
							jQuery.data(this, "tablesorter", config);
							// build headers
							jQueryheaders = buildHeaders(this);
							// try to auto detect column type, and store in tables config
							this.config.parsers = buildParserCache(this, jQueryheaders);
							// build the cache for the tbody cells
							cache = buildCache(this);
							// get the css class names, could be done else where.
							var sortCSS = [config.cssDesc, config.cssAsc];
							// fixate columns if the users supplies the fixedWidth option
							fixColumnWidth(this);
							// apply event handling to headers
							// this is to big, perhaps break it out?
							jQueryheaders.click(
								function (e) {
								var totalRows = (jQuerythis[0].tBodies[0] && jQuerythis[0].tBodies[0].rows.length) || 0;
								if (!this.sortDisabled && totalRows > 0) {
									// Only call sortStart if sorting is
									// enabled.
									jQuerythis.trigger("sortStart");
									if(jQuery(this).find("img").length === 0){
										jQuery(this).append("<img src='/img/grid/sort_asc.gif'>");
									}else if(jQuery(this).find("img[src*='desc']").length > 0){
										jQuery(this).find("img").replaceWith("<img src='/img/grid/sort_asc.gif'>");
									}else if(jQuery(this).find("img[src*='asc']").length > 0){
										jQuery(this).find("img").replaceWith("<img src='/img/grid/sort_desc.gif'>");
									}
									jQuery(this).prevAll().each(function(){
										jQuery(this).find("img").remove();
									});
									jQuery(this).nextAll().each(function(){
										jQuery(this).find("img").remove();
									});
									// store exp, for speed
									var jQuerycell = jQuery(this);
									// get current column index
									var i = this.column;
									// get current column sort order
									this.order = this.count++ % 2;
									// always sort on the locked order.
									if (this.lockedOrder)
										this.order = this.lockedOrder;
									
									// user only whants to sort on one
									// column
									if (!e[config.sortMultiSortKey]) {
										// flush the sort list
										config.sortList = [];
										if (config.sortForce != null) {
											var a = config.sortForce;
											for (var j = 0; j < a.length; j++) {
												if (a[j][0] != i) {
													config.sortList.push(a[j]);
												}
											}
										}
										// add column to sort list
										config.sortList.push([i, this.order]);
										// multi column sorting
									} else {
										// the user has clicked on an all
										// ready sortet column.
										if (isValueInArray(i, config.sortList)) {
											// revers the sorting direction
											// for all tables.
											for (var j = 0; j < config.sortList.length; j++) {
												var s = config.sortList[j],
												o = config.headerList[s[0]];
												if (s[0] == i) {
													o.count = s[1];
													o.count++;
													s[1] = o.count % 2;
												}
											}
										} else {
											// add column to sort list array
											config.sortList.push([i, this.order]);
										}
									};
									setTimeout(function () {
										// set css for headers
										setHeadersCss(jQuerythis[0], jQueryheaders, config.sortList, sortCSS);
										appendToTable(
											jQuerythis[0], multisort(
												jQuerythis[0], config.sortList, cache));
									}, 1);
									// stop normal event by returning false
									return false;
								}
								// cancel selection
							}).mousedown(function () {
								if (config.cancelSelection) {
									this.onselectstart = function () {
										return false
									};
									return false;
								}
							});
							// apply easy methods that trigger binded events
							jQuerythis.bind("update", function () {
								var me = this;
								setTimeout(function () {
									// rebuild parsers.
									me.config.parsers = buildParserCache(
											me, jQueryheaders);
									// rebuild the cache map
									cache = buildCache(me);
								}, 1);
							}).bind("updateCell", function (e, cell) {
								var config = this.config;
								// get position from the dom.
								var pos = [(cell.parentNode.rowIndex - 1), cell.cellIndex];
								// update cache
								cache.normalized[pos[0]][pos[1]] = config.parsers[pos[1]].format(
										getElementText(config, cell), cell);
							}).bind("sorton", function (e, list) {
								jQuery(this).trigger("sortStart");
								config.sortList = list;
								// update and store the sortlist
								var sortList = config.sortList;
								// update header count index
								updateHeaderSortCount(this, sortList);
								// set css for headers
								setHeadersCss(this, jQueryheaders, sortList, sortCSS);
								// sort the table and append it to the dom
								appendToTable(this, multisort(this, sortList, cache));
							}).bind("appendCache", function () {
								appendToTable(this, cache);
							}).bind("applyWidgetId", function (e, id) {
								getWidgetById(id).format(this);
							}).bind("applyWidgets", function () {
								// apply widgets
								applyWidget(this);
							});
							if (jQuery.metadata && (jQuery(this).metadata() && jQuery(this).metadata().sortlist)) {
								config.sortList = jQuery(this).metadata().sortlist;
							}
							// if user has supplied a sort list to constructor.
							if (config.sortList.length > 0) {
								jQuerythis.trigger("sorton", [config.sortList]);
							}
							// apply widgets
							applyWidget(this);
						});
					};
					this.addParser = function (parser) {
						var l = parsers.length,
						a = true;
						for (var i = 0; i < l; i++) {
							if (parsers[i].id.toLowerCase() == parser.id.toLowerCase()) {
								a = false;
							}
						}
						if (a) {
							parsers.push(parser);
						};
					};
					this.addWidget = function (widget) {
						widgets.push(widget);
					};
					this.formatFloat = function (s) {
						var i = parseFloat(s);
						return (isNaN(i)) ? 0 : i;
					};
					this.formatInt = function (s) {
						var i = parseInt(s);
						return (isNaN(i)) ? 0 : i;
					};
					this.isDigit = function (s, config) {
						// replace all an wanted chars and match.
						return /^[-+]?\d*jQuery/.test(jQuery.trim(s.replace(/[,.']/g, '')));
					};
					this.clearTableBody = function (table) {
						if (jQuery.browser.msie) {
							function empty() {
								while (this.firstChild)
									this.removeChild(this.firstChild);
							}
							empty.apply(table.tBodies[0]);
						} else {
							table.tBodies[0].innerHTML = "";
						}
					};
				}
			});
			// extend plugin scope
			jQuery.fn.extend({
				tablesorter : jQuery.tablesorter.construct
			});
			// make shortcut
			var ts = jQuery.tablesorter;
			// add default parsers
			ts.addParser({
				id : "text",
				is : function (s) {
					return true;
				},
				format : function (s) {
					return jQuery.trim(s.toLocaleLowerCase());
				},
				type : "text"
			});
			ts.addParser({
				id : "digit",
				is : function (s, table) {
					var c = table.config;
					return jQuery.tablesorter.isDigit(s, c);
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat(s);
				},
				type : "numeric"
			});
			ts.addParser({
				id : "currency",
				is : function (s) {
					return /^[£jQuery€?.]/.test(s);
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat(s.replace(new RegExp(/[£jQuery€]/g), ""));
				},
				type : "numeric"
			});
			ts.addParser({
				id : "ipAddress",
				is : function (s) {
					return /^\d{2,3}[\.]\d{2,3}[\.]\d{2,3}[\.]\d{2,3}jQuery/.test(s);
				},
				format : function (s) {
					var a = s.split("."),
					r = "",
					l = a.length;
					for (var i = 0; i < l; i++) {
						var item = a[i];
						if (item.length == 2) {
							r += "0" + item;
						} else {
							r += item;
						}
					}
					return jQuery.tablesorter.formatFloat(r);
				},
				type : "numeric"
			});
			ts.addParser({
				id : "url",
				is : function (s) {
					return /^(https?|ftp|file):\/\/jQuery/.test(s);
				},
				format : function (s) {
					return jQuery.trim(s.replace(new RegExp(/(https?|ftp|file):\/\//), ''));
				},
				type : "text"
			});
			ts.addParser({
				id : "isoDate",
				is : function (s) {
					return /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}jQuery/.test(s);
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat((s != "") ? new Date(s.replace(
								new RegExp(/-/g), "/")).getTime() : "0");
				},
				type : "numeric"
			});
			ts.addParser({
				id : "percent",
				is : function (s) {
					return /\%jQuery/.test(jQuery.trim(s));
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat(s.replace(new RegExp(/%/g), ""));
				},
				type : "numeric"
			});
			ts.addParser({
				id : "usLongDate",
				is : function (s) {
					return s.match(new RegExp(/^[A-Za-z]{3,10}\.? [0-9]{1,2}, ([0-9]{4}|'?[0-9]{2}) (([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(AM|PM)))jQuery/));
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat(new Date(s).getTime());
				},
				type : "numeric"
			});
			ts.addParser({
				id : "shortDate",
				is : function (s) {
					return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(s);
				},
				format : function (s, table) {
					var c = table.config;
					s = s.replace(/\-/g, "/");
					if (c.dateFormat == "us") {
						// reformat the string in ISO format
						s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "jQuery3/jQuery1/jQuery2");
					} else if (c.dateFormat == "uk") {
						// reformat the string in ISO format
						s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "jQuery3/jQuery2/jQuery1");
					} else if (c.dateFormat == "dd/mm/yy" || c.dateFormat == "dd-mm-yy") {
						s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/, "jQuery1/jQuery2/jQuery3");
					}
					return jQuery.tablesorter.formatFloat(new Date(s).getTime());
				},
				type : "numeric"
			});
			ts.addParser({
				id : "time",
				is : function (s) {
					return /^(([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(am|pm)))jQuery/.test(s);
				},
				format : function (s) {
					return jQuery.tablesorter.formatFloat(new Date("2000/01/01 " + s).getTime());
				},
				type : "numeric"
			});
			ts.addParser({
				id : "metadata",
				is : function (s) {
					return false;
				},
				format : function (s, table, cell) {
					var c = table.config,
					p = (!c.parserMetadataName) ? 'sortValue' : c.parserMetadataName;
					return jQuery(cell).metadata()[p];
				},
				type : "numeric"
			});
			// add default widgets
			ts.addWidget({
				id : "zebra",
				format : function (table) {
					if (table.config.debug) {
						var time = new Date();
					}
					var jQuerytr,
					row = -1,
					odd;
					// loop through the visible rows
					jQuery("tr:visible", table.tBodies[0]).each(function (i) {
						jQuerytr = jQuery(this);
						// style children rows the same way the parent
						// row was styled
						if (!jQuerytr.hasClass(table.config.cssChildRow))
							row++;
						odd = (row % 2 == 0);
						jQuerytr.removeClass(
							table.config.widgetZebra.css[odd ? 0 : 1]).addClass(
							table.config.widgetZebra.css[odd ? 1 : 0])
					});
					if (table.config.debug) {
						jQuery.tablesorter.benchmark("Applying Zebra widget", time);
					}
				}
			});
		})(jQuery);
		
		try {
			/*
			get the table in this tag with this id, then get the table inside it
			proceed to grab the first row and the values inside them, and use those values to build a new thead tag for the table
			the thead tag is critical to implementing the tablesorter
			once you get those values build a thead tag and prepend this to the table
			then execute the tablesorter jquery command
			 */
			
			function applyTablesorter(domID, isTable) {
				var quoteAttrTable = "";
				if(isTable){
					quoteAttrTable = [];
					quoteAttrTable.push(domID);
					br_log.firebug(quoteAttrTable);
				}else{
					var thisDomID = "#" + domID;
					var divForQuoteAttr = jQuery(thisDomID, doc);
					quoteAttrTable = jQuery(divForQuoteAttr).find("table");
				}
				var headerArr = [];
				var quoteAttrRowArr = [];
				
				var thStr = "<thead><tr style='background-color:#CCC; padding:5px; font-size: 8pt !important; cursor: pointer;'>\n";
				if (quoteAttrTable.length > 0) {
					jQuery(quoteAttrTable[0]).attr("id", "quoteAttrTable");
					var quoteAttrRowArr = jQuery(quoteAttrTable[0]).find("tr");
					if (quoteAttrRowArr.length > 0) {
						jQuery(quoteAttrRowArr[0]).hide();
						var quoteAttrDataArr = jQuery(quoteAttrRowArr[0]).find("td");
						if (quoteAttrDataArr.length > 0) {
							for (var j = 0; j < quoteAttrDataArr.length; j++) {
								//headerArr.push(quoteAttrDataArr[j].innerHTML);
								thStr += "<th>" + quoteAttrDataArr[j].innerHTML + "</th>\n";
							}
						}
					}
				}
				//build thead row, as well as append <tbody> tags to existing table
				thStr += "</tr></thead>\n";
				jQuery(quoteAttrTable[0]).prepend(thStr);
				jQuery(quoteAttrTable[0]).tablesorter();
			}
			
			var domIdArr = ["_section0", "_section1", "_section2", "modify4653823", "tab_section_import", "_section_import"];
			for (var x = 0, limit = domIdArr.length; x < limit; x++) {
				var id = domIdArr[x];
				if(domIdArr[x] === "_section_import"){
					var thisDomID = "#" + id;
					var divForQuoteAttr = jQuery(thisDomID, doc);
					var quoteAttrTable = jQuery(divForQuoteAttr).find("table")[1];
					br_log.firebug(quoteAttrTable);
					applyTablesorter(quoteAttrTable, true);
					quoteAttrTable = jQuery(divForQuoteAttr).find("table")[3];
					br_log.firebug(quoteAttrTable);
					applyTablesorter(quoteAttrTable, true);
				}else{
					applyTablesorter(id);
				}
			}
			
		} catch (err) {
			alert("error:" + err);
		}
	}
	plugin.prototype = new BR_Content();
	
	return package;
}
	());
