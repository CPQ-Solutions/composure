br_utils.create_plugin({
	'name' : 'partner_org',
	'author' : 'aaron hall',
	'description' : 'run on partner org page',
	'regex_urls' : ['admin/company/list_external_companies.jsp'],
	/**
	 * @param {DOM} doc The document object of the page that we are testing against
	 * @return {Object} params A hashmap intended to hold information for identifying the page,
	 */
	'get_parameters' : function (doc) {
		var params = {};

		//params.url = doc.location.href;
		//params.title = jQuery("title", doc).html();

		return params;
	},
	/**
	 * @param {Object} params A hashmap, usually generated by get_parameters
	 * @return {Boolean} True if this plugin should be used on this page
	 */
	'matches_page' : function (params) {
		return true;
	},
	'content' : partner_org,
});
/**
 * @param {Object} params A hash map of information about the page
 * @extends BR_Content
 */
function partner_org(params) {
	var that = this;
	var IwantItbroken = false;
	this.faster = function () {
		IwantItbroken = true;
	}

	this.load_enhancements = function () {
		setTimeout(function () {
			if (IwantItbroken)
				that.convert_links();
		}, 100);
	};
	this.get_script_type = function () {
		return "partner_org";
	};
	this.get_filename = function () {};
	this.get_extension = function () {};
	this.get_local_directory = function () {};
	this.after_page_load = function () {
		this.initiate_display();
		this.load_enhancements();
	};

	this.convert_links = function () {
		var $list = jQuery("a[name='list']", doc);
		var $companies = jQuery("a[href*='edit_external_company.jsp']", doc);
		jQuery.each($list, function (i) {
			var this_id = /id=(.*)/g.exec($companies[i].href)[1];
			this.href = that.get_hostname_prefix() + "admin/users/list_users.jsp?company_id=" + this_id;
			jQuery(this).addClass("sangfroid_converted_link");
		});
		jQuery(".sangfroid_converted_link", doc).css({
			'color' : that.pm.getCharPref("color_text1"),
			'background-color' : that.pm.getCharPref("color_main1")
		});
	};
	this.get_menu = function () {
		var me = this;

		var m = br_menu(me.doc, me)
			.add_separator("br_tools", "Tools")
			.add_button_with_icon("br_refresh", "Reload Enhancements", "Reload",
				"chrome://sangfroid/content/img/ajax-loader.png", function () {
				me.load_enhancements();
			});
		if (!IwantItbroken) {
			m.add_button_with_icon("br_convert", "Convert Links", "Convert",
				"chrome://sangfroid/content/img/html.png", function () {
				me.convert_links();
			});
		}
		return m;
	};
}
partner_org.prototype = new BR_Content();