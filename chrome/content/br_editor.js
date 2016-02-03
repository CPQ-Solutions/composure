// This object is responsible for interfacing with the editor,
// as well as reading and writing to disk
/**
 * EXAMPLE
 * br_editor.launchEditor("directory/of/file", "filename.txt");
 */
var br_editor = {
  /**
   * @param {String} directory
   * @param {String} filename
   * @return {nsILocalFile} File object used for manipulating filesystem
   */
  // Initiate and return a new file object. File objects are used to represent files on the file system.
  createFileObject: function(directory, file_name) {
    try {
      var file = Components.classes["@mozilla.org/file/local;1"]
                   .createInstance(Components.interfaces.nsILocalFile);
      // create file name from attributes supplied
      file.initWithPath(directory);
      file.append(file_name);
    } catch (e) {
      br_utils.reportError("br_editor:Error creating file object.\nDir=" + directory +
      "\nfilename=" + file_name +":\n" + e);
    }

    return file;
  },
  /**
   * @param {String} editor Full absolute path to an executable text editor on the file system
   * @return {nsILocalFile} File object for manipulating the executable
   */
  // Used to point to a program - in this case, most likely our editor.
  createExecutableObject: function(editor, isOSX) {
    try {
      var executable = (Cc["@mozilla.org/file/local;1"]
              .createInstance(Ci.nsILocalFile));
      executable.followLinks = true;
      executable.initWithPath(isOSX ? "/usr/bin/open" : editor);
    } catch(e) {
      br_utils.reportError("br_editor:Error creating editor: " + editor +":\n" + e);
    }
    return executable;
  },
  /**
   * @param {nsILocalFile} file File object linked to a writable file on the filesystem
   * @param {String} value The content to be written to the file
   */
  writeToFile: function (file, value) {
    try {
    // file is nsIFile, data is a string
    var foStream = (Cc["@mozilla.org/network/file-output-stream;1"]
            .createInstance(Ci.nsIFileOutputStream));

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.
    value = br_utils.convertFromUnicode("utf-8", value);
    
    var res = foStream.write(value, value.length);
    foStream.close();
    } catch (e) {
      br_log.error("br_editor:Error writing to file:"+file.path +":\n"+e);
    }
    return res;
  },
  /**
   * @param {nsILocalFile} file The file to be removed
   */
  remove_file: function(file) {
    try {
      file.remove(false);
    } catch(e) {
      br_log.error("br_editor:Error removing file:"+file.path +":\n"+e);
    }
  },
  /**
   * @param {String} directory
   * @param {String} filename
   * @param {Boolean} safe_mode If true will not overwrite 
   */
  // Creates a new file on the disk, overwriting existing one if not in safe mode
  createFileOnDisk: function (directory, file_name, safe_mode, callback) {
    var file_name = file_name !== "unknown_file" ? file_name : prompt("We can't find a BigMachines script on this page. Provide filename:", "unknown_file");

    var file = br_editor.createFileObject(directory, file_name);

    if(file.exists()) {
      //don't do anything in safe_mode if the file exists
      if(safe_mode) { 
        return file; 
      }
      br_editor.remove_file(file);
    }
    
    try {
      file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
    } catch(e) {
      br_utils.reportError("br_editor:Error creating file:"+file.path +":\n"+e);
    }
    
    callback(file);
    return file;
  },
  /**
   * @param {nsILocalFile} executable File object linked to a text editor executable
   * @param {String} path Full local path of file to open
   */
  openTextEditor: function(executable, path, isOSX) {
    try {
      var process = (Cc["@mozilla.org/process/util;1"]
            .createInstance(Ci.nsIProcess));
      process.init(executable);
      var args = new Array();
      
      // handle mac
      if (isOSX) {
        args.push("-a", br_global.text_editor, path);
      } else {
        args[0] = path;
      }
    
      ret = process.run(false, args, args.length);
      return ret;
    } catch (e) {
      br_log.error("Error running editor: "+ e.fileName +":"+ e.message + " at line: " + e.lineNumber);
      return null;
    }
  },
  /**
   * Opens existing file in editor
   * @param {String} directory
   * @param {String} file_name
   * @return {nsILocalFile} The file object linking to the opened file
   */
  launchEditor: function (directory, file_name) {
    var editor = br_global.text_editor;
    // errorToLocalize
    if (!editor) {
      alert("Editor not configured. Choose an editor from the preferences page to use this feature.");
      br_utils.configure();
      return;
    }
    // For the mac, wrap with a call to "open".
    var isOSX = br_utils.get_os() === "Darwin" && editor.slice(-4) === ".app";
    
    var executable = br_editor.createExecutableObject(editor, isOSX);

    if (executable.exists()) {  
      var file = br_editor.createFileObject(directory, file_name);

      br_editor.openTextEditor(executable, file.path, isOSX);

      return file;
    }
    br_log.error(editor + " is not an executable");
    return null;
  },
  openContainingFolder: function(dir, file) {
    var folder = br_editor.createFileObject(dir, file);
    
    try {
      folder.reveal();
    } catch(e) {
      br_log.error("br_editor:Error opening folder.\nDir=" + directory + e);
    }
  },
  /**
   * @param {String} directory
   * @param {String} file_name
   * @param {String} value Content to be written to file
   * @return {Integer} Success code of write operation
   */
  // Creates a file on the disk, and then writes to it
  saveFileToDisk: function(directory, file_name, value, safe_mode) {
    var ret = 0; 

    br_editor.createFileOnDisk(directory, file_name, safe_mode, function(file) {
      ret = br_editor.writeToFile(file, value);
    });

    return ret;
  },
  /**
   * Creates a file on the disk, then writes to it, then opens in editor
   * @param {String} directory
   * @param {String} file_name
   * @param {String} value Content to be written to file
   */
  saveAndLaunch: function (directory, file_name, value) {
    br_editor.saveFileToDisk(directory, file_name, value);
    br_editor.launchEditor(directory, file_name);
  },
  /**
   * @param {String} directory
   * @param {String} file_name
   * 
   * @return {String} The value read from the file
   */
  readFile: function (directory, file_name) {
    var file = br_editor.createFileObject(directory, file_name);

    var fstream = (Cc["@mozilla.org/network/file-input-stream;1"]
             .createInstance(Ci.nsIFileInputStream));
    var sstream = (Cc["@mozilla.org/scriptableinputstream;1"]
             .createInstance(Ci.nsIScriptableInputStream));
    br_display.displayMessage("Reading file: "+file_name);
    fstream.init(file, -1, 0, 0);
    sstream.init(fstream);
    
    var value = "";
    
    // sstream is nsIScriptableInputStream
    var str = sstream.read(4096);
    var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
     getService(Components.interfaces.nsIUTF8ConverterService);
    while(str) {
      value += utf8Converter.convertURISpecToUTF8 (str, "UTF-8");
      str = sstream.read(4096);
    }
      
    sstream.close();
    fstream.close();
    return (value);
  }
};
