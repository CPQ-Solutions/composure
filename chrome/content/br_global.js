// All globally available variables should be namespaced into this object.
var br_global = {};
br_global.dev_mode = false;
br_global.sangfroid_loaded = true;
br_global.sangfroid_active; 
br_global.sangfroid_version;
br_global.sangfroid_authenticated;
br_global.cgi_root = "";
br_global.local_root = "";
br_global.temp_dir = "";
br_global.text_editor = "";
br_global.username = "";
br_global.password = "";
br_global.urlauth = "";
br_global.faster = false;
br_global.remote_root = "";
br_global.init_cgi_path = "";
br_global.plugin_dir = "";
br_global.def_plugin_dir = "chrome://sangfroid/content/content_types/";
br_global.list_of_plugins = "";
br_global.hotbox = null;
br_global.hotbox_hotkey;
br_global.hotbox_modifier;
br_global.br_log;
br_global.log_prefix = "Sangfroid: ";
br_global.debug = false;
br_global.plugin_array = br_global.plugin_array || [];
br_global.on_network = false;
br_global.prod_sites = [];
br_global.pm;

br_global.hot_box = {};

if(window.content) {
  window.doc = window.content.document;
}
