//setting defaults
pref("extensions.sangfroid.repo_dir", "");
pref("extensions.sangfroid.temp_dir", "");
pref("extensions.sangfroid.text_editor", "");
//pref("extensions.sangfroid.remote_repo", "http://firefox.bigmachines.com/repo");                         //MX
pref("extensions.sangfroid.username", "");
pref("extensions.sangfroid.password", "");
pref("extensions.sangfroid.active", true);
pref("extensions.sangfroid.faster", false);
pref("extensions.sangfroid.plugin_dir", "chrome://sangfroid/content/content_types/");
pref("extensions.sangfroid.default_plugins", true);
pref("extensions.sangfroid.list_of_plugins", '[{"default":true}]');
pref("extensions.sangfroid.curr_version", "0.1.3");
pref("extensions.sangfroid.new_version", "");
pref("extensions.sangfroid.hotbox_key", "32");
pref("extensions.sangfroid.hotbox_modifier", "none");
pref("extensions.sangfroid.open_attribute", true);
pref("extensions.sangfroid.open_action", "display");
pref("extensions.sangfroid.open_history_editor", false);
pref("extensions.sangfroid.open_document_editor", false);
pref("extensions.sangfroid.debug",false);
pref("extensions.sangfroid.on_network","");
pref("extensions.sangfroid.prod_sites","");

//proxy pref
pref("extensions.sangfroid.login_dest","admin");

//color theme
pref("extensions.sangfroid.color_main1", "#FFFFCC");
pref("extensions.sangfroid.color_main2", "#FFFFFF");
pref("extensions.sangfroid.color_text1", "#003366");
pref("extensions.sangfroid.color_text2", "#CEE700");
pref("extensions.sangfroid.color_text3", "#FFFFFF");
pref("extensions.sangfroid.color_hotbox1", "#212529");
pref("extensions.sangfroid.color_hotbox2", "#414E59");
pref("extensions.sangfroid.color_hotbox3", "#515E69");

// https://developer.mozilla.org/en/Localizing_extension_descriptions
pref("extensions.sangfroid@cpqsolutions.com.description", "chrome://sangfroid/locale/overlay.properties");

//hotbox prefs defaults
//panel 1
pref("extensions.sangfroid.hotbox_p1-r1-c1","Q~Commerce Quicklinks~custom~admin/commerce/quick_links.jsp?from_key_links=1~window");
pref("extensions.sangfroid.hotbox_p1-r1-c2","W~Config Quicklinks~custom~admin/configuration/quick_links.jsp?from_key_links=1~window");
pref("extensions.sangfroid.hotbox_p1-r1-c3","G~Global Script Search~custom~admin/scripts/search_script.jsp?gss=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r1-c4","D~Data Tables~data_table~~");

pref("extensions.sangfroid.hotbox_p1-r2-c1","U~Users~custom~admin/users/list_users.jsp?_bm_trail_refresh_=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r2-c2","R~Groups~custom~admin/groups/list_groups.jsp?_bm_trail_refresh_=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r2-c3","P~Parts~custom~admin/parts/manage_parts.jsp?_bm_trail_refresh_=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r2-c4","F~File Manager~custom~admin/filemanager/list_files.jsp?_bm_trail_refresh_=true~newtab");

pref("extensions.sangfroid.hotbox_p1-r3-c1","H~Home Page~custom~commerce/display_company_profile.jsp~newtab");
pref("extensions.sangfroid.hotbox_p1-r3-c2","B~BML Libraries~custom~admin/bmllib/list_functions.jsp?_bm_trail_refresh_=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r3-c3","O~Process Definition~custom~admin/commerce/processes/list_processes.jsp?_bm_trail_refresh_=true~newtab");
pref("extensions.sangfroid.hotbox_p1-r3-c4","C~Catalog Definition~custom~admin/configuration/admin_config.jsp?_bm_trail_refresh_=true~newtab");

//panel 2
pref("extensions.sangfroid.hotbox_p2-r1-c1","F~Header and Footer~custom~admin/ui/branding/edit_header_footer.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r1-c2","A~Admin Page~custom~admin/index.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r1-c3","H~Home Page Admin~custom~admin/homepage/setup_home_page.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r1-c4","W~Web Services~custom~admin/webservices/test_soap_api.jsp~newtab");

pref("extensions.sangfroid.hotbox_p2-r2-c1","T~Text Administration~custom~admin/ui/branding/list_site_text.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r2-c2","G~General~custom~admin/ui/branding/edit_site_settings.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r2-c3","P~XSL Templates~custom~admin/ui/branding/list_templated_pages.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r2-c4","L~Admin Logs~custom~adminaudit/view_admin_logs.jsp~newtab");

pref("extensions.sangfroid.hotbox_p2-r3-c1","D~Bulk Download~custom~admin/bulkservices/list_entities.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r3-c2","B~Bulk Download Status~custom~admin/bulkservices/list_download_status.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r3-c3","U~Bulk Upload~custom~admin/bulkservices/list_upload_files.jsp~newtab");
pref("extensions.sangfroid.hotbox_p2-r3-c4","S~Bulk Upload Status~custom~admin/bulkservices/list_upload_status.jsp~newtab");

//panel 3
pref("extensions.sangfroid.hotbox_p3-r1-c1","O~Open BigMachines Log in Editor~errors_editor~~");
pref("extensions.sangfroid.hotbox_p3-r1-c2","C~Commerce/Config Deployment Center~deployment_center~~");
pref("extensions.sangfroid.hotbox_p3-r1-c3","P~Proxy into Superuser from Service Login~proxy_in~~");
pref("extensions.sangfroid.hotbox_p3-r1-c4","M~Proxy Logout -> Proxy into Superuser~proxy_out~~");

pref("extensions.sangfroid.hotbox_p3-r2-c1","I~Quote: Copy BS_ID to Clipboard~bs_id~~");
pref("extensions.sangfroid.hotbox_p3-r2-c2","X~Quote: Copy BS_ID and Go to Printer Friendlies~printer_friendly~~");
pref("extensions.sangfroid.hotbox_p3-r2-c3","Y~Quote: Open History XML in Editor~editor_historyxml~~");
pref("extensions.sangfroid.hotbox_p3-r2-c4","Z~Quote: Open Document XML in Editor~editor_documentxml~~");

pref("extensions.sangfroid.hotbox_p3-r3-c1","B~Open Current Mapping File in Editor~editor_mappingfile~~");
pref("extensions.sangfroid.hotbox_p3-r3-c2","L~Log out of Site~custom~logout.jsp?_bm_trail_refresh_=true~currenttab");
pref("extensions.sangfroid.hotbox_p3-r3-c3","H~Quote: View History XML~view_historyxml~~");
pref("extensions.sangfroid.hotbox_p3-r3-c4","D~Quote: Show Document XML~view_documentxml~~");
