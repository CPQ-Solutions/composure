br_utils.create_plugin ({	
'name':'bml library',
'author':'Michael Wheeler',
'description':'Enables version control for a BML Library within BigMachines.',
regex_urls:['spring\/bmllibrary'],
'get_parameters':function(doc, jQuery) {
	var params = {};

	params.id = jQuery("input[name='id']", doc).attr("value");
	params.var_name = jQuery("input[name='variableName']", doc).attr("value");
	params.process_id = jQuery("input[name='process_id']", doc).attr("value");
		
	return params;
},
'matches_page':function(p) {
	var cond2 = p['id'];
	var cond3 = p['var_name'];
	
	return cond2 && cond3;
},
'content': content_bml_library,
});
function content_bml_library(params) {
	var jQuery = this.jQuery, doc = this.doc;
	k = this;
	this.parameters = params;
	/**
	 * content and elements on page
	 */
	this.get_script_type = function() {
		return params.process_id === "-1" ? "util library" : "commerce library";
	};
	//this.get_script = function() {return this.search_nodes_for_script() || EMPTY_SCRIPT_STRING;};
	/**
	 * File naming and directories
	 */
	this.get_filename = function() {
		var f = this.parameters['var_name']+"."+this.parameters['id'];
		
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function() {return "Libraries\\";};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};
	
	this.get_extension = function() {return ".bml";};
	if(params.process_id === "-1"){
		this.get_menu = function () {
			var me = this;
			//this.auto_sync(me);

			var m = br_menu(me.doc, me)
				.add_separator("br_editing", "Editor")
				.add_button_with_icon("br_open_temp", "Open in Editor", "Open",
					"chrome://sangfroid/content/img/edit.png", function () {
					me.open_temp_file();
				})
				.add_button_with_icon("br_read_temp", "Read from Editor", "Read",
					"chrome://sangfroid/content/img/restore.png", function () {
					me.read_from_file();
				})
				.add_button_with_icon("br_open_debug", "Open Debug Output", "Debug",
					"chrome://sangfroid/content/img/bug.png", function () {
					me.open_debug_file();
				})
				.add_button_with_icon("br_test_script", "Create Test Script", "TestScript",
					"chrome://sangfroid/content/img/fox.png", function () {
					me.create_test_script();
				})
			return m;
		};
	}
	//function to make util test script
	this.create_test_script = function(){
		var me = this;
		//console.log(paramName);
		//console.log(paramType);
		var level = "";
		utilParams = me.get_util_params();
		var message = me.build_util_input(utilParams);
		br_log.firebug(jQuery("#br_notifypage_root",doc).html());
		br_log.firebug(br_log.page_ready());
		if(message != "" && jQuery("#br_notifypage_root",doc).length == 0 && !br_log.page_ready()){
			br_log.page(message,level,function(){
				jQuery("#buildTestScript",doc).bind("click",function(){
					me.build_test_script(utilParams);
				});
			});
		}
	};
	this.get_util_params = function(){
		var me = this;
		var paramType = jQuery('.x-grid3-td-paramType', doc);
		var paramName = jQuery('.x-grid3-td-paramName', doc);
		var numOfParams = paramName.length;
		paramType = paramType.slice(1,numOfParams);
		paramName = paramName.slice(1,numOfParams);
		var paramClass = [];
		var paramExam = [];
		for(n = 0; n<numOfParams-1; n++){
			paramType[n] = paramType[n].firstElementChild.innerHTML;
			paramClass[n] = me.set_class(paramType[n]);
			paramExam[n] = me.set_example(paramClass[n]);
			paramName[n] = paramName[n].firstElementChild.innerHTML;
		}
		return [paramType, paramClass, paramName, paramExam];
	}
	this.build_util_input = function(params) {
		var me = this;
		var paramType = params[0];
		var paramName = params[2];
		var paramClass = params[1];
		var paramExam = params[3];
		var numOfParams = paramName.length;
		var tableBody = "<tr><th align=\"right\">Parameter</th><th align=\"right\">Print Value</th></tr>";
		for(n = 0; n<numOfParams; n++){
		  tableBody = tableBody + "<tr><td align=\"right\">" + paramName[n] + "</td><td><input size=\"75\" class=\"" + paramClass[n] + "\" name=\"" + paramName[n] + "_comp\" type=\"text\" placeholder=\"" + paramExam[n] + "\"/></td></tr>"
		}
		var retStr = "<div id=\"testScript\" style=\"overflow-y:auto;max-height:500px;overflow-x:hidden;\"><table>" + tableBody + "</table></div><div><table><tr><td align=\"right\"><input type=\"button\" id=\"buildTestScript\" value=\"Create Test Script\"/></td></tr></table></div>";
		return retStr;
	};
	this.set_class = function(typeStr){
		types = typeStr.split(" ");
		var classType = "";
		if(types.length > 1){
			classType += "dict_";
		}
		if(types[0].indexOf("[][]") > -1){
			var pos = types[0].indexOf("[][]");
			classType = classType + "dub_arr_" + types[0].substr(0, pos).toLowerCase();
		}
		else if(types[0].indexOf("[]") > -1){
			var pos = types[0].indexOf("[]");
			classType = classType + "arr_" + types[0].substr(0, pos).toLowerCase();
		}
		else{
			classType += types[0].toLowerCase();
		}
		return classType;
	}
	this.set_example = function(classStr){
		types = classStr.split("_");
		var example = "VALUE";
		for(var x = 0; x<types.length; x++){
			type = types[x];
			var currExample = "";
			if(type=="dict"){
				currExample = "{KEY1=VALUE, ...}";
			}else if(type=="dub" || type=="arr"){
				currExample = "[VALUE, ...]";
			}else if(type=="string"){
				currExample = "string";
			}else if(type=="float"){
				currExample = "1.0";
			}else if(type=="interger"){
				currExample = "10";
			}else if(type=="boolean"){
				currExample = "true";
			}else{//type==date
				currExample = "2015/08/18 14:12";
			}
			example = example.replace(/VALUE/g, currExample);
		}
		return example;
	}
	this.checkClass = function(value, subclasses) {
		me = this;
		var currClass = subclasses[0];
		var nextClass = subclasses[1];
		var nextClasses = subclasses.slice(1);
		var splitter = '?|^';
		var structuredValue;
		if(value == "" && currClass != "string"){
			return "ERROR";
		}
		if (currClass == 'dict') {
			if(value.indexOf("{") != 0 || (value.lastIndexOf("}") + 1) != value.length){
				return "ERROR";
			}
			var strA = value.slice(1, -1);
			if (nextClass == 'dub') {
				strA = strA.replace(/]]\, /g, ']]' + splitter);
			} else if (nextClass == 'arr') {
				strA = strA.replace(/]\, /g, ']' + splitter);
			}
			var vals = strA.split(splitter);
			for (var x = 0; x < vals.length; x++) {
				var val = vals[x];
				if(val.indexOf("=") == -1){
					return 'ERROR';
				}
				var dictPair = val.split('=');
				if (nextClasses.length > 0) {
					dictPair[1] = me.checkClass(dictPair[1], nextClasses);
					if (dictPair[1] == 'ERROR') {
						return 'ERROR';
					}
				}
				vals[x]=dictPair.join("=");
				//structuredValue[x] = dictPair;
			}
			structuredValue = vals.join("dictSep");
			return structuredValue;
		} else if (currClass == 'dub') {
			if(value.indexOf("[[") != 0 || (value.lastIndexOf("]]") + 2) != value.length){
				return "ERROR";
			}
			var strA = value.slice(1, -1);
			strA = strA.replace(/]\, /g, ']' + splitter);
			var vals = strA.split(splitter);
			for (var x = 0; x < vals.length; x++) {
				var val = vals[x];
				vals[x] = me.checkClass(val, nextClasses);
				if (vals[x] == 'ERROR') {
					return 'ERROR';
				}
			}
			structuredValue = vals.join("dubSep");
			return structuredValue;
		} else if (currClass == 'arr') {
			if(value.indexOf("[") != 0 || (value.lastIndexOf("]") + 1) != value.length){
				return "ERROR";
			}
			var strA = value.slice(1, -1);
			strA = strA.replace(/\, /g, splitter);
			var vals = strA.split(splitter);
			for (var x = 0; x < vals.length; x++) {
				var val = vals[x];
				vals[x] = me.checkClass(val, nextClasses);
				if (vals[x] == 'ERROR') {
					return 'ERROR';
				}
			}
			structuredValue = vals.join("arrSep");
			return structuredValue;
		} else if (currClass == 'string') {
			return value;
		} else if (currClass == 'boolean') {
			if (value == 'true') {
				return value;
			} else if (value == 'false') {
				return value;
			}
			return 'ERROR';
		} else if (currClass == 'float') {
			if (!isNaN(value)) {
				return value;
			}
			return 'ERROR';
		} else if (currClass == 'integer') {
			if (!isNaN(value)) {
				if (value.indexOf('.') == -1) {
					return value;
				}
			}
			return 'ERROR';
		} else if (currClass == 'date') {
			if (isNaN(Date.parse(value))){
				return 'ERROR';
			}
			return value;
		} else {
			return 'ERROR';
		}
		return '';
	}
	this.buildFunction = function(value, subclasses, counter, varName){
		me=this;
		var funcStr = "";
		var varStr = "";
		var currClass = subclasses[0];
		var nextClass = subclasses[1];
		var lastClass = subclasses[subclasses.length-1];
		var objName = varName;
		var values;
		if(currClass == 'dict'){
			var arrType = "";
			var childType = "value";
			if(nextClass == 'dub'){
				arrType = "[][]";
				childType = "arr";
			}
			else if(nextClass == 'arr'){
				arrType = "[]";
				childType = "arr";
			}
			funcStr = objName + " = dict(\"" + lastClass + arrType + "\");\n";
			values = value.split("dictSep");
			for(var z = 1; z<=values.length; z++){
				var dictPair = values[z-1].split("=");
				var childName = objName + childType + z;
				funcStr = funcStr + me.buildFunction(dictPair[1], [nextClass, lastClass], z, varName);
				funcStr = funcStr + "put(" + varName + ", \"" + dictPair[0] + "\", " + childName + ");\n";
			}
		}
		else if(currClass == 'dub'){
			if(counter != ""){
				objName = objName + "arr" + counter;
			}
			funcStr = objName + " = " + lastClass + "[][];\n";
			values = value.split("dubSep");
			for(var x = 0; x<values.length; x++){
				vals = values[x].split("arrSep");
				for(var y = 0; y<vals.length; y++){
					if(lastClass == 'string'){
						varStr = "\"" + vals[y] + "\";\n";
					}
					else if(lastClass == 'date'){
						varStr = "strtojavadate(\"" + vals[y] + "\", \"yyyy/MM/dd HH:mm\");\n";
					}
					else{
						varStr = vals[y] + ";\n";
					}
					funcStr = funcStr + objName + "[" + x + "][" + y + "] = " + varStr;
				}
			}
		}
		else if(currClass == 'arr'){
			if(counter != ""){
				objName = objName + "arr" + counter;
			}
			funcStr = objName + " = " + lastClass + "[];\n";
			values = value.split("arrSep");
			for(var x = 0; x<values.length; x++){
				if(lastClass == 'string'){
					varStr = "\"" + values[x] + "\";\n";
				}
				else if(lastClass == 'date'){
					varStr = "strtojavadate(\"" + values[x] + "\", \"YYYY\MM\DD\");\n";
				}
				else{
					varStr = values[x] + ";\n";
				}
				funcStr = funcStr + objName + "[" + x + "] = " + varStr;
			}
		}
		else if(currClass == 'string'){
			if(counter != ""){
				objName = objName + "value" + counter;
			}
			funcStr = objName + " = \"" + value + "\";\n";
		}
		else if(currClass == 'date'){
			if(counter != ""){
				objName = objName + "value" + counter;
			}
			funcStr = objName + " = strtojavadate(\"" + value + "\", \"yyyy/MM/dd\");\n";
		}
		else{
			if(counter != ""){
				objName = objName + "value" + counter;
			}
			funcStr = objName + " = " + value + ";\n";
		}
		return funcStr;
	}
	this.build_test_script = function(params){
		var me = this;
		var paramType = params[0];
		var paramName = params[2];
		var paramClass = params[1];
		var n = 0;
		var utilText = "utilRet = util." + this.parameters['var_name'] + "(";
		var funcText = "";
		var reInput = "";
		var breaker = true;
		jQuery('#testScript :text', doc).each(function() {
			//if(breaker){
				input = this.value;
				paramClasses = paramClass[n].split("_");
				reInput = me.checkClass(input, paramClasses);
				if(reInput == "ERROR"){
					alert("Input for the parameter, " + paramName[n] + ", is invalid, please fix");
					//breaker = false;
					n++;
					return "";
				}
				funcText = funcText + me.buildFunction(reInput, paramClasses, "", paramName[n]);
				utilText = utilText + paramName[n] + ", ";
				n++;
			//}
		});
		if(reInput != "ERROR"){
			utilText = utilText.slice(0,-2) + ");\nreturn \"\";";
			funcText = funcText + utilText;
			jQuery('[name="testScript"]',doc).val(funcText);
			jQuery('#useScript',doc).attr('checked', true);
		}
	}
	/**
	 * actions
	 */
	//this.send_to_editor = function() {};
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
	this.faster = function () {
		//var frame = jQuery("#frame_bm_script", doc).contents().get();
		//jQuery("#container",frame).remove();
	}
}
content_bml_library.prototype = new BR_Content();
