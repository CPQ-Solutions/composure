br_utils.create_plugin({
	'name' : 'integration xsl',
	'author' : 'Kenny Browne',
	'description' : 'Allows the plugin to work on the integration xsl page.',
	regex_urls : ['admin\/commerce\/integration\/edit_integration.jsp', '\/accounts\/edit_integration.jsp'],
	'get_parameters' : function (doc, jQuery) {
		var params = {};
		params.old_query_file_id = jQuery("input[name='old_query_file_id']", doc).attr("value");
		params.variable_name = jQuery("input[name='variable_name']", doc).attr("value");
		params.old_file_id = jQuery("input[name='old_file_id']", doc).attr("value");
		params.url = doc.location.href;
		return params;
	},
	/**
	 * @param doc - a dom object representing a web page
	 * @bool returns true if it tests the page against a list of parameters and finds a match
	 */
	'matches_page' : function (p) {
		var cond1 = (p['url'] || "").indexOf('admin\/commerce\/integration\/edit_integration.jsp') > -1;
		var cond2 = p['old_query_file_id'];
		var cond3 = p['variable_name'];
		var cond4 = p['old_file_id'];

		return (true);
	},
	'content' : content_integration_xsl
});

function content_integration_xsl(params) {
	var jQuery = this.jQuery,
	doc = this.doc;
	var me = this;
	//using this to keep commit from sending a blank file
	this.downloaded_script = "";
	this.parameters = params;
	var this_id = br_utils.urlParam("id");
	var process_id = jQuery("input[name='process_id']", doc).val();

	/**
	 * content and elements on page
	 */
	this.get_script_type = function () {
		return "printer friendly xsl";
	};

	this.get_script = function () {
		function callee(callback) {
			var url_text = me.parameters['url'];
			var end = url_text.indexOf(".com") + 5;
			url_text = url_text.substring(0, end);
			url_text += '/servlet/ImageServer?file_id=' + jQuery("#br_header_footer", doc).attr("value");

			jQuery.get(url_text, null, function (data, success) {
				var result = data;

				callback(result);
			}, 'html');
		};

		return callee;
	};
	/**
	 * File naming and directories
	 */
	this.get_filename = function () {
		var selectedFile = jQuery("#br_header_footer", doc).attr("value");
		var textarea = jQuery("#br_header_footer", doc).children("option[value='" + selectedFile + "']").html();
		var f = this.parameters['variable_name'] + "." + textarea;
		return this.filename_sanitize(f);
	};
	this.get_local_directory = function () {
		return 'XSL-ImageServer\\';
	};
	//this.get_remote_directory = function() {return REMOTE_ROOT + "\\" +  this.get_hostname();};

	this.get_extension = function () {
		return ".xsl";
	};

	/**
	 * Entry points
	 */

	/**
	 * actions
	 */

	this.read_from_file = function (restore_ext) {
		br_log.server("READ FROM FILE: integration xsls");
		restore_ext = restore_ext || "";

		var dir = this.get_temp_directory().path;
		var file_value = br_editor.readFile(dir, this.get_filename() + this.get_extension());
		var selectedFile = jQuery("#br_header_footer", doc).attr("value");
		var textarea = jQuery("#br_header_footer", doc).children("option[value='" + selectedFile + "']").html();
		if (textarea == 'SOAP') {
			selectedFile = "query_file";
		} else {
			selectedFile = "result_file";
		}
		jQuery('input[name=' + selectedFile + ']', doc).val(dir + '\\' + this.get_filename() + restore_ext + this.get_extension());

		jQuery('input[name=' + selectedFile + ']', doc).each(function () {
			br_display.show_success_effect(this);
		});
	};

	this.restore = function (url) {
		br_log.server("RESTORE: integration xsls");
		var restore_ext = ".restore";
		if (url) {
			jQuery.get(url, null, function (data) {
				// write contents of file
				var file_location = me.get_temp_directory();
				br_editor.saveFileToDisk(file_location.path, me.get_filename() + restore_ext + me.get_extension(), data.content);
				//read from file
				me.read_from_file(restore_ext);
			});
		}
	};

	this.on_page_load = function () {
		//this.initiate_display();
	};
	//this.read_from_file = function() {  };
	//this.faster = function();
	/**
	 * actions
	 **/

	this.related_links = function (level) {
		var url = me.get_hostname_prefix() + "admin/commerce/integration/list_related_actions.jsp?integration_id=" + this_id + "&process_id=" + process_id;
		jQuery.get(url, function (page_data) {
			br_log.page("", level, function () {
				jQuery("#br_current_notify_div", doc).append("<p>Related Actions:</p>");
				var search_doc = jQuery(page_data, doc);
				jQuery("a[href*='/admin/commerce/actions/edit_action.jsp?id=']", search_doc).each(function () {
					jQuery("#br_current_notify_div", doc).append(this);
					jQuery("#br_current_notify_div", doc).append("<br/>");
				});
			});
		});
	};

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
			.add_button_with_icon("br_refresh", "Reload Enhancements", "Reload",
				"chrome://sangfroid/content/img/ajax-loader.png", function () {
				me.make_notification();
			});
			return m;
	};

	this.make_notification = function () {
		var that = this;
		var url = params['url'] || "";
		var is_prod = br_utils.is_prod_site(url);
		var level = "";
		if (is_prod) {
			level = "prod";
		}
		that.related_links(level);
	};
	this.initiate_display = function () {
		this.make_notification();
		var m = this.get_menu();
		var opts = [{
				'id' : 'query_file',
				'value' : params.old_query_file_id,
				'label' : 'SOAP'
			}, {
				'id' : 'result_file',
				'value' : params.old_file_id,
				'label' : 'Parser'
			}
		];

		m.add_separator("br_sel_head", "Select File", "br_editing");
		m.add_dropdown("br_header_footer", opts, "br_editing");
		m.render();
	};

	//this.commit = function(commitMessage, do_prompt) {  }
	//this.open_script_in_editor = function() {}
	//this.initiate_display = function() {br_display.create_display_pane(true, this.get_script_type())};
}
content_integration_xsl.prototype = new BR_Content();
