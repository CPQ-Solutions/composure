// This object is responsible for rendering miscellaneous effects
var br_display = {  
  // Function to create a "toggle" link for a provided element. The toggle link will 
  // be added directly before the selected element, and the element will be hidden 
  // by default.
  /**
   * EXAMPLE
   *
   * br_display.create_toggle_link("#my-div", "my-made-up-unique-id", doc);
   */
  create_toggle_link: function(selector, toggle_id, doc, name, location) {
	var pm = Components.classes["@mozilla.org/preferences-service;1"]
												 .getService(Components.interfaces.nsIPrefService)
												 .getBranch("extensions.sangfroid.");
	name = typeof name !== 'undefined' ? name : "Toggle View";
	location = typeof location !== 'undefined' ? location : selector;
    var str = "<a href='#' style='color:"+pm.getCharPref("color_text1")+";background-color:"+pm.getCharPref("color_main1")+";' id='"+toggle_id+"'>"+name+"</a>";
    
    if(br_$('#'+toggle_id,doc).length < 1){
		br_$(location, doc).before(str);
        br_$(selector, doc).hide();
        
        br_$('#'+toggle_id,doc).live('click', function() {
			br_$(selector, doc).toggle('fast');			
			return false;
		});
    }
  },
  // This function splits the results of a BML function by the pipe symbol,
  // so that the results show vertically down the page rather than horizontally.
  format_result_pipes: function() {
    var str = br_$("td.form-label:contains('Result:')",doc).next().html();
    if(str) {
      str = str.replace(/\|/g,"<br/>");
        str = "<div>"+str+"</div>";
        br_$("td.form-label:contains('Result:')",doc).next().html(str);
    }
  },
  
  // this function replaced by br_log
  // pass any calls straight through 
  displayMessage: function() {
    br_log.notify.apply(this, arguments);
  },
   /*
   * @param {DOM} node Node to perform the effect on
   */
  // Shows a success effect on the DOM node passed in. This is 
  // what flashes the color of the element on read.
  show_success_effect: function(node) {
    br_utils.add_jquery();
    
    if(node) {
       //Clear any previous animation
      node.sangfroid_background = node.sangfroid_background || br_display.getStyle(node, 'background-color');
      clearTimeout(node.sangfroid_begin);
      clearTimeout(node.sangfroid_end);
      
      //change the color, using css transitions if available
      br_$(node).css({'-moz-transition':'all 1.0s ease-out'});
      node.sangfroid_begin = setTimeout(function() {br_$(node).css({'background-color': "#0f0"})}, "10");
      node.sangfroid_end = setTimeout(function() {br_$(node).css({'background-color': node.sangfroid_background})}, "1010");
    }
  },
  /**
   * @param {DOM} node The DOM node to get the information for.
   * @param {String} attr The CSS-style attribute to fetch (not DOM name).
   * @returns attribute
   */
  // Fetches the computed CSS attribute for a specific node
  getStyle: function (node, attr) {
      var view  = node.ownerDocument ? node.ownerDocument.defaultView : null;

      if(!view) {
        return "";
      }

      var style = view.getComputedStyle(node, '');
      return  style.getPropertyCSSValue(attr).cssText;
  },
  /**
   * God save us everyone
   * Will we burn inside the fire 
   * of a thousand suns
   * for the sins of our hands
   * sins of our tongues
   * sins of our fathers
   * sins of our sons
   */
  // AJAX Loading image - defaults to the menu logo if you don't pass in an element.
  set_loading_image: function(element) {
    var img = element || br_$("#br_menu_logo",doc);
    br_$(img).attr("src", "chrome://sangfroid/content/img/ajax-loader.gif");
  },
  unset_loading_image: function(element) {
    var img = element || br_$("#br_menu_logo", doc);
    if(br_utils.is_alt()) {
      br_$(img).attr("src", "chrome://sangfroid/content/img/034.png");
    } else {
      br_$(img).attr("src", "chrome://sangfroid/content/img/logo.png");
    }
  },
  // Turn a hash object into a string.
  hash_string: function(message) {
    var result = "", tmp, i;
    
    if(!message) {
      return result;
    }
    
    if(typeof message === "string") {
      return message;
    }
    
    if(typeof message !== "object") {
      return result;
    }
    
    if(message.success === true) {
      return "Operation Successful";
    }
    
    for(i in message) {if(message.hasOwnProperty(i)) {
      // recurse through nested objects
      tmp = typeof message[i] === "object" ? br_display.hash_string(message[i]) : message[i];
      tmp = typeof tmp === "boolean" ? tmp.toString() : tmp;
      tmp = tmp || "none";
      result += i + ": " + tmp + "\n";
    }}
    
    return result;
  }
};
