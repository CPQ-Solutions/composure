// The hotbox object contains the logic to render and manage the hotbox window.
// It is consumed by the hotbox plugin, which passes in an object representing the
// commands that will be rendered in the Hotbox itself.
/**
 * EXAMPLE
 * (see hot_box.brc.js for full usage)
 * var hotbox, link_info = [
 *  // page 1, row 1, column 1
 *  {position: 'p1-r1-c1', key: 't', description: 'A Test Command', callback: function() {}}
 * ];
 * hotbox = br_hotbox(link_info, doc, this.jQuery);
 */
function br_hotbox(options, doc, $) {
  $ = $ || jQuery;
  doc = doc || window.content.document;
  options = options || [];
  
  var showing = false, jQuery = $,
    built = $("#br_hotbox_frame", doc).html() !== null;

  // Convenience object to keep track of current page
  var div_counter = {};
  div_counter.value = 1;
  div_counter.max = 3;
  div_counter.min = 1;
  div_counter.up = function() {
    this.value += 1;
    if (this.value > this.max) {
      this.value = this.min;
    }
    
    return this.value;
  };
  div_counter.down = function() {
    this.value -= 1;
    if (this.value < this.min) {
      this.value = this.max;
    }
    return this.value;
  };

  function create_css_link(href) {
    var css_node = doc.createElement("link");
    css_node.type = 'text/css';
    css_node.rel = 'stylesheet';
    css_node.href = href;
    css_node.media = 'screen';
    
    return css_node;
  }
  
  function attach_focus() {
    $(doc).unbind('focus', hide);
    
    $(doc).focus(hide);
  }
  
  function keydown(callback) {
    $(doc).unbind('keydown');
    
    $(doc).keydown(callback);
  }
  
  function keyup(callback) {
    $(doc).unbind('keyup');
    
    $(doc).keyup(callback);
  }

  // load the hotbox html from source
  function get_template() {
    var xul_frame = document.getElementById("br-hotbox");
    var template = _.template(xul_frame.contentDocument.body.innerHTML);

    xul_frame.src = "chrome://sangfroid/content/img/hotbox.html";
    return template;
  }

  function attach_snippets(hotbox_frame) {
    //attach functions to links
    for(var i=0, ii=options.length; i<ii; i++) {
        $("#"+options[i].position, hotbox_frame)
          .html(build_button_text(options[i]))
          .click(get_callback(options[i]))
		  /* AH - to allow empty spaces */
		  .addClass("hotbox-link");
    }
    
    //attach functions to arrows and close
    $(".br-go-next", hotbox_frame).each(function() {
      $(this).click(increment);
    });
    $(".br-go-previous", hotbox_frame).each(function() {
      $(this).click(decrement);
    });
    $(".br-exit", hotbox_frame).each(function() {
      $(this).click(hide);
    });
  }
  
  function build_hotbox() {    
    var hotbox_frame;
    var html_done = br_load.template("chrome://sangfroid/content/templates/hotbox.html", function(temp) {
      hotbox_frame = doc.createElement("div");
      hotbox_frame.id = "br_hotbox_frame";
      hotbox_frame.innerHTML = temp();
      doc.body.appendChild(hotbox_frame);

      // do the heavy lifting of building this thing out asynchronously, so we can show faster
      setTimeout(function() {attach_snippets(hotbox_frame);}, 0);
    });

    var css_link =  /*br_utils.is_alt() ? "chrome://sangfroid/content/templates/hotbox_alt.css" : 
                                     */ "chrome://sangfroid/content/templates/hotbox.css";
    var css_done = br_load.css(css_link, function(css) {
      var head = doc.head;
      head = head || doc.getElementsByTagName("head")[0];
	  css.innerHTML = br_utils.replaceCSSPrefs(css);
      head.appendChild(css);
    });

    return Q.join(html_done, css_done, function(html, css) {
      built = true;
      return "done";
    });
  }
  
  function build_button_text(item) {
    var desc = item.description || "",
    key = item.key || "";

    var str = "";
    str += "<h2 class='hotbox_keycode'>"+key.toUpperCase()+"</h2>";
    str += "<span class='hotbox_desc'>"+desc+"</span>";

    return str;
  }
  
  function get_callback(item) {
    var ret = function() {};
    var url_text = doc.location.href;
    var end = url_text.indexOf(".com") + 5;
    url_text = url_text.substring(0, end);

    var new_url = item.url||"";
    url_text += new_url;
    if(new_url !== "" && !item.callback) {
	//MX add quick link option, new window, new tab or current tab
		if(item.tab == "window" && item.url.indexOf('quick_links.jsp') >= 0){
		ret = function() {
		    hide(); 
			window.open(url_text,'', 'toolbar=0,menubar=0,location=0,directories=0,status=0,scrollbars=1,resizable=1,width=400,height=900');
			//log(item);
			};
		}else if(item.tab == "window" && item.url.indexOf('quick_links.jsp') < 0){
		ret = function() {
		    hide(); 
			window.open(url_text);
			//log(item);
			};
		}else if(item.tab == "newtab"){
			ret = function() {
			hide(); 
			gBrowser.selectedTab = gBrowser.addTab(url_text);
			//log(item);
			};
		}else{
			ret = function() {
			hide(); 
			openUILink(url_text);
			//log(item);
			};
		}
      /*if(item.tab) {
        ret = function() {
		hide(); 
		//window.open(url_text,'', 'toolbar=0,menubar=0,location=0,directories=0,status=0,scrollbars=1,resizable=1,width=400,height=900');
		gBrowser.selectedTab = gBrowser.addTab(url_text);
		log(item);};
      } else{
        ret = function() {hide(); openUILink(url_text);log(item);};
      }*/
      // insert your saving routine here
    } else if(item.callback && (typeof item.callback === "function")) {
      ret = function() {
        hide();
        item.callback();
        log(item);
        return false;
      };
    }
    return ret;
  }

  function reveal() {
    var win_top = $(window.content).scrollTop() + 10;
    $('.centered-panel', doc).css({'top': win_top});
    $('#darken', doc).show();
    $('#hotbox-wrapper', doc).show();
    $('#hotbox-panel-'+ div_counter.value, doc).show();

    attach_focus();
  }
  
  function show() {    
    if(!showing) {    
      /* as soon as showing is set, we can run commands */ 
      showing = true;
      div_counter.value = 1;
      
      if(!built) {
        var done = build_hotbox();
        Q.when(done, function(val) {
          reveal();
        });
      } else {
        reveal();
      }
    }
    return false;
  }
  
  function hide() {
    showing = false;
    $('#darken', doc).hide(0);
    $('#hotbox-wrapper', doc).hide(0);
    $('.hotbox-panel', doc).each(function() {
      $(this).hide();
    });
    return false;
  }
  // Change page (++)
  function increment() {
    if(showing) {
      $('#hotbox-panel-'+ div_counter.value, doc).hide(0);
      $('#hotbox-panel-' + div_counter.up(), doc).show(0);
    }
    return false;
  }
  // Change page (--)
  function decrement() {
    if(showing) {
      $('#hotbox-panel-'+ div_counter.value, doc).hide(0);
      $('#hotbox-panel-' + div_counter.down(), doc).show(0);
    }
    return false;
  }
  function destroy() {
    $("#br_hotbox_frame").remove();
    built = false;
  }
  function current_page() {
    return div_counter.value;
  }
  function log(item) {
    if(!item.description) {return;}
	
	//AH - this was logging to firefox.bigmachines
    //br_log.server("HOTBOXCOMMAND:"+item.description);
	br_log.firebug("HOTBOXCOMMAND:"+item.description);
  }

  // Public interface
  return {
    show:show,
    hide:hide,
    visible: function(){ return showing; },
    increment:increment,
    decrement:decrement,
    destroy:destroy,
    current_page:current_page,
    keydown:keydown,
    keyup:keyup,
    log:log
  };
}
