function querystring(key) {
    var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
    var r=[], m;
    while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
    return r;
}

function changeFontSize(newVal, reset) {
    if (reset) {
        deleteCookie('fontsize');
    } else {
        setCookie('fontsize', newVal);
    }
    $('body').css('font-size', newVal);
    $('#increaseFontSize')[0].disabled = newVal == '1.5em';
    $('#decreaseFontSize')[0].disabled = newVal == '.7em'

    if ($.isFunction(window["setPageTabHeight"])) {
        setPageTabHeight();
    }
    setConsistentHeight(".tabNavigation", ".nav-tabs a");
    setConsistentHeight(".carousel", ".item");
    if (typeof($gallery) != "undefined") {
        $gallery.flickity('resize');
        setConsistentHeightHP(".r5", ".linkBoxInside");
    }
}
function increaseFontSize() {
    var val = getCookie('fontsize') || '1.1em';
    changeFontSize(Math.min(parseFloat(val) + 0.1, 1.5) + 'em');
}

function decreaseFontSize() {
    var val = getCookie('fontsize') || '.9em';
    changeFontSize(Math.max(parseFloat(val) - 0.1, 0.7) + 'em');
}

function resetFontSize() {
    changeFontSize('1em', true);
}

function applyFontSize() {
    var val = getCookie('fontsize');
    if(val) {
        changeFontSize(val);
    }
}

function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000))
    document.cookie = key + '=' + value + ';path=/;expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

function deleteCookie(key) {
    document.cookie = key + '=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

function gglTranslate(key) {
    var oURL;
    if (document.referrer!="") {oURL=encodeURIComponent(document.referrer);} else {oURL="https%3a%2f%2fwww1.toronto.ca%2f";}
    document.location.href="https://translate.google.com/translate?u=" + oURL + "&sl=en&tl=" + key + "&hl=en&ie=UTF-8";
}
function translatePage() {
    document.location.href = "/wps/portal/contentonly?vgnextoid=4be8b9bd23805410VgnVCM10000071d60f89RCRD&vgnextchannel=8e79f9be8db1c310VgnVCM1000006cd60f89RCRD";
}
function setConsistentHeight(strParentSelector, strChildSelector) {
    var itemsParent = $(strParentSelector);
    var heights = [];
    var tallest;

    itemsParent.each (
        function () {
            var items = $(this).find(strChildSelector);
            if (items.length) {
                items.each( function () {$(this).css('height','auto'); });
                items.each( function () { heights.push($(this).height()); });
                tallest = Math.max.apply(null, heights) + 10;
                items.each( function () {$(this).css('height',tallest + 'px'); });
            }
        })
}

function dismissLD() {
    document.cookie = "lddismiss=true; path=/";
}

function processLDResponse(data) {
    if (data.items.title=="Notice") {
        var sModal = '<div class="modal fade" tabindex="-1" role="dialog" id="ldModal" style="z-index: 9999999;"><div class="modal-dialog"><div class="modal-content">';
        sModal += '<div class="modal-header">';
        sModal += '<h4 class="modal-title">' + data.items.title + '</h4></div><div class="modal-body"><p>' + data.items.summary + '</p></div>'
        sModal += '<div class="modal-footer" style="text-align: center;"><button onclick="dismissLD();" type="button" class="btn btn-primary" data-dismiss="modal">Continue</button>';
        sModal += '</div></div></div></div>';
        $( "body" ).append( sModal );
        $( ".modal a").css('text-decoration', 'underline');
        $('#ldModal').modal({backdrop: false});
    }
}

$(function() {

    if (querystring("tab")!="") {
        if ($(".tabNavigation").length>0) {
            $(".tabNavigation ul.nav li.active").removeClass("active");
            $(".tabNavigation .tab-content .tab-pane.active").removeClass("active");
            var strSelector = ".tabNavigation ul.nav li:eq(" + parseInt(querystring("tab")) +")";
            $(strSelector).addClass("active");
            strSelector = ".tabNavigation .tab-content .tab-pane:eq(" + parseInt(querystring("tab")) +")";
            $(strSelector).addClass("active");
        }
    }

});

var cot_app = function(sName, options) {
    this.name = sName;
    //configurable options:
    $.extend(this,{
        hasHeader: true, //set to false to hide the main corporate header portion of the app interface
        hasFooter: true, //set to false to hide the main corporate footer portion of the app interface
        hasContentTop: true, //set to false if you don't need this portion of the content area
        hasContentBottom: true, //set to false if you don't need this portion of the content area
        hasContentRight: true, //set to false if you don't need this portion of the content area
        hasContentLeft: true, //set to false if you don't need this portion of the content area
        hasLeftNav: false, //set to true if you want to have a left hand navigation area
        searchcontext: 'INTER' //set the search context of this app, allowable values: 'INTER', 'INTRA', '311'
    }, options || {});

    this.data = {};
    this.forms = {};
    this.breadcrumbItems = [];
    this.isRendered = false;
};

cot_app.prototype.setTitle = function(title) {
    $("#app-header h1").html(title);
};

cot_app.prototype.setBreadcrumb = function (items, excludeAppName) {
	//items: an array of raw javascript objects that define breadcrumb items, supported properties are:
	    //link: if specified, the breadcrumb item will be a link to this URL
        //      NOTE: the last item is never a link
        //name: required, the title of the breadcrumb item
    //excludeAppName: By default, the app name is automatically set as the last breadcrumb item. Set this to true if you do not want that to happen

    this.breadcrumbItems = items;
    if (!excludeAppName) {
        this.breadcrumbItems.push({name: this.name});
    }
    this._renderBreadcrumb();
    return this;
}

cot_app.prototype._renderBreadcrumb = function() {
    var container = $("#app-breadcrumb");
    if (container.length) {
        if (this.breadcrumbItems.length) {
          var rootUrl = this.searchcontext === 'INTER' ? 'https://www1.toronto.ca' : 'http://insideto.toronto.ca';
          var rootTitle = this.searchcontext === 'INTER' ? 'City of Toronto' : 'InsideTO';
            var itemsHtml = '<li><a href="' + rootUrl + '"><span class="glyphicon glyphicon-home" style="margin-right: 5px;"></span>' + rootTitle + '</a></li>';
            var lastIndex = this.breadcrumbItems.length - 1;
            $.each(this.breadcrumbItems, function(i,item) {
                if (item['name']) {
                    var link = item['link'] && i < lastIndex ? '<a href="' + item.link + '">' + item.name + '</a>' : item.name;
                    itemsHtml += '<li>' + link + '</li>';
                }
            });
            container.find('ol.breadcrumb').html(itemsHtml);
            container.show();
        } else {
            container.hide();
        }
    }
};

cot_app.prototype.loadContent = function(o) {
	var app = this;
	$.ajax({
		url: o.url,
		type: (o.type||"")?o.type:"GET",
		cache: (o.cache||"")?o.cache:"true",
		dataType: (o.dataType||"")?o.dataType:"jsonp",
		success: function(data) {
			data = (o.skiproot||"") ? (o.skiproot) ? data = data[0] : data : data;
			$.each(data.items, function(i, item) {
				app.data[item.title] = item.summary;
			});
			if (o.success||"") {o.success(data);} else {return app;}
		},
		error: function(jqXHR,textStatus,errorThrown ) {
			if (o.error||"") {o.error();} else {alert("Error: The application was unable to load data.")};
		}
	});
}

cot_app.prototype.getTeaserModal = function(o) {
	var sReturn="";
	if ((o.title||"") && (o.body||"")) {
		sReturn += '<p><button ';
		sReturn += (o.btnclass||"") ? 'class="' + o.btnclass + '" ' :"";
		sReturn += 'onclick="$(\'#teaserModal\').modal()">' + o.title + '</button></p>';
		sReturn += '<div class="modal fade" id="teaserModal" tabindex="-1" role="dialog" aria-labelledby="teaserModalLabel" aria-hidden="true">';
			sReturn += '<div class="modal-dialog">';
				sReturn += '<div class="modal-content">';
					sReturn += '<div class="modal-header"><button class="close" type="button" data-dismiss="modal"> <span aria-hidden="true">&times;</span> <span class="sr-only">Close</span></button>';
						sReturn += '<h2 id="teaserModalLabel" class="modal-title">' + o.title + '</h2>';
				sReturn += '</div>';
				sReturn += '<div id="teaserModalBody" class="modal-body">' + o.body + '</div>';
					sReturn += '<div class="modal-footer">';
						sReturn += '<button class="btn btn-default" type="button" data-dismiss="modal">Close</button>';
				sReturn += '</div></div></div></div>';
	} else {
		sReturn += "<p class='hasError'>Error!</p>";
	}
	return sReturn;
}

cot_app.prototype.getTeaserStandard = function(o) {
	var sReturn="";
	if (o.modal||"") {
		sReturn += (o.modal && (o.title||"") && (o.body||"")) ? this.getModalHTML(o.title,o.body) : "";
	} else {
		sReturn += (o.title||"") ? "<div class='componentTitle'><h2>" + o.title + "</h2></div>" : "";
		sReturn += (o.body||"") ? "<div class='article media componentBody'>" + o.body + "</div>" : "";
	}
	return sReturn;
}
cot_app.prototype.render = function(onAfterRender) {
  if (this.isRendered) {
    throw new Error('App is already rendered');
  }
	var ad=document.createElement('div');
	ad.id="appDisplay";
	$("#appDisplay").addClass("hide");
	$("body").append(ad);

	var app=this;
	$("#appDisplay").load("html/cot_template_page.html #cot-template-page", function(responseText, textStatus, req) {
		app.setTitle(app.name);
		app._renderBreadcrumb();

        //SET UP SEARCH WITH THE PROPER INTER CONTEXT
        switch (app.searchcontext) {
            case "INTRA":
                //SET UP SEARCH WITH THE PROPER 311 INTRA CONTEXT
                $("#siteSearchGSA").attr("action", "http://insideto-search.toronto.ca/search");
                $("#siteSearchGSA #q").attr("placeholder", "Search Inside Toronto...");
                $("#sf_client").val("insideto-search");
                $("#sf_proxystylesheet").val("insideto-search");
                $("#sf_site").val("InsideTO-All");
              $(".sf_311").remove();
                break;

            case "311":
                //SET UP SEARCH WITH THE PROPER 311 INTRA CONTEXT
                $("#siteSearchGSA").attr("action", "http://insideto-search.toronto.ca/search");
                $("#siteSearchGSA #q").attr("placeholder", "Search the 311 Knowledge Base...");
                $("#sf_client").val("311KBSTAFF");
                $("#sf_proxystylesheet").val("311KBSTAFF");
                $("#sf_site").val("311KB");
                break;

          default:
                    $("#siteSearchGSA").attr("action", "http://search.toronto.ca/search");
                    $("#siteSearchGSA #q").attr("placeholder", "");
                    $("#sf_client").val("Toronto");
                    $("#sf_proxystylesheet").val("_common_");
                    $("#sf_site").val("TorontoWebsite");
                    $(".sf_311").remove();

        }

		if (app.hasLeftNav) {
            $("#app-nav-left").removeClass("hide");
            $("#app-content-full").addClass("col-sm-9");
        } else {
            $("#app-nav-left").remove();
        }
		if(!app.hasHeader) {$("#cot-header").remove();$("#app-header").remove();}
		if(!app.hasFooter) {$("#app-footer").remove();}
		if(!app.hasContentTop) {$("#app-content-top").remove();}
		if(!app.hasContentRight) {
            $("#app-content-left").removeClass('col-md-8');
            $("#app-content-right").remove();
        }
		if(!app.hasContentLeft) {$("#app-content-left").remove();}
		if(!app.hasContentBottom) {$("#app-content-bottom").remove();}
        applyFontSize()
		$("#appDisplay").removeClass("hide");
		app.isRendered = true;
		onAfterRender();
	});
	return this;
}

//TERMS AND CONDITIONS
cot_app.prototype.showTerms = function (termsText, disagreedText, agreedCookieName, containerSelector, onAgreed, agreementTitle) {
	var app = this,
		args = arguments;
	if (getCookie(agreedCookieName) != "agree") {
		$(containerSelector).load("html/cot_template_terms.html #cot-template-terms", function(responseText, textStatus, req) {
		  var title = agreementTitle || 'Terms of Use Agreement';
			$("#cot-terms-title h2").html(title);
			$("#cot-terms-body").html(termsText);
			$("#cot-terms-agree").click(function() {
				//dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Agree');
				setCookie(agreedCookieName,"agree");
				onAgreed();
			});
			$("#cot-terms-disagree").click(function() {
				//dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Disagree');
				$(containerSelector).load("html/cot_template_terms.html #cot-template-terms-disagree", function(responseText, textStatus, req) {
					$("#cot-terms-return").text(title).click(function() {app.showTerms.apply(app,args)});
          $("#cot-terms-homepage").click(function() {document.location = 'https://web.toronto.ca'});
					$("#cot-terms-body").html(disagreedText);
					$("#cot-terms").removeClass("hide");
				});
			});
			$("#cot-terms").removeClass("hide");
		});
	} else {
		onAgreed();
	}
};

//UTILTIES
function formatDate(strDate) {
	var arrMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var yyyy = strDate.substring(0,4);
	var mm = strDate.substring(5,7);
	var dd = parseInt(strDate.substring(8,10));
	var strNew = arrMM[parseInt(mm) - 1] + " " + dd + ", " + yyyy;
	return strNew;
}

cot_app.prototype.setNOC = function (sHTML) {
    $("#nocModalBody").html(sHTML);
}
cot_app.prototype.showNOC = function () {
    $("#nocModal").modal();
}

/*
A convenience method for writing HTML into the app content area.
options: a javascript object with one or more of the keys 'top', 'right', 'bottom', 'left', 'nav' set to an HTML string to insert into that content area
 ex: {top: '<div>some html for the top area</div>'}
 */
cot_app.prototype.setContent = function (options) {
    var app = this;
    $.each(['top', 'right', 'bottom', 'left', 'nav'], function (i, value) {
        if (options[value] !== undefined) {
            $(app.getContentContainerSelector(value)).html(options[value]);
        }
    });
}

/*
A convenience method for inserting a cot_form object into the app content area.
cotForm: a CotForm object
 area: a string with one of five possible values: 'top', 'right', 'bottom', 'left', 'nav'
replaceCurrentContent: defaults to true, specify false if the form should be appended into the content instead of replacing it
 */
cot_app.prototype.addForm = function (cotForm, area, replaceCurrentContent) {
    replaceCurrentContent = (replaceCurrentContent === undefined) ? true : replaceCurrentContent;

    if (replaceCurrentContent) {
        var clear = {};
        clear[area] = '';
        this.setContent(clear);
    }
    cotForm.render({
        target: this.getContentContainerSelector(area)
    });
}

/*
A convenience method for getting the jquery selector of a given app content area
area: a string with one of five possible values: 'top', 'right', 'bottom', 'left', 'nav'
 */
cot_app.prototype.getContentContainerSelector = function (area) {
    return area == 'nav' ? '#app-nav-left' : '#app-content-' + area;
}


