var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

// A small (?) library of convenience functions to perform 
// miscellaneous tasks.
// BR_Utils kept here for legacy all old plugins will still refer to this
var br_utils = BR_Utils = {};

// This function will add the Sangfroid button to the toolbar menu
br_utils.set_nav_bar_button = function() {
  var myId    = "sangfroid_nav_button"; // ID of button to add
  var afterId = "search-container";    // ID of element to insert after
  var navBar  = document.getElementById("nav-bar");
  var curSet  = navBar.currentSet.split(",");

  if (curSet.indexOf(myId) == -1) {
    var pos = curSet.indexOf(afterId) + 1 || curSet.length;
    var set = curSet.slice(0, pos).concat(myId).concat(curSet.slice(pos));

    navBar.setAttribute("currentset", set.join(","));
    navBar.currentSet = set.join(",");
    document.persist(navBar.id, "currentset");
    try {
      BrowserToolboxCustomizeDone(true);
    }
    catch (e) {}
  }
};

// Function called to change Sangfroid's active status.
br_utils.toggle_active = function() {
  var pm = Components.classes["@mozilla.org/preferences-service;1"]
                                       .getService(Components.interfaces.nsIPrefService)
                                       .getBranch("extensions.sangfroid.");
  var curr = pm.getBoolPref("active");
  pm.setBoolPref("active", !curr);
  var logo_active = "chrome://sangfroid/content/img/logo.png";
  var logo_inactive = "chrome://sangfroid/content/img/logo-off.png";

  if(br_utils.is_alt()) {
    logo_active = "chrome://sangfroid/content/img/034.png";
    logo_inactive = "chrome://sangfroid/content/img/034u.png";
  }
  //AH - enumerate all the windows
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
	var enumerator = wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
	  var win = enumerator.getNext();
	  // win is [Object ChromeWindow] (just like window), do something with it
	  if(br_global.sangfroid_active === true) {
		//br_$(".comp_logo_box").attr("src", "chrome://sangfroid/content/img/logo.png");
		//br_$("#sangfroid_nav_button").css({'list-style-image':'url('+logo_active+')'});
		jQuery(".comp_logo_box",win.document).attr("src", "chrome://sangfroid/content/img/logo.png");
		jQuery("#sangfroid_nav_button",win.document).css({'list-style-image':'url('+logo_active+')'});
	  } else {
		//br_$(".comp_logo_box").attr("src", "chrome://sangfroid/content/img/logo-off.png");
		//br_$("#sangfroid_nav_button").css({'list-style-image':'url('+logo_inactive+')'});
		jQuery(".comp_logo_box",win.document).attr("src", "chrome://sangfroid/content/img/logo-off.png");
		jQuery("#sangfroid_nav_button",win.document).css({'list-style-image':'url('+logo_inactive+')'});
	  }
	}
}

// Returns true all day on April 1st of any year.
br_utils.is_alt = function() {
  var d = new Date();
  var m  = d.getMonth();
  var n = d.getDate();

  return m === 3 && n === 1;
}

// Taken from FireGestures
// https://github.com/gomita/firegestures/raw/master/components/xdGestureMapping.js
// Used to open the Preferences menu
br_utils.configure = function () {
  var winMed = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  var url = "chrome://sangfroid/content/sangfroid_options.xul";
  var features = "chrome,titlebar,toolbar,centerscreen,resizable,dialog=no,modal";
  win = winMed.getMostRecentWindow(null);

  win.openDialog(url, "Sangfroid Preferences", features);
};

br_utils.bug_report = function () {
  var winMed = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  var url = "chrome://sangfroid/content/sangfroid_bug.xul";
  var features = "chrome,titlebar,centerscreen,resizable,dialog";
  win = winMed.getMostRecentWindow(null);

  win.openDialog(url, "Sangfroid Bugs & Enhancements", features);
};

/**
 * Removes element from array. John Resig code
 * 
 * @param {Array} array The array to be modified
 * @param {Int} from Starting index to remove
 * @param {Int} to Ending index to remove
 * @return {Array} Sliced array
 * 
 * @see http://ejohn.org/blog/javascript-array-remove/
 */
//Array Remove - By John Resig (MIT Licensed)
br_utils.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};

/**
 * @param {Object} plugin A hash map containing descriptive information about a plugin, 
 * and functions that will be loaded and run at runtime
 * @param {String} plugin.name
 * @param {String} plugin.description
 * @param {String} plugin.author
 * @param {Function} plugin.content This is the function that holds the actual functionality
 * of the plugin - the functions passed to this object must extend BR_Content.
 * @param {Function} plugin.matches_page This function is run when the page loads, 
 * and returns true if the function will run on this page.
 * @param {Function} plugin.get_parameters This function is run when the page loads,
 * and returns a hashmap of information about the page that is passed to matches_page
 * and contents
 */
//This function is used to create plugins. It is run each time that a plugin file
//is loaded, and passes the information into the br_global array br_global.plugin_array.
//The functions in that array then are used to determine when the plugin should be 
//loaded, and then add the plugin's functionality to the page.
br_utils.create_plugin = function(plugin) {
  plugin = plugin||{};
  
  //need to have at least a name, a content, get_parameters, and match_page
  if(plugin.content && plugin.matches_page && plugin.name && plugin.get_parameters) {
    br_global.plugin_array.push(plugin);
  } else {
    br_log.error("Plugin failed to load: " + (plugin.name||"No name available"));
  }
};


// Extend function from Pro JavaScript Design Patterns
// (http://jsdesignpatterns.com/)
br_utils.extend = function(subClass, superClass) {
  var F = function() {};
  F.prototype = superClass.prototype;
  subClass.prototype = new F();
  subClass.prototype.constructor = subClass;

  subClass.superclass = superClass.prototype;
  if(superClass.prototype.constructor == Object.prototype.constructor) {
    superClass.prototype.constructor = superClass;
  }
};

// Give us access to the firefox console
br_utils.ConsoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);


// load JQuery on the fly, this way we don't interfere with
// other extensions (Web Developer Toolbar, I'm looking at you)
// 
// (http://stackoverflow.com/questions/532507/firefox-extension-with-jquery-1-3)
br_utils.get_jquery = function() {
  //init jquery
  var jsLoader, jQ, temp;
  jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                .getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader.loadSubScript("chrome://sangfroid/content/br_jquery.js");

  // initiate happens in this function
  br_jquery();

  // Monkey patch jquery - avoid global evals
  jQuery.globalEval = function(){};
  
  jQ = jQuery.noConflict(true);
  // return safe jQuery
  return jQ;
};

// bind new jQuery to window
br_utils.add_jquery = function() {
  if(typeof window.jQuery === "function") {return;}
  window.jQuery = br_utils.get_jquery();
};

/**
 * @param {String} str String to be copied
 */
//Copy string to clipboard
br_utils.copy_to_clipboard = function(str) {
  const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                              .getService(Components.interfaces.nsIClipboardHelper);
  gClipboardHelper.copyString(str);
}

/*
* @param file {NSILocalFile} Directory to list
*/
// Return an array representation of a directory listing
br_utils.list_dir = function (file) {
  // create file name from attributes supplied
  try {
    if(file.isDirectory()) {
      // (https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO#Enumerating_files_in_given_directory)
      var entries = file.directoryEntries;
      var array = [];
      while(entries.hasMoreElements())
      {
        var entry = entries.getNext();
        entry.QueryInterface(Components.interfaces.nsIFile);
        array.push(entry);
      }
      
      return array;
    }
  } catch (e) {
    br_utils.reportError("br_utils: Unable to list directory: " + file.path + ":" + e);
  }
};
// Deprecated - this function is replaced by br_log.info
br_utils.reportInfo = function(message) {
    br_utils.ConsoleService.logStringMessage(br_global.log_prefix + message);
}

// Deprecated - this function is replaced by br_log.error
br_utils.reportError = function(error) {
  br_display.displayMessage(error, "error");

  var scriptError = Cc["@mozilla.org/scripterror;1"].createInstance(Ci.nsIScriptError);
  scriptError.init(error, error.fileName, null, error.lineNumber,
      null, scriptError.errorFlag, null);
  br_utils.ConsoleService.logMessage(scriptError);
}

// Another option to grab the document object. Similar to window.content.document
// see (http://www.gajos.org/hacking/ffextension/)
br_utils.getBrowserWindow = function() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
  getService(Components.interfaces.nsIWindowMediator );
  return wm.getMostRecentWindow("navigator:browser").content.document;
}

/**
 * @param {String} aCharset Desired charset to change text to
 * @param {Unicode String} aSrc Text to be converted
 * @return {String} Converted string
 * @see http://forums.mozillazine.org/viewtopic.php?t=73651
 */
// Convert from UTF-16 to whatever. UTF-16 is the default charset that the browser
// applies to loaded character data
br_utils.convertFromUnicode = function(aCharset, aSrc) {
   try{
         var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                           .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
         unicodeConverter.charset = aCharset;
           return unicodeConverter.ConvertFromUnicode( aSrc );
   }catch(e){}
   return aSrc;
};
/**
 * @param {String} aCharset Desired charset to change text from
 * @param {String} aSrc Text to be converted
 * @return {Unicode String} Converted string
 * @see http://forums.mozillazine.org/viewtopic.php?t=73651
 */
// Convert to UTF-16 from whatever. UTF-16 is the default charset that the browser
// applies to loaded character data
br_utils.convertToUnicode = function( aCharset, aSrc )
{
   try{
      var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                              .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      unicodeConverter.charset = aCharset;
      aSrc=unicodeConverter.ConvertToUnicode( aSrc );
   }catch(e){}
   return aSrc;
}

 //  Finds all nodes under a doc; includes iframes and frames. 
 //  This is required for our use case because the BML scripts 
 //  are generally nested inside an iFrame on the page
 // 
 //  Stolen from itsalltext firefox extension 
 //  
 //  WARNING - these lists of nodes can get big, be sure to have 
 //  a mechanism to remove them from memory when you are done using them.
 //  BR_Content has clean_nodes() method specifically for this.
 //
br_utils.node_manager = {}; 
/**  
 *  @param {DOM} doc
 *  @return {Array} Array of DOM nodes
 */
br_utils.node_manager.findnodes = function (doc) {
  if (!doc) {
    return [];
  }
  var is_html = br_utils.node_manager.isHTML(doc),
  is_xul  = br_utils.node_manager.isXUL(doc),
  i,
  tmp,
  nodes = [],
  iframes,
  frames;
  if (is_html) {
    /*html*/
    tmp = doc.getElementsByTagName('textarea');
    for (i = 0; i < tmp.length; i++) {
      nodes.push(tmp[i]);
    }

    // Now that we got the nodes in this document,
    // look for other documents.
    iframes = doc.getElementsByTagName('iframe');
    for (i = 0; i < iframes.length; i++) {
      nodes.push.apply(nodes, (this.findnodes(iframes[i].contentDocument)));
    }

    frames = doc.getElementsByTagName('frame');
    for (i = 0; i < frames.length; i++) {
      nodes.push.apply(nodes, (this.findnodes(frames[i].contentDocument)));
    }
  } else if (is_xul) {
    /* XUL */

    tmp = doc.getElementsByTagName('textbox');
    for (i = 0; i < tmp.length; i++) {
      nodes.push(tmp[i]);
    }
  } else {
    //this.stopPage({originalTarget: doc});
    return [];
  }
  return nodes;
};

/**
 * @param {Array} nodes
 * @param {String} attr_name Used as a selector of a DOM element
 * @param {String} attr_value The value of the attribute name we are looking for
 * @return {DOM element} node
 */
 // Takes an array of DOM elements generated by findnodes 
 // and returns one based on an attribute 
 // 
 // returns false if node not found
br_utils.node_manager.get_node_by_attr = function(nodes, attr_name, attr_value) {
  for (var i = 0; i < nodes.length; i++) {
    if(nodes[i].getAttribute(attr_name) == attr_value) {
      return nodes[i];
    }
  }
  return false;
};

/**
 * @param {Array} nodes
 * @return {DOM} node
 */
// Takes array of DOM elements and returns the one most 
// likely to contain a BigMachines script
br_utils.node_manager.find_node_with_script = function(nodes) {
  var script_node=br_utils.node_manager.get_node_by_attr(nodes, 'id', 'textarea');
  if(script_node) {
    return script_node;
  }
  script_node=br_utils.node_manager.get_node_by_attr(nodes, 'id', 'bm_script');
  if(script_node) {
    return script_node;
  }
  script_node=br_utils.node_manager.get_node_by_attr(nodes, 'id', 'bmscript');
  if(script_node) {
    return script_node;
  }
  script_node=br_utils.node_manager.get_node_by_attr(nodes, 'name', 'script_text');
  if(script_node) {
    return script_node;
  }
  //defaults to the first node in the list
  return br_utils.node_manager.find_longest_node(nodes);
};
/**
 * @param {Array} nodes
 * @return {DOM} node
 */
// Takes array of DOM elements and returns the one with the most content
br_utils.node_manager.find_longest_node = function(nodes) {
  var max=0;
  var index=0;
  for(var i = 0, ii=nodes.length; i<ii; i++) {
    if(nodes[i].length >= max) {
      index = i;
    }
  }
  
  return nodes[index];
};
/**
 * @param {DOM} doc
 * @return {Boolean} Returns true if passed a XUL object
 */
br_utils.node_manager.isXUL = function (doc) {
    var contentType = doc && doc.contentType,
        is_xul = (contentType == 'application/vnd.mozilla.xul+xml');

    //br_utils.reportInfo("checking for xul..." + is_xul);
    return is_xul;
};
/**
 * @param {DOM} doc
 * @return {Boolean} Returns true if passed a HTML object
 */
// Helper functions for findnodes function
// Stolen from itsalltext
br_utils.node_manager.isHTML = function (doc) {
    var contentType,
        location,
        is_html,
        is_usable;
    /* Check that this is a document we want to play with. */
    contentType = doc.contentType;
    location = doc.location;
    is_html = (contentType == 'text/html' ||
               contentType == 'text/xhtml' ||
               contentType == 'application/xhtml+xml');
    is_usable = is_html &&
                location &&
                location.protocol !== 'about:' &&
                location.protocol !== 'chrome:';

    return is_usable;
};
/**
 * EXAMPLE
 * var url = br_utils.url_object("http://bigmachines.com");
 * 
 * url.get_path(); // http://bigmachines.com
 *
 * url.append("item"); // http://bigmachines.com/item
 * url.get_path(); // http://bigmachines.com (no change to base object)
 *
 * url.append_hard("item"); // http://bigmachines.com/item
 * url.get_path(); // http://bigmachines.com/item (changed base object)
 */
// The url_object is a mini-module used to represent and manipulate urls
br_utils.url_object = function(path) {
  var path = create_path(path);
  
  function create_path(path) {
    path = path.toLowerCase();
        
    //no trailing slash
    if(path.charAt(path.length-1) === "\/"){
      path = path.substring(0, path.length-1);
    }
    
    return path;
  }
  
  function append_hard(str) {
    path = append(str);
    
    return path;
  }
  
  function append(str) {
    //no leading slash
    if(str.charAt(0) === "/") {
      str = str.substring(1, str.length);
    }
    //no trailing slash
    if(str.charAt(str.length-1) === "/"){
      str = path.substring(0, str.length-1);
    }
    //fill in our own slash
    var res = path +"/"+ str;
    
    return res;
  }
  
  function leaf_name() {
    var last_slash = path.lastIndexOf("/");
    
    return path.substring(last_slash, path.length-1);
  }
  
  function get_path() {
    return path;
  }
  return {
    path: get_path,
    append: append,
    append_hard: append_hard,
    leaf_name: leaf_name
  }
}
/**
 * @param path {String} The directory of the file object
 * @param quiet {Boolean} If true, don't show errors
 * @return {nsILocalFile} The mozilla file object
 */
// Convenience function for creating nsILocalFile objects
br_utils.create_local_file = function (path, quiet) {
  try {
//    path = path.replace(/\//g, "\\");
    var file = Components.classes['@mozilla.org/file/local;1']
                                .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(path);
  
    return file;
  } catch (e) {
    if(!quiet) {
      br_utils.reportError("Error creating local file: " + path + ": " + e);
    }
    return false;
  }
};
/**
 * @param {nsILocalFile} file The file object we will append to.
 * @param {String} path The slash-delimited list of directories that we are drilling into
 * @return {nsILocalFile} The fully expanded file object
 */
// Takes something like /dir/dir/file.txt, and appends it to C:\dir\, or whatever
/**
 * EXAMPLE
 *
 * var file = br_utils.create_local_file("C:\");
 * br_utils.append_all(file, "Users\mwheeler"); 
 * file.path; // C:\Users\mwheeler
 */
br_utils.append_all = function(file, path) {
  path = path.replace(/\//g, "\\");
  
  var dirs = path.split("\\");
  for ( var i = 0, ii = dirs.length; i < ii; i++) {
    if(dirs[i]!=="") {
      file.append(dirs[i]);
    }
  }
  return file;
};
/**
 * Options include:
 * 
 * ProfD  profile directory
 * DefProfRt  user (e.g., /root/.mozilla)
 * UChrm   %profile%/chrome
 * DefRt   %installation%/defaults
 * PrfDef   %installation%/defaults/pref
 * ProfDefNoLoc   %installation%/defaults/profile
 * APlugns   %installation%/plugins
 * AChrom   %installation%/chrome
 * ComsD   %installation%/components
 * CurProcD  installation (usually)
 * Home  OS root (e.g., /root)
 * TmpD  OS tmp (e.g., /tmp)
 * ProfLD  Local Settings on windows; where the network cache and fastload files are stored
 * resource:app  application directory in a XULRunner app
 * Desk  Desktop directory (e.g. ~/Desktop on Linux, C:\Documents and Settings\username\Desktop on Windows)
 * Progs  User start menu programs directory (e.g., C:\Documents and Settings\username\Start Menu\Programs)
 * @param {String} shortcut The short name of the special location we're accessing
 * @return {nsILocalFile} The mozilla file object to the special location
 */
//Accesses Mozilla's "special" directories. 
br_utils.get_special_file = function (shortcut) {
  try {
      var path = Components.classes["@mozilla.org/file/directory_service;1"].  
                          getService(Components.interfaces.nsIProperties).  
                          get(shortcut, Components.interfaces.nsIFile);
      return path;
    } catch(e) {
      br_utils.reportError("Error initializing folder " + shortcut + ":" + e);
    }
};

// Get Operating System
br_utils.get_os = function() {
  return Components.classes["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS
};

//AH - for preventing using the page, during loading for example
br_utils.loadLock = function (message) {
	message = message || "";
	if(!jQuery("#sangfroid_loadlock",doc).length){
		jQuery("BODY",doc).append("<div id='sangfroid_loadlock' style='position:fixed;bottom:0;left:0;right:0;top:0;opacity:0.5;background-color:#000;color:#fff;z-index:90002;text-align:center;font-size:24pt;'>Don't Switch Tabs<br/>"+message+"</div>");
	}else{
		jQuery("#sangfroid_loadlock",doc).toggle();
	}
}

//AH - regex for capturing all matches. Optional input of group to return.
br_utils.regex_capture = function(string1, string2, captureGroup) {
	captureGroup = typeof captureGroup !== 'undefined' ? captureGroup : 1;
	var match = null;
	var matches = new Array();
	while (match = string1.exec(string2)) {
		var matchArray = [];
		for (i in match) {
			if (i != captureGroup) continue;
			if (parseInt(i) == i) {
				if (typeof match[i] != 'undefined')
					matchArray = match[i];
				else
					matchArray = "";
			}
		}
		matches.push(matchArray);
	}
	return matches;
};

//AH - centralized bmi site check
br_utils.is_bmi_site = function(){
	var this_html = jQuery("HTML",doc).html();
	if(this_html.length === 0) return;
	return this_html.indexOf("/bmfsweb/") > -1;
};

//centralized prod check
br_utils.is_prod_site = function(url){
	var playground = "https://custsupp-backrev01.bigmachines.com";
	if(br_global.debug && br_global.prod_sites.indexOf(playground) === -1) br_global.prod_sites.push(playground);
	var domain = br_utils.getDomain(url);
	if(br_global.prod_sites.indexOf(domain) != -1) return true;
	else return false;
};

//returns https://example.bigmachines.com from the url
br_utils.getDomain = function(url) {
	var url = doc.location.href;
	var end = url.indexOf(".com") + 4;
	url = url.substring(0, end);

	return url;
};

br_utils.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(doc.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
};

br_utils.colorArray = function(){
	return ["color_main1","color_main2","color_text1","color_text2","color_text3","color_hotbox1","color_hotbox2","color_hotbox3"];
};

br_utils.colorParam = function(){
	var prefs = this.colorArray();
	var colorDict = {};
	for(var i=0;i<prefs.length;i++){
		colorDict[prefs[i]] = br_utils.getPref(prefs[i]);
	}
	return colorDict;
};

br_utils.replaceCSSPrefs = function(element){
	var prefs = this.colorArray();			 
	for(var i=0;i<prefs.length;i++){
		element.innerHTML = element.innerHTML.split(prefs[i]).join(br_utils.getPref(prefs[i]));
	}
	return element.innerHTML;
};

br_utils.getPref = function(key,type){
	type = type || "char";
	ret = "";
	var pm = Components.classes["@mozilla.org/preferences-service;1"]
												.getService(Components.interfaces.nsIPrefService)
												.getBranch("extensions.sangfroid.");
	if(type == "char"){
		ret = pm.getCharPref(key);
	}else if (type == "bool"){
		ret = pm.getBoolPref(key);
	}else{
		ret = "INVALID PREF TYPE";
	}
	return ret;
};
