// This is an object to manage the list of files that contain plugins.
/**
 * EXAMPLE
 * var list = br_plugin_files();
 * list.active(); // an array of active plugins
 *
 * list.subscribe("/path/to/plugin.brc.js", 1234, 3, true); // loads plugin from hard disk
 * list.refresh(); // reload all plugins into memory.
 */
var br_plugin_files = function(plugins, pm) {
  if(!plugins) {load_from_prefs()};

  // Store current list in preferences
  function save() {
    pm = pm || br_options.get_pref_manager(),
      str = JSON.stringify(plugins);
    pm.setCharPref("list_of_plugins",str);
  }

  // Build a list from preferences
  function load_from_prefs() {
    pm = pm || br_options.get_pref_manager(),
      paths = pm.getCharPref("list_of_plugins");

    if(!paths) {
      revert();
    } else {
      plugins = JSON.parse(paths);
      save();
    }
  }

  // Called to replace plugins from current plugin directory.
  // Will wipe out subscriptions.
  function revert(dir) {
    dir = dir || br_global.plugin_dir;

    var files = list_plugin_dir(dir);

    plugins = convert_to_plugins(files);

    save();
  }

  // Get new will compare the current plugin list to the list of plugins in the current 
  // plugin directory. It will remove any default plugins that are no longer in the directory,
  // add any additional plugins, and leave subscribed plugins alone.
  //
  // This is useful when performing an update, so that we can remove obsolete plugins and introduce
  // new features without disrupting users.
  function get_new(dir) {
    dir = dir || br_global.plugin_dir;

    var files = list_plugin_dir(dir),
      result = convert_to_plugins(files);

    // turn all paths into a || delimited string, for easy compare
    var current_paths = "";
    _(plugins).each(function(plugin) {
      current_paths += "||"+plugin.path+"||";
    });
    var new_paths = "";
    _(result).each(function(plugin) {
      new_paths += "||"+plugin.path+"||";
    });

    _(result).each(function(plugin) {
      // add paths that don't exist yet
      if(current_paths.indexOf("||"+plugin.path+"||") === -1) {
        plugins.push(plugin);
      }
    });

    var test_path;
    plugins = _(plugins).reject(function(plugin) {
      // remove any paths that don't exist anymore
      test_path = br_utils.create_local_file(plugin.path, true); //true means "quietly fail"
      if(test_path === false || test_path.exists() === false) {
        br_log.info("Removed plugin: " + plugin.path);
        return true;
      }
      return false;
    });

    save();
  }

  // Takes an array of file objects, and converts them into a plugin 
  // object that can be used to store and load plugins.
  function convert_to_plugins(files) {
    files = _(files).map(function(file) {
      var plugin = { 
            path: file.path, 
            file: file.leafName,
            def: true,
            active: true 
      };
      
      return plugin;
    });

    files = _(files).reject(function(file) {
      if(file.path.search(/\.brc\.js$/) === -1) {
        return true;
      }
    });
    
    return files;
  }

  // Subscribed plugins will have an id based on the URL they were downloaded from
  function find_by_id(id) {
    var idx = null;

    _(plugins).each(function(plugin, curr_idx) {
      if(plugin.id === id) {
        idx = curr_idx;
        return;
      }
    });

    return idx;
  }

  function find_by_id_and_file(id, file) {
    var idx = null;

    _(plugins).each(function(plugin, curr_idx) {
      if(plugin.id === id && plugin.file === file) {
        idx = curr_idx;
        return;
      }
    });

    return idx;
  }
  // Get list of active plugins
  function active() {
    return _(plugins).select(function(plugin) {
      return plugin.active === true; 
    });
  }

  // Subscribe will add a file to the list of active plugins. It will attempt
  // to replace any previous versions of the plugin that it finds.
  function subscribe(path, id, version, is_dev) {
    var new_path = br_utils.create_local_file(path),
      new_plugin = { active: true, 
          path: path, 
          file: new_path.leafName, 
          id: id, 
          version: version,
          is_dev: is_dev},
      existing = find_by_id(id);

    if(existing) {
      br_log.notify("Replaced plugin: " + new_plugin.file);
      plugins[existing] = new_plugin;
    } else {
      br_log.notify("Installed plugin: " + new_plugin.file);
      plugins.push(new_plugin);
    }

    save();
    refresh();
  }

  // Unsubscribe only removes the plugin from the preferences list; 
  // it doesn't touch the file on the hard disk.
  function unsubscribe(id) {
    if(id === null || id === undefined) {return;}
    plugins = _(plugins).reject(function(plugin) {
      if( plugin.id === id ) {
        br_log.notify("Removed plugin: "+ plugin.file);
        return true;
      }
    });
    
    save();
    refresh();
  }

  // Activate/deactive plugin
  function activation(id, file, val) {
    var idx = null;
    if(id) {
      idx = find_by_id(id);
    } else if (file) {
      idx = find_by_id_and_file(undefined, file);
    }

    if(idx !== null) {
      plugins[idx].active = val;
    }
    save();
  }

  function list_plugin_dir (directory) {
    var file,
    file = br_utils.create_local_file(directory, true);

    //we have to load chrome:// files, etc, differently than "C:\", etc.
    // https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO
    if(!file || !file.exists || !file.exists()) {
      file = br_utils.get_special_file("ProfD");

      //change directory to default plugin directory. I know, wtf.
      var plugin_d = "extensions/sangfroid@cpqsolutions.com/chrome/content/content_types";
      file = br_utils.append_all(file, plugin_d);
    } 
    // create file name from attributes supplied
    var res = br_utils.list_dir(file);
    return res;
  };

  // Reload all plugin info.
  function refresh() {
    br_init.run_all_plugin_tests();
  }

  var public_interface = {
    subscribe: function(path, id, version, is_dev) {subscribe(path, id, version, is_dev);},
    unsubscribe: function(id) {unsubscribe(id);},
    activate: function(id, file) { activation(id, file, true); },
    inactivate: function(id, file) { activation(id, file, false); },
    active: function() { return active(); },
    all: function() { return plugins; },
    by_id: function(id) { return plugins[ find_by_id(id) ]; },
    revert: function(dir) { revert(dir); },
    get_new: function(dir) { get_new(dir); },
    refresh: refresh
  };

  br_plugin_files = function() {return public_interface};

  return public_interface;
};
