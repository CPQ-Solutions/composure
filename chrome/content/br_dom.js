// DOM utility functions. The goal of this library is to phase out our dependence on jQuery 
// in the core.
/**
 * EXAMPLE
 * (from within plugin)
 *
 * var dom = br_dom(this.jQuery);
 *
 * var el = doc.getElementById("element-id");
 * dom.append(el, "<div>Add this inside element.</div>", doc);
 * dom.html(el, "Replace contents entirely", doc);
 */
var br_dom = function(jQuery) {
	jQuery = jQuery || br_utils.get_jquery();

  function apply_style(element, style, doc){
    doc = doc || window.content.document;
    //jQuery(element,doc).css(style);
    element = addCss(element, style, doc);
    return element;
  };
  function build_tag(tag, attr, doc){
    doc = doc || window.content.document;
    var t = doc.createElement(tag);
      for(var x in attr) {
        if(attr.hasOwnProperty(x)) {
          t.setAttribute(x, attr[x]);
        }
      }
    return t;
  };
  /**
   *Builds a page element
   *@param attrs - array of element attributes (ex {'type':'textarea', 'id':...})
   *@param type - type of element (ex "input")
   *@param style - css for element
   *@param doc - document that holds the element
   *@return the page element
   */
  function build_page_element(attrs, type, style, doc){
    doc = doc || window.content.document;
    var attr = attrs;
    var ele = build_tag(type, attr, doc);
    ele = apply_style(ele, style, doc);
    return ele;
  };
  /**
   *Builds a form object
   *@param formInfo - hash holding form information
   *@param formInfo.doc - document that holds the form
   *@param formInfo.attrs - array of form attributes
   *@param formInfo.style - css for form
   *@param formInfo.elements (array) - elements to append to form
   *@param formInfo.submit - submit function for form
   *@param formInfo.click - click function for form
   *@return form object
   */
  //function(doc,attrs,style,elements,submit,click)
  function build_form(formInfo){
    formInfo = validateForm(formInfo);
    var form = build_page_element(formInfo.attrs,"form",formInfo.style,formInfo.doc);
    for(var i=0,ii=formInfo.elements.length; i<ii; i++){
      //jQuery(form,doc).append(elements[i]);
      appendEle(form, formInfo.doc, formInfo.elements[i]);
    }
    //jQuery(form,doc).submit(submit);
    form = add_submit_function(form, formInfo.submit, formInfo.doc)
    //jQuery(form,doc).click(click);
    form = add_click_function(form, formInfo.click, formInfo.doc)
    return form;
  }
  function add_click_function(button, click, doc) {
    doc = doc || window.content.document;
    //jQuery(button, doc).click(new_click);
    addClick(button, doc, click);
    return button;
  }
  function add_submit_function(form, submit, doc) {
    doc = doc || window.content.document;
    var new_submit = function() {submit();return false;};
    //jQuery(form, doc).submit(new_submit);
    addSubmit(form,doc, new_submit);
    return form;
  }
  function append(el, con, doc) {
    el = appendEle(el, con, doc);
    return el;
  }
  function append_content(con, el, doc){
    element = appendEle(el, con, doc);
    return element;
  }
  function addCss(element, style, doc){
    doc = doc || window.content.document;
    jQuery(element,doc).css(style);
    return element;
  }
  function appendEle(element, content, doc) {
    doc = doc || window.content.document;
    var i, ii, tmp_el = doc.createElement("div");
    
    // deal with elements
    if(typeof content !== "string") {
      element.appendChild(content);

    //deal with strings
    } else {
      tmp_el.innerHTML = content;

      for(i = 0, ii = tmp_el.children.length; i<ii; i++) {
        element.appendChild(tmp_el.children[i]);
      }
    }

    return element;
  }
  function addClick(button, doc, new_click) {
    doc = doc || window.content.document;
    jQuery(button, doc).click(new_click);
  }
  function addSubmit(form, doc, new_submit) {
    doc = doc || window.content.document;
    jQuery(form, doc).submit(new_submit);
  }
  function validateForm(formInfo) {
    formInfo.doc = doc || window.content.document;
    formInfo.attrs = formInfo.attrs || {};
    formInfo.style = formInfo.style || {};
    formInfo.elements = formInfo.elements || {};
    formInfo.submit = formInfo.submit || function(){return true;};
    formInfo.click = formInfo.click || function(){return false;};
    return formInfo;
  }
  function show(el) {
    el && el.style && (el.style.display="block");
  }
  function hide(el) {
    el && el.style && (el.style.display="none");
  }
  function html(el, content, doc) {
    if(!el || !el.innerHTML) {
      br_log.error("br_dom error - el is not an HTML element");
    }
    el.innerHTML = "";

    appendEle(el, content, doc);

    return el;
  }
  return {
    add_click_function: add_click_function,
    add_submit_function: add_submit_function,
    append_content: append_content,
    append: append,
    apply_style: apply_style,
    build_form: build_form,
    build_page_element: build_page_element,
    build_tag: build_tag,
    show: show,
    hide: hide,
    html: html
  }
};
