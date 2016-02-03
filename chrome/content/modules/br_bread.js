 // These functions are used to help parse names from BigMachines BML Editor pages
 // They refer to the breadcrumbs found in Commerce BML scripts
/**
 * EXAMPLE
 * br_bread.title_bar_directory("Commerce > Quote > Action Name");
 */
var br_bread = (function() {
  // Public interface starts here:
  return {
    title_bar_directory: title_bar_directory,
    title_bar_short_name: title_bar_short_name,
    title_bar_start: title_bar_start,
    title_bar_end: title_bar_end,
    title_bar_by_count: title_bar_by_count
  }
  //
   // This takes a parameter in the form:
   // Action : Commerce > Quote > Action Name [> Attribute Name]
   // Creates safe characters out of it
   // Action___Commerce_>_Quote_>_Action_Name
  function title_bar_directory (str) {
    //wipe out dangerous characters, spaces        
    str = str.replace(/:/g, '_');
    str = str.replace(/ /g, '_');
    str = str.replace(/&gt;/g, '');
    
    return str;
  }
  //
   // This takes a parameter in the form:
   // Action : Commerce > Quote > Action Name [> Attribute Name]
   // Returns
   // Action-Action Name [or Attribute Name] 
   //
  function title_bar_short_name (str) {
    return title_bar_start(str)+"-"+title_bar_end(str);
  }
  function title_bar_start (str) {
    index = str.indexOf(':');
    if(index > -1) {
      str=str.substring(0,index);
    } else {
      str = "name_unavailable";
    }
    return doc.jQuery.trim(str);
  }
  function title_bar_end (str) {
    index = str.lastIndexOf('&gt;');
    if(index > -1) {
      str=str.substring(index + 4);
    } else {
      str = "name_unavailable";
    }
    return doc.jQuery.trim(str);
  }
  /**
   * @param str - the titlebar to be parsed
   * @param index - doesn't include before the first :
   * @return string
   */
  function title_bar_by_count (str, index) {
    //cut off before :, convert all : to _
    full = str.split(":");
    desc = full[0];
    name = full.slice(1).join("_");
    
    //starting with Process Name > Step Name > Profile > Action > Transition Name
    //creating a directory Step Name\Profile\
    //filename action_transition
	nameArr = [];
    nameArr = name.split("&gt;");
    //add back first part
    nameArr.reverse();
    nameArr.push(desc);
    nameArr.reverse();
    if(nameArr[index]){
      return doc.jQuery.trim(nameArr[index]);
    } else {
      //return last element if invalid index
      return doc.jQuery.trim(nameArr[nameArr.length-1]);
    }
  }
}());
