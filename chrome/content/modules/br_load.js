// This is a module for AJAX. It has convenience functions for loading different 
// types of content, including html templates, css, plugins, and JS libraries.
// This is the preferred AJAX library to use; better than jQuery because we avoid
// cacheing issue.

/**
 * EXAMPLE
 * //http get and post
 * var promise = br_load.get("http://url", {param: "value"}, function success(data) { });
 * var promise = br_load.post("http://url", {param: "value"}, function success(data) { });
 *
 * // John Resig Micro Templating
 * var promise = br_load.template("http://url", {param: "value"}, function success(template) { 
 *  var ele = doc.createElement("div");
 *  ele.innerHTML = template();
 * });
 * 
 * var promise = br_load.css("http://url", {param: "value"}, function success(css_tag) { 
 *  doc.getElementsByTagName("head")[0].appendChild(css_tag);
 * });
 *
 * // load up a library
 * br_load.js("chrome://sangfroid/content/modules/br_log.js");
 **/
var br_load = function() {
  var cache = {};

  function build_tag(tag, attr) {
    if(!doc) {return {};}
    var t = doc.createElement(tag);
    for(var x in attr) { if(attr.hasOwnProperty(x)) {
      t.setAttribute(x, attr[x]);
    }}
    return t;
  }

  function load(url, callback, deferred, format_result) {
    ajax({
      type: "GET",
      url: url,
      success: function(data, success) {
        cache[url] = data;
        var result = format_result(data);
        
        callback(result);
        deferred.resolve(result);
      },
      beforeSend:function(xhr) {
          xhr.overrideMimeType("text/plain");
          xhr.setRequestHeader("Accept", "text/plain");
      },
      dataType: "text"
    });
  }

  function script(path) {
    try {
      var jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                        .getService(Components.interfaces.mozIJSSubScriptLoader);
      jsLoader.loadSubScript(path/*, obj*/);
    } catch(e) {
      if(typeof br_utils === "object") {
        br_utils.reportError(path + ": " + e.message + " in file " + e.fileName + " at line " + e.lineNumber);
      }
    }
  }

  function load_or_cache(url, callback, format_result, force) {
    callback = typeof callback === "function" ? callback : function() {};
    format_result = format_result || function(value) {return value};

    var deferred = Q.defer();

    if(!cache[url] || force) {
      if(typeof br_utils === "function") {
        br_utils.reportInfo("loading from: " + url);
      }
      load(url, callback, deferred, format_result);
      return deferred.promise;
    } else {
      var result = format_result(cache[url]);
      callback(result);
      deferred.resolve(result);
      return deferred.promise;
    }
  }


  // Public interface starts here 
  /**
   * Grabs a text value from a remote or local source. Caches the result for future calls to this function.
   * @param url {String} The url to load the resource from.
   * @param callback {Function} Called when text is loaded. Text is passed as argument.
   * @param force {Boolean} If true, then cache will be ignored.
   *
   * @return promise {Promise} Deferred object to manage asynchronous events
   **/
  function text(url, callback, force) {
    return load_or_cache(url, callback, undefined, force);
  }

  /**
   * Creates a template from a text value from a remote or local source. Caches the result for future calls to this function.
   * The template can be rendered by running it: template();
   * @param url {String} The url to load the resource from.
   * @param callback {Function} Called when text is loaded. Template is passed as argument.
   * @param force {Boolean} If true, then cache will be ignored.
   *
   * @return promise {Promise} Deferred object to manage asynchronous events
   * @see John Resig's micro-templating for more information.
   **/
  function template(url, callback, force) {
    callback = typeof callback === "function" ? callback : function() {};
    
    var format_result = function(text) {
      return _.template(text);
    }

    return load_or_cache(url, callback, format_result, force);
  }

  /**
   * Creates a style tag from a text value from remote or local source. Caches.
   * @param url {String} The url to load the resource from.
   * @param callback {Function} Called when text is loaded. Template is passed as argument.
   * @param force {Boolean} If true, then cache will be ignored.
   *
   * @return promise {Promise} Deferred object to manage asynchronous events
   **/
  function css(url, callback, force) {
    callback = typeof callback === "function" ? callback : function() {};

    var format_result = function(text) {
      var tag = build_tag("style", {class:"sangfroid_style"});
      tag.innerHTML = text;
      return tag;
    };

    return load_or_cache(url, callback, format_result, force);
  }

/**
 * Loads the given javascript file into memory
 * @param path(s) {String or Array} path Local absolute directory of file
 * Can also be an array of strings to load
 * TODO: non-global loading, and cacheing scripts
 */
  function js(paths) {
    // if not an array, assume we passed a string and make an array
    if(typeof paths === "string") {
      paths = [paths];
    } 
    for(var i=0, ii = paths.length; i<ii; i++) {
      script(paths[i]);
    };
  }

  function plugins(plugins) {
    // if not an array, assume we passed an individual plugin and make an array
    if(toString.call(plugins) === '[object Object]') {
      plugins = [plugins];
    }
    var curr;
    for(var i=0, ii = plugins.length; i<ii; i++) {
      curr = "file://"+plugins[i].path;
      script(curr);
    }
  }

  /* take is_get as a parameter, because get will always be a string*/
  function hash_to_form(hash, is_get, multiform_okay) {
    var i, formdata, push;
    if(typeof FormData === "undefined" && multiform_okay) {
      throw new Error("File API not available in this browser.");
    }

    if(typeof FormData !== "undefined" && !is_get && multiform_okay) {
      formdata = new FormData();
      push = function(key, val) {
        formdata.append(key, val);
      }
    } else {
      formdata = "";
      function scrub(str) {
        return encodeURIComponent(str).replace(/%20/g, "+");
      }
      push = function(key, val) {
        formdata += scrub(key) + "=" + scrub(val) + "&";
      }
    }
      
    for(i in hash) {
      push(i, hash[i]);
    }
    
    return formdata;
  }

  function determine_type(ct) {
    if(ct.indexOf("json") > -1) {
      return "json";
    } else if(ct.indexOf("xml")) {
      return "xml";
    } else {
      return "text";
    }
  }

  function handle_load(xhr, type, success_callback) {
    var change;
    /*
    xhr.onabort = function() {
    };
    xhr.onerror = function() {
    };
    xhr.onload = function() {
    };
    xhr.onloadend = function() {
    };*/
    xhr.onload=function(isTimeout) {
      var response, ct;
      // The request was aborted
      if ( !xhr || xhr.readyState === 0 ) {
        br_log.error("AJAX Request Aborted");
        if(xhr) {
          xhr.onreadystatechange = function() {};
        }
        xhr = null;
      // The transfer is complete and the data is available
      } else if ( xhr && (xhr.readyState === 4 ) ) {
        ct = xhr.getResponseHeader("content-type") || "";
        type = type || determine_type(ct);
        //handle different data types
        if(type === "json") {
          try {
            response = JSON.parse(xhr.responseText);
          } catch(e) {
            response = xhr.responseText;
          }
        } else if(type === "xml") {
          response = xhr.reponseXML ? xhr.responseXML : xhr.responseText;
        } else {
          response = xhr.responseText;
        }

        success_callback(response, xhr.statusText, xhr);

        // wipe out references when completed
        if(xhr) {
          xhr.onreadystatechange = function() {};
        }
        xhr = null;
      }
    };
  }
  function default_overrides(xhr, opt) {
    var accepts = {
      xml: "application/xml, text/xml",
      html: "text/html",
      script: "text/javascript, application/javascript",
      json: "application/json, text/javascript",
      text: "text/plain",
      _default: "*/*"
    };
    xhr.setRequestHeader("Accept", opt.type && accepts[ opt.type ] ?
      accepts[ opt.type ] + ", */*" :
      accepts._default );

    if(!opt.multiform) {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  }

   //  Built to look and act like jQuery.ajax
   //  Accepts file objects per [Mozilla Docs](https://developer.mozilla.org/En/Using_XMLHttpRequest#Sending_files_using_a_FormData_object)
  function ajax(options) {
    var formdata = "", xhr = new XMLHttpRequest(), item, 
      is_get = options.type.toUpperCase() === "GET";

    options.data = options.data || {};
    options.multiform = options.multiform || false;
    options.dataType = options.dataType || null;
    options.timeout = options.timeout || 7000;
    options.success = options.success || function() {};
    options.beforeSend = options.beforeSend || function() {};

    if(typeof options.data === "object") {
      formdata = hash_to_form(options.data, is_get, options.multiform);
    } else if(typeof options.data === "string") {
      formdata = options.data;
    }

    if(is_get) {
      options.url.replace(/#.*/, "");
      options.url += options.url.indexOf("?") === -1 ? "?"+formdata : "&"+formdata;
    }

    xhr.open(options.type, options.url, true);  

    if(!is_get && typeof formdata === "string") {
    }

    handle_load(xhr, options.dataType, options.success);

    default_overrides(xhr, options);
    options.beforeSend(xhr);

    xhr.send(is_get ? null : formdata);
  }

  // public interface starts here
  return {
    text: text,
    template: template,
    css: css,
    js: js,
    plugins: plugins,
    cache: cache,
    ajax: ajax,
    get: function(url, params, success, dataType){ ajax({type: "GET", url: url, dataType: dataType, data: params, success: success}) },
    post: function(url, params, success, dataType){ ajax({type: "POST", url: url, dataType: dataType,  data: params, success: success}) }
  }
}();
