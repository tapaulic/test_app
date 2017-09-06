var browser = navigator.userAgent;
var IEversion = 99;
IEversion = (browser.indexOf("MSIE") > 1) ? parseInt(browser.substr(browser.indexOf("MSIE") + 5, 5)) : IEversion;

/*
You can build forms with cot_form, but it is preferable to use CotForm (lower down in this file).
You shouldn't really use cot_form or any of its methods unless you really know what you are doing.
 */
var cot_form = function (o) {
  this.id = o.id; //the id to assign this form. this is used for the associated HTML form element id
  this.title = o.title; //if specified, an H2 is added to the top of the form with this text in it
  this.success = o.success; //a function to call after form validation passes

  //the absolute url path to the application's root folder
  // embedded example: '/resources/app_name/'
  // standalone example: '/webapps/app_name/'
  this.rootPath = o.rootPath;

  this.sections = [];
};

cot_form.addDefaultFieldProperties = function (fields) {
  cot_form.fixClassProperty(fields);
  (fields || []).forEach(function (fld) {
    fld.type = fld['type'] || 'text';
    fld.id = fld['id'] || Math.random().toString().split('.')[1];
    if ('html button static'.indexOf(fld.type) === -1 && !fld['title']) {
      console.warn('Missing title attribute for field ' + fld.id);
    }
    if (['radio', 'checkbox', 'dropdown', 'multiselect'].indexOf(fld.type) > -1 && !$.isArray(fld['choices'])) {
      throw new Error('Error in field ' + fld['id'] + ': choices property is missing or invalid');
    }
    if (fld.type === 'datetimepicker') {
      fld.options = $.extend({
        format: 'MM/DD/YYYY'
      }, fld.options);
    }
    if (fld.type === 'daterangepicker') {
      fld.options = $.extend({
        locale: {
          format: 'MM/DD/YYYY',
          separator: " - "
        }
      }, fld.options);
    }

  });
  return fields;
};
//class is a reserved keyword, it should never have been used, and is causing issues in IE now
//here we try fix any instances of usage of class instead of the newer className
cot_form.fixClassProperty = function (objectOrArray) {
  $.each($.makeArray(objectOrArray || []), function (i, o) {
    if (o['className'] === undefined && typeof o['class'] === 'string') { //this is a hack
      o['className'] = o['class'];
      delete o['class'];
    }
  });
}
var cot_section = function (o) {
  cot_form.fixClassProperty(o);
  this.id = o.id;
  this.title = o.title;
  this.className = o['className'];
  this.rows = [];
};

var cot_row = function (o) {
  this.fields = cot_form.addDefaultFieldProperties(o); //this is an array of raw javascript objects describing fields
  this.type = 'standard';
};

var cot_grid = function (o) {
  cot_form.fixClassProperty(o);
  this.id = (o.id || "") ? o.id : 'grid-' + Math.floor(Math.random() * 100000000);
  this.add = (o.add || "") ? true : false;
  this.className = o['className'];
  this.title = o.title;
  this.headers = o.headers;
  this.fields = cot_form.addDefaultFieldProperties(o.fields);
  this.type = 'grid';
};

cot_form.prototype.addSection = function (o) {
  if (!(o instanceof cot_section)) {
    o = new cot_section(o);
  }
  this.sections.push(o);
  return o;
};

cot_section.prototype.addRow = function (o) {
  if (!(o instanceof cot_row)) {
    o = new cot_row(o);
  }
  this.rows.push(o);
  return this;
};

cot_section.prototype.addGrid = function (o) {
  if (!(o instanceof cot_grid)) {
    o = new cot_grid(o);
  }
  this.rows.push(o);
  return this;
};

cot_form.prototype.render = function (o) {
  /*
   o = {
   target: '#element_id', //required. specify a css selector to where the form should be rendered
   formValidationSettings: {} //optional, when specified, the attributes in here are passed through to the formValidation constructor: http://formvalidation.io/settings/
   }
   */
  var app = this;
  var oVal = {fields: {}};
  var form = document.createElement('form');
  form.id = this.id;
  form.className = 'cot-form';
  form.setAttribute("data-fv-framework", "bootstrap");
  form.setAttribute("data-fv-icon-valid", "glyphicon glyphicon-ok");
  form.setAttribute("data-fv-icon-invalid", "glyphicon glyphicon-remove");
  form.setAttribute("data-fv-icon-validating", "glyphicon glyphicon-refresh");

  if (this.title || "") {
    var formHead = form.appendChild(document.createElement('h2'));
    formHead.textContent = this.title;
  }
  $.each(this.sections, function (i, section) {
    var oPanel = form.appendChild(document.createElement('div'));
    oPanel.id = section.id;


    oPanel.className = (section['className'] !== undefined) ? 'panel ' + section.className : "panel panel-default";
    if (section.title || "") {
      var oPanelHead = oPanel.appendChild(document.createElement('div'));
      oPanelHead.className = 'panel-heading';
      var oH3 = oPanelHead.appendChild(document.createElement('h3'));
      var oSpan = oH3.appendChild(document.createElement('span'));
      oSpan.className = "glyphicon glyphicon-th-large";
      oH3.appendChild(document.createElement('span'));
      oH3.textContent = section.title;
    }
    var oPanelBody = oPanel.appendChild(document.createElement('div'));
    oPanelBody.className = 'panel-body';

    $.each(section.rows, function (k, row) {
      var oRow = oPanelBody.appendChild(document.createElement('div'));
      oRow.className = 'row';
      if (row.type == 'grid') {
        app.processGrid(oRow, oVal, row);
      } else {
        $.each(row.fields, function (l, field) {
          app.processField(oRow, oVal, row, field);
        });
      }
    });
  });
  $(o.target).append(form);
  $.each(this.sections, function (i, section) {
    $.each(section.rows, function (k, row) {
      app.initializePluginsInRow(row);
    });
  });


  //INITIATE FORM VALIDATION
  var frm = $('#' + this.id);
  var options = $.extend({
    excluded: [':not(.multiselect):disabled', ':not(.multiselect):hidden', ':not(.multiselect):not(:visible)'], //exclude all hidden and disabled fields that are not multiselects
    feedbackIcons: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    onSuccess: this.success,
    onError: function (e) {
      console.log('Validation error occurred:', e);
      $($(".has-error input, .has-error select, .has-error button")[0]).focus();
    },
    fields: oVal.fields
  }, o['formValidationSettings'] || {});

  frm.formValidation(options)
    .on('err.field.fv', function (e) {
      $(e.target).closest('.form-group').find('input,select,textarea').attr('aria-invalid',true);
    })
    .on('success.field.fv', function (e, data) {
      $(e.target).closest('.form-group').find('input,select,textarea').attr('aria-invalid',false);
    });
  frm.find("button.fv-hidden-submit").text("hidden submit button");
  frm.find("button.fv-hidden-submit").attr("aria-hidden", true);

  app.fixFormValidationRender(frm);
};

cot_form.prototype.fixFormValidationRender = function (el) {
  el.find('i.form-control-feedback').attr('aria-hidden','true');
  //this will override feedback icon insertion into a wrong place after the form is rendered
  el.find("label.radioLabel>i, label.checkboxLabel>i").each(function () {
    var $this = $(this);
    $this.insertAfter($this.closest('fieldset').find('legend'));
  });
  el.find('div.datetimepicker').each(function(){
    //because the datetimepicker div.entryField also has .input-group class, the feedback icons are put in the wrong spot
    var $this = $(this);
    $this.parent().find('i.form-control-feedback').insertAfter($this.find('input'));
  });
};

cot_form.prototype.initializePluginsInRow = function (row, $container) {
  if (!$container) {
    $container = $('#' + this.id);
  }
  var that = this;
  $.each(row.fields, function (l, field) {
    switch (field['type']) {
      case 'multiselect':
        var $el = $container.find("." + field.id + ".multiselect");
        (window['cot_app'] || window['CotApp']).addMultiselect({
          $select: $el,
          ariaLabelledBy: $el.attr('aria-labelledby'),
          ariaDescribedBy: $el.attr('aria-describedby'),
          ariaRequired: $el.attr('aria-required'),
          multiselectOptions: field.options
        });

        break;
      case 'daterangepicker':
        $container.find(".daterangevalidation") //TODO: support multiple instances of daterangepicker
          .daterangepicker(field.options)
          .on('show.daterangepicker', function (ev, picker) {
            $($(picker)[0]).focus();
          });
        $('.daterangepicker').attr('aria-hidden',true);
        break;
      case 'datetimepicker':
        $container.find("." + field.id + ".datetimepicker")
          .datetimepicker(field.options)
          .on("dp.change", function () {
            var sName = $(this).attr("data-refid");
            $("#" + that.id).data('formValidation').updateStatus(sName, 'NOT_VALIDATED').validateField(sName);
          });
        break;
      default:
        if (field.validationtype === "Phone" && IEversion >= 10) {
          if (typeof that['rootPath'] !== 'string') {
            throw new Error('rootPath must be defined for cot form when using Phone fields');
          }
          $container.find('.phonevalidation').intlTelInput({
            utilsScript: that.rootPath + 'js/utils.js',
            autoPlaceholder: false,
            preferredCountries: ['ca']
          });
          $container.find('.flag-dropdown').attr('aria-hidden',true);
        }
    }

  });
  $container.find('[data-toggle="tooltip"]').tooltip({"html": true});
};

cot_form.prototype.processGrid = function (oRow, oVal, row) {
  var app = this,
    oBTN;
  var oGrid = oRow.appendChild(document.createElement('div'));
  oGrid.id = row.id;
  oGrid.className = 'grid-object table-responsive ';
  oGrid.className += row['className'] || '';
  oGrid.className += (row.addclass || '') ? " " + row.addclass : '';
  app[oGrid.id + "-index"] = 0;
  var oGridHead = oGrid.appendChild(document.createElement('h4'));
  oGridHead.className = 'grid-title';
  oGridHead.textContent = row.title;
  var oTable = oGrid.appendChild(document.createElement('table'));
  oTable.className = 'grid-table table table-striped';
  var oTR = oTable.appendChild(document.createElement('tr'));

  //ADD HEADERS
  $.each(row.headers, function (i, header) {
    var oTH = oTR.appendChild(document.createElement('th'));
    oTH.textContent = header.title;
    oTH.id = row.id + "_header_" + i;
  });
  //ADD AN EXTRA COLUMN WHICH WILL BE USED TO HOLD THE ADD/DELETE BUTTONS
  oTH = oTR.appendChild(document.createElement('th'));
  var oSpan = oTH.appendChild(document.createElement('span'));
  oSpan.className = "sr-only";
  oSpan.textContent = "Add/Remove Rows";

  //ADD FIRST ROW OF GRID
  oTR = oTable.appendChild(document.createElement('tr'));
  oTR.id = row.id + "-row-0";
  oTR.setAttribute('data-row-index', "0");
  var fieldDefinitions = {}; //used to get options when adding new rows dynamically
  $.each(row.fields, function (l, field) {
    var oFieldDiv = oTR.appendChild(document.createElement('td'));
    oFieldDiv.className = "form-group";
    oFieldDiv.className += (field.addclass || '') ? " " + field.addclass : '';
    field.grid = "0";
    field.gridlabel = row.id + "_header_" + l;
    if (l === 0) {
      var span = oFieldDiv.appendChild(document.createElement('span'));
      span.className = 'sr-only';
      span.id = 'row_sr_label_0';
      span.textContent = row.title + ' row 1';
    }
    app.addformfield(field, oFieldDiv);
    //create a validator specifically for the zero row.
    var tmpfieldId = field.id;
    field.id = "row[0]." + field.id;
    app.addfieldvalidation(oVal, field, oFieldDiv);
    field.id = tmpfieldId;
    fieldDefinitions[field.id] = field;
  });

  //ADD A FAKE REMOVE BUTTON AT THE END OF THE FIRST ROW
  var oTD = oTR.appendChild(document.createElement('td'));
  oTD.className = 'text-right';
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.className = 'btn btn-default grid-minus';
  oBTN.type = 'button';
  oBTN.disabled = true;
  oBTN.title = 'Remove this row from ' + row.title;
  oBTN.appendChild(document.createElement('span')).className = 'glyphicon glyphicon-minus';
  var oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.className = 'sr-only';
  oSpan.textContent = "Remove Row";

  //ADD GRID TEMPLATE THAT CAN BE USED TO CREATE NEW ROWS
  oTR = oTable.appendChild(document.createElement('tr'));
  oTR.id = oGrid.id + "-template";
  oTR.className = "hide";
  $.each(row.fields, function (l, field) {
    var oFieldDiv = oTR.appendChild(document.createElement('td'));
    oFieldDiv.className = "form-group";
    oFieldDiv.className += field.addclass ? " " + field.addclass : '';
    field.grid = "template";
    if (l === 0) {
      var span = oFieldDiv.appendChild(document.createElement('span'));
      span.className = 'sr-only';
      span.id = 'row_sr_label_template';
      span.textContent = row.title + ', row template';
    }
    app.addformfield(field, oFieldDiv);
  });

  //ADD A BUTTON AT THE END OF THE TEMPLATE ROW TO REMOVE A ROW FROM THE GRID
  oTD = oTR.appendChild(document.createElement('td'));
  oTD.className = 'text-right';
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.type = 'button';
  oBTN.className = 'btn btn-default grid-minus';
  oBTN.title = 'Remove this row from ' + row.title;
  oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.className = 'glyphicon glyphicon-minus';
  oSpan = oSpan.appendChild(document.createElement('span'));
  oSpan.className = 'sr-only';
  oSpan.textContent = 'Remove Row';

  //Add a 'new' button to the last row
  oTR = oTable.appendChild(document.createElement('tr'));
  oTD = oTR.appendChild(document.createElement('td'));
  oTD.colSpan = row.fields.length + 1;
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.className = 'btn btn-default pull-right grid-add';
  oBTN.type = 'button';
  oBTN.onclick = function () {
    app[oGrid.id + "-index"]++;
    var rowIndex = app[oGrid.id + "-index"];
    //CLONE THE TEMPLATE TO CREATE A NEW GRID ROW
    var $template = $('#' + oGrid.id + '-template');
    var $clone = $template
      .clone()
      .removeClass('hide')
      .attr('id', oGrid.id + '-row-' + rowIndex)
      .attr('data-row-index', rowIndex);
    var html = $clone.html();
    html = html.replace(/, row template/g, ', row ' + (parseInt(rowIndex) + 1));
    html = html.replace(/template/g, rowIndex);
    $clone.html(html);
    $clone.insertBefore($template);

    //ADD THE PROPER DELETE FUNCTION TO THE DELETE ROW BUTTON FOR THE NEW ROW
    $clone.find('.grid-minus').click(function () {
      var $row = $(this).closest('tr');
      $.each($row.find('.form-control'), function(i, item) {
        var $item = $(item);
        var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name');
        $('#' + app.id).formValidation('removeField', itemId);
      });
      var focusEl = $row.prev().find('input,select,textarea').first();
      $row.remove();
      focusEl.focus();
    });

    //ADD EACH FIELD IN THE NEW GRID ROW TO THE FORM VALIDATOR
    var arrNewFields = $clone.find('.form-control');
    $.each(arrNewFields, function (i, item) {
      var $item = $(item);
      var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name'); //this looks like rows[x].name
      var definition = fieldDefinitions[itemId.split('.')[1]];
      var validatorOptions = app.validatorOptions(definition);
      app.addValidatorMessageDiv(definition, validatorOptions, $item.closest('td')[0], rowIndex);
      $('#' + app.id).formValidation('addField', itemId, validatorOptions);
    });
    app.initializePluginsInRow(row,$clone);
    app.fixFormValidationRender($clone);
    $clone.find('input,select,textarea').first().focus();
  };
  oBTN.appendChild(document.createElement('span')).className = 'glyphicon glyphicon-plus';
  var oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.textContent = 'Add Row to ' + row.title;
};

cot_form.prototype.processField = function (oRow, oVal, row, field) {
  var intFields = row.fields.length;
  var oField = oRow.appendChild(document.createElement('div'));
  oField.id = field.id + 'Element';
  oField.className = field['className'] || ((intFields == 1) ? "col-xs-12" : (intFields == 2) ? "col-xs-12 col-sm-6" : (intFields == 3) ? "col-xs-12 col-md-4" : "col-xs-12 col-sm-6 col-md-3");
  oField.className += ' form-group form-group-';
  oField.className += field.orientation || 'vertical';
  oField.className += field.addclass ? " " + field.addclass : '';
  var oFieldDiv = oField.appendChild(document.createElement('div'));

  //LABEL
  if (['html', 'button'].indexOf(field.type) == -1) {
    var useLabel = ['static', 'checkbox', 'radio'].indexOf(field.type) === -1;
    if (useLabel || field.title) {
      var label = oFieldDiv.appendChild(document.createElement(useLabel ? 'label' : 'span'));
      label.className = useLabel ? 'control-label' : 'staticlabel' + (field.type != 'static' ? ' ' + field.type : '');
      if (useLabel) {
        label.htmlFor = field.id;
      }
      var titleSpan = label.appendChild(document.createElement('span'));
      titleSpan.textContent = field.title;
      if (!field.required && field.type != 'static') {
        var optionalLabel = label.appendChild(document.createElement('span'));
        optionalLabel.className = 'optional';
        optionalLabel.textContent = '(optional)';
      }
      if (field.infohelp) {
        var tooltip = label.appendChild(document.createElement('span'));
        tooltip.className = 'glyphicon glyphicon-info-sign';
        tooltip.setAttribute('data-toggle', 'tooltip');
        tooltip.setAttribute('data-placement', 'top');
        tooltip.tabIndex = 0;
        tooltip.title = field.infohelp;
      }
    }
  }
  this.addprehelptext(field, oFieldDiv);
  this.addformfield(field, oFieldDiv);
  this.addposthelptext(field, oFieldDiv);
  this.addfieldvalidation(oVal, field, oFieldDiv);

};

cot_form.prototype.addprehelptext = function (fieldDefinition, fieldContainer) {
  if (fieldDefinition['prehelptext']) {
    var oHelp = fieldContainer.appendChild(document.createElement('p'));
    oHelp.className = 'helptext';
    oHelp.id = 'prehelptext_' + fieldDefinition.id;
    oHelp.innerHTML = fieldDefinition.prehelptext;
  }
};
cot_form.prototype.addformfield = function (fieldDefinition, fieldContainer) {
  fieldContainer.appendChild(this.callFunction(this[fieldDefinition.type + 'FieldRender'], fieldDefinition, fieldContainer));
  if (fieldDefinition['prehelptext']) {
    //this only works after the field is in the DOM
    this.updateDescribedBy(fieldContainer, 'prehelptext_' + fieldDefinition.id);
  }
};

cot_form.prototype.addposthelptext = function (fieldDefinition, fieldContainer) {
  if (fieldDefinition['posthelptext']) {
    var oHelp = fieldContainer.appendChild(document.createElement('p'));
    oHelp.className = 'helptext';
    oHelp.id = 'posthelptext_' + fieldDefinition.id;
    oHelp.innerHTML = fieldDefinition.posthelptext;
    this.updateDescribedBy(fieldContainer, oHelp.id);
  }
};

cot_form.prototype.validatorOptions = function(fieldDefinition) {
  var validators = {};

  if (fieldDefinition.required) {
    validators.notEmpty = {
      message: fieldDefinition['requiredMessage'] || (fieldDefinition.title + ' is required and cannot be left blank')
    };
  }

  if (fieldDefinition.type === "datetimepicker") {
    validators.callback = {
      message: fieldDefinition['validationMessage'] || ('The date must be in the format ' + fieldDefinition.options.format),
      callback: function (value) {
        return (value === '' && !fieldDefinition.required) || moment(value, fieldDefinition.options.format, true).isValid();
      }
    };
  } else if (fieldDefinition.type === "daterangepicker") {
    validators.callback = {
      message: fieldDefinition['validationMessage'] || ('The dates must be in the format ' + fieldDefinition.options.locale.format + fieldDefinition.options.locale.separator + fieldDefinition.options.locale.format),
      callback: function (value) {
        var dates = value.split(fieldDefinition.options.locale.separator);
        return (value === '' && !fieldDefinition.required) ||
          (dates.length === 2 &&
            moment(dates[0], fieldDefinition.options.locale.format, true).isValid() &&
            moment(dates[1], fieldDefinition.options.locale.format, true).isValid());
      }
    };
  } else {
    switch(fieldDefinition.validationtype) {
      case 'Phone':
        validators.callback = {
          message: fieldDefinition['validationMessage'] || 'This field must be a valid phone number. (###-###-####)',
          callback: function (value, validator, $field) {
            if (IEversion < 10) {
              if (fieldDefinition.required || value !== "") {
                if (value.match(/\d{3}-?\d{3}-?\d{4}/) && value.match(/\d{3}-?\d{3}-?\d{4}/)[0] == value) {
                  $field.val(value.replace(/(\d{3})\-?(\d{3})\-?(\d{4})/, '$1-$2-$3'));
                  return true;
                } else {
                  return false;
                }
              } else {
                return true;
              }
            } else {
              return value === '' || $field.intlTelInput('isValidNumber');
            }
          }
        };
        break;
      case 'Email':
        validators.emailAddress = {message: fieldDefinition['validationMessage'] || 'The value is not a valid email address'};
        break;
      case 'URL':
        validators.uri = {message: fieldDefinition['validationMessage'] || 'The value is not a valid URL (http://xx.xx or https://xx.xx).'};
        break;
      case 'PostalCode':
        validators.regexp = {
          regexp: /^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$/i,
          message: fieldDefinition['validationMessage'] || 'This field must be a valid postal code'
        };
        break;
    }
  }
  return {
    validators: $.extend(validators, fieldDefinition['validators'] || {})
  };
};

cot_form.prototype.addfieldvalidation = function (formValidatorFields, fieldDefinition, fieldContainer) {
  //ADD VALIDATION
  var validatorOptions = this.validatorOptions(fieldDefinition);
  this.addValidatorMessageDiv(fieldDefinition, validatorOptions, fieldContainer, fieldDefinition['grid']);
  formValidatorFields.fields[fieldDefinition.id] = validatorOptions;
};

cot_form.prototype.addValidatorMessageDiv = function (fieldDefinition, validatorOptions, fieldContainer, gridRowIndex) {
  if (!$.isEmptyObject(validatorOptions.validators)) {
    var errorMessageDiv = fieldContainer.appendChild(document.createElement('div'));
    errorMessageDiv.id = 'fv_err_msg_' + Math.random().toString().split('.')[1] + '_' + (gridRowIndex || '');
    errorMessageDiv.className = 'fv-err-msg';
    this.updateDescribedBy(fieldContainer, errorMessageDiv.id);
    validatorOptions['err'] = '#'+errorMessageDiv.id;
  }
};

cot_form.prototype.updateDescribedBy = function(targetFieldContainer, fieldDescribedByElementId){
  var $fields = $(targetFieldContainer).find('input,textarea,select');
  var currentValues = $fields.attr('aria-describedby') ? $fields.attr('aria-describedby').split(' ') : [];
  $fields.attr('aria-describedby', currentValues.concat([fieldDescribedByElementId]).join(' '));
};

cot_form.prototype.callFunction = function (func) {
  var ret = func.apply(this, Array.prototype.slice.call(arguments, 1));
  return ret;
};

cot_form.prototype.staticFieldRender = function (field, oLabel) {
  var o = document.createElement('p');
  o.name = (field.grid || "") ? "row[0]." + field.id : field.id;
  o.textContent = field.value;
  return o;
};

cot_form.prototype.htmlFieldRender = function (field, oLabel) {
  var o = document.createElement('div');
  o.name = (field.grid || "") ? "row[0]." + field.id : field.id;
  o.innerHTML = field.html;
  return o;
};

cot_form.prototype.textFieldRender = function (field, oLabel, typeOverride) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('input'));
  if (field['htmlAttr']) {
    $(oField).attr(field['htmlAttr']);
  }
  oField.title = field.title;
  oField.type = typeOverride || 'text';
  oField.value = (field.value || "") ? field.value : '';
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  //SET THE REQUIRED FIELD DECLARATVE FORM VALIDATION ATTRIBUTES
  if (field.required) {
    oField.setAttribute("aria-required", "true");
    oField.className = 'form-control required';
  } else {
    oField.className = 'form-control';
  }

  if (field.validationtype == "Phone") {
    oField.className += " phonevalidation ";
  }
  oField.placeholder = (field.placeholder || "") ? field.placeholder : "";

  return o;
};

cot_form.prototype.passwordFieldRender = function (field, oLabel) {
  return this.textFieldRender(field, oLabel, 'password');
};

cot_form.prototype.radioFieldRender = function (field) {
  var o = document.createElement('fieldset');
  o.className = 'form-control';
  var oLegend = o.appendChild(document.createElement('legend'));
  oLegend.className = "sr-only";
  oLegend.textContent = "Select an option for " + (field.title || field.id);

  $.each(field.choices, function (m, choice) {
    var oDiv = o.appendChild(document.createElement('label'));
    oDiv.className = (field.orientation || '') ? field.orientation : 'vertical';
    oDiv.className += ' entryField radioLabel';
    var oField = oDiv.appendChild(document.createElement('input'));
    if (field.grid || "") {
      oField.name = "row[" + field.grid + "]." + field.id;
    } else {
      oField.name = field.id;
      oField.id = field.id + '_' + m;
    }
    if (field['required']) {
      oField.setAttribute('aria-required','true');
    }
    oField.type = 'radio';
    oField.className = (field.required || "") ? 'required' : '';
    oField.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oField.disabled = (field.disabled || "") ? "disabled" : false;
    if (field.value || "") {
      oField.checked = (field.value == oField.value) ? 'checked' : '';
    }
    oDiv.appendChild(document.createElement('span')).innerHTML = choice.text;
  });

  return o;
};

cot_form.prototype.checkboxFieldRender = function (field) {
  var o = document.createElement('fieldset');
  o.className = 'form-control';
  var oLegend = o.appendChild(document.createElement('legend'));
  oLegend.className = "sr-only";
  oLegend.textContent = "Select options for " + (field.title || field.id);

  $.each(field.choices, function (m, choice) {
    var oDiv = o.appendChild(document.createElement('label'));
    oDiv.className = (field.orientation || '') ? field.orientation : 'vertical';
    oDiv.className += ' entryField checkboxLabel';
    var oField = oDiv.appendChild(document.createElement('input'));
    if (field.grid || "") {
      oField.name = "row[" + field.grid + "]." + field.id;
    } else {
      oField.name = field.id;
      oField.id = field.id + '_' + m;
    }
    if (field['required']) {
      oField.setAttribute('aria-required','true');
    }
    oField.type = 'checkbox';
    oField.className = (field.required || "") ? 'required' : '';
    oField.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oField.disabled = (field.disabled || "") ? "disabled" : false;
    if (choice.selected || "") {
      oField.checked = "checked";
    }
    oDiv.appendChild(document.createElement('span')).innerHTML = choice.text;
  });

  return o;
};

cot_form.prototype.dropdownFieldRender = function (field) {
  var o = document.createElement('div');
  o.className = 'entryField dropdown-entry-field';
  var oField = o.appendChild(document.createElement('select'));
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.className = 'form-control';
  $.each(field.choices, function (m, choice) {
    var oOption = oField.appendChild(document.createElement('option'));
    oOption.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oOption.text = choice.text;
    if (field.value || "") {
      oOption.selected = (field.value == oOption.value) ? 'selected' : '';
    }
  });
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.multiselectFieldRender = function (field) {
  var o = document.createElement('div');
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('select'));
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.style.display = 'none';
  oField.setAttribute('aria-hidden', true);
  oField.className = 'form-control multiselect ' + field.id;
  oField.multiple = field.multiple ? 'multiple' : '';
  $.each(field.choices, function (m, choice) {
    var oOption = oField.appendChild(document.createElement('option'));
    oOption.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oOption.text = choice.text;
  });
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.daterangepickerFieldRender = function (field) {
  var o = document.createElement('div');
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('input'));
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.type = 'text';
  oField.value = (field.value || "") ? field.value : '';
  oField.className = (field.required || "") ? 'form-control required daterangevalidation' : 'form-control daterangevalidation';
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.datetimepickerFieldRender = function (field) {
  var o = document.createElement('div');
  o.className = 'input-group date entryField datetimepicker ' + field.id;
  o.setAttribute("data-refid", field.id);
  var oField = o.appendChild(document.createElement('input'));
  oField.type = 'text';
  if (field['required']) {
    oField.setAttribute("aria-required", "true");
    oField.className = 'form-control required';
  } else {
    oField.className = 'form-control';
  }
  oField.value = field['value'] || '';
  if (field['grid']) {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.className = 'form-control';
  var oSpan = o.appendChild(document.createElement('span'));
  oSpan.className = 'input-group-addon';
  oSpan.setAttribute('aria-hidden',true);
  oSpan = oSpan.appendChild(document.createElement('span'));
  oSpan.className = 'glyphicon ' + (field['glyphicon'] || 'glyphicon-calendar');

  oField.disabled = field['disabled'] ? "disabled" : false;
  return o;
};

cot_form.prototype.textareaFieldRender = function (field) {
  var o = document.createElement('div');
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('textarea'));
  if (field['htmlAttr']) {
    $(oField).attr(field['htmlAttr']);
  }
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", 'row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  if (field.cols) {
    oField.cols = field.cols;
  }
  if (field.rows) {
    oField.rows = field.rows;
  }
  oField.title = field.title;
  oField.type = 'text';
  oField.className += (field.required || "") ? 'form-control required' : 'form-control';
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  oField.placeholder = (field.placeholder || "") ? field.placeholder : "";
  oField.value = (field.value || "") ? field.value : '';
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.buttonFieldRender = function (field) {
  var o = document.createElement('button');
  o.type = 'button';
  if (field['className'] && !field['btnClass']) {
    //field['className'] should probably never have been applied here,
    //but to avoid a breaking change, we don't apply field['className'] if the newer field['btnClass'] is used
    o.className = field.className;
  } else {
    o.className = 'btn btn-' + (field['btnClass'] || 'success');
  }
  var oSpan = o.appendChild(document.createElement('span'));
  oSpan.className = (field.glyphicon || "") ? 'glyphicon ' + field.glyphicon : '';
  oSpan = o.appendChild(document.createElement('span'));
  oSpan.textContent = field.title;
  o.disabled = (field.disabled || "") ? "disabled" : false;
  $(o).on('click', field['onclick'] || function () {
    });
  return o;
};

function getFormValues(selector) {
  var aFields = $(selector).serializeArray();
  var aReturn = [];
  $.each(aFields, function (i, item) {
    if (JSON.stringify(item).indexOf("[template]") < 0) {
      aReturn.push(item);
    }
  });
  return aReturn;
}

/*
 CotForm is a class to supercede and wrap around cot_form.
 Example usage:
 var f = new CotForm(def); //see below about the def argument
 var app = new cot_app('my app');
 app.addForm(f, 'bottom');

 definition: a complete raw javascript object that defines a cot_form. ex:
 {
   //these first four are the same as the properties passed to new cot_form()
   id: 'my_form_id',
   title: 'My Form',
   rootPath: '/resources/my_app/',
   success: someFunctionDefinedSomewhereElse,

   useBinding: true, //defaults to false, set to true to use data binding with a CotModel object.
   //use in conjunction with the setModel method of CotForm and the bindTo attribute of field definitions

   sections: [ //an array of sections on the form
     {
       //these first three are the same as the properties passed to new cot_section()
       id: 'section_one',
       title: 'Section One',
       className: 'Some special class'

       rows: [ //an array of rows within the current section
         { //for each row, specify a grid OR an array of fields:
           fields: [ //an array of fields within the current row
             {
               type: '', //optional, enum: ['html', 'button', 'static', 'checkbox', 'radio', 'text' (default), 'daterangepicker', 'dropdown', 'multiselect', 'datetimepicker', 'textarea', 'password'], the type of field to add to the row
               id: 'field_one', //required, used to create the dom element id
               title: '', //required except for type=html|button|static, the title/label for the field
               className: 'col-xs-6', //optional, override the auto-generated css grid col classes, ex: col-xs-12
               //NOTE: if type=button, className is applied to button as well. if you DO NOT want this behaviour, you can explicitly specify the btnClass option below
               btnClass: 'success', //optional, only applies when type=button, defaults to 'success', determines the bootstrap btn-x class used to style the button, valid values are here: http://getbootstrap.com/css/#buttons-options
               orientation: 'horizontal', //optional, enum: ['horizontal','vertical']. default is vertical. this affects fields like radio
               addclass: 'additional-class', //optional, append to the auto-generated classes
               required: false, //optional, defaults to false
               requiredMessage: '', //optional, if required is set to true, this is used as the empty error message (instead of the default)
               infohelp: '', //optional, help text for the field, which is shown via a tooltip for an info icon, does not apply to type=html||button
               prehelptext: '', //optional, help text for the field which is always displayed, in front of the field
               posthelptext: '', //optional, help text for the field which is always displayed, after the field
               validators: {}, //optional, a validator object. see: http://formvalidation.io/validators/, ex: validators: {creditCard: {message: 'Invalid cc value'}}
                                //when required is true or validationtype is used or type is set to daterangepicker||datetimepicker, validators are auto-generated for you,
                                //but any validators that you specify here will override the auto-generated ones
               validationtype: 'Phone', //optional, enum: ['Phone', 'Email', 'URL','PostalCode'], if specified, this will automatically set the proper validators object
               validationMessage: '', //optional, when validationtype is used or type is set to daterangepicker||datetimepicker, this can be specified to override the default error message
               options: {}, //optional, a raw javascript object,
               //when type=daterangepicker||multiselect||datetimepicker, this is passed into the jquery constructor for the field
               //see http://davidstutz.github.io/bootstrap-multiselect/
               //see http://www.daterangepicker.com/
               //see http://eonasdan.github.io/bootstrap-datetimepicker/
               value: '', //optional, the value or content of this field
               html: '', //optional, the html content, only applies when type=html
               disabled: false, //optional, defaults to false, only applies to fields that can be disabled
               placeholder: '', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
               choices: [{text: '', value: ''}], //required when type=radio||checkbox||dropdown||multiselect, an array of text/value pairs, text is required, but value is not (defaults to text)
               multiple: false, //optional, defaults to false, only applies when type=multiselect, determines if multiple selection is allowed
               cols: '50', //optional, when type=textarea this specifies the cols attribute
               rows: '10', //optional, when type=textarea this specifies the rows attribute
               glyphicon: '', //optional, a glyphicon class (ex: glyphicon-minus), when type=button this can be set to add an icon to the button, when type=datetimepicker this can be set to override the default calendar icon
               onclick: function(){}, //optional, when type=button this specifies an onclick function
               htmlAttr: {} //optional, when type=text||password||textarea this can be used to pass a set of html attributes, which will be set on the input element using jquery's attr method
               bindTo: 'fieldname', //this is only available when using CotForm, specify the name or path of a field to bind to
               //this only works if type is one of: 'text', 'dropdown', 'textarea', 'checkbox', 'radio'
             }
           ]
         },
         {
          grid: {
             id: 'grid', //an id for the grid
             add: true, //appears to not be in use
             title: 'grid title', //a title for the grid
             headers: [ //an array of objects with title values, for the grid column headings
               {title: 'Heading 1'},
               {title: 'Heading 2'}
             ],
             fields: [ //an array of fields within the current grid
               {
                //the other properties in here are the same as the ones as listed just above
               }
             ]
           }
         }
       ]
     }
   ]
 }
 */
function CotForm(definition) {
  if (!definition) {
    throw new Error('You must supply a form definition');
  }
  this._isRendered = false;
  this._definition = definition;
  this._useBinding = definition['useBinding'] || false;
  this._model = null;
  this.cotForm = new cot_form({
    id: definition['id'] || 'new_form',
    title: definition['title'],
    rootPath: definition['rootPath'],
    success: definition['success'] || function () {
    }
  });
  var that = this;
  var bindableTypes = ['text', 'dropdown', 'textarea', 'checkbox', 'radio', 'password', 'multiselect'];
  $.each(definition['sections'] || [], function (i, sectionInfo) {
    var section = that.cotForm.addSection({
      id: sectionInfo['id'] || 'section' + i,
      title: sectionInfo['title'],
      className: sectionInfo['className']
    });
    $.each(sectionInfo['rows'] || [], function (y, row) {
      if (row['fields']) {
        row['fields'].forEach(function (field) {
          var type = field['type'] || 'text';
          if (field['bindTo'] && bindableTypes.indexOf(type) === -1) {
            throw new Error('Error in field ' + (field['id'] || 'no id') + ', fields of type ' + type + ' cannot use bindTo.');
          }
        });
        section.addRow(row['fields']);
      } else if (row['grid']) {
        section.addGrid(row['grid']);
      }
    });
  });
}

CotForm.prototype.render = function (options) {
  //options can be a string OR an object:
    //string: a css selector string of an element to append the form to, ex: '#my_form_container'
    //object: {
      //target: '#element_id', //required. a css selector string of an element to append the form to, ex: '#my_form_container'
      //formValidationSettings: {} //optional, when specified, the attributes in here are passed through to the formValidation constructor: http://formvalidation.io/settings/
    //}
  if (this._isRendered) {
    throw new Error('This form is already rendered');
  }
  if (typeof options == 'string') {
    options = {target: options};
  }
  this.cotForm.render(options);
  this._isRendered = true;
  if (this._useBinding) {
    if (this._model) {
      this._fillFromModel();
    }
    this._watchChanges();
  }
};

CotForm.prototype.setModel = function (object) {
  if (object && typeof object['get'] !== 'function') {
    throw new Error('Model must be a CotModel object');
  }
  this._model = object;
  this._fillFromModel();
};

CotForm.prototype._fillFromModel = function () {
  var form = this;
  if (this._isRendered) {
    (this._definition['sections'] || []).forEach(function (sectionInfo) {
      (sectionInfo['rows'] || []).forEach(function (row) {
        (row['fields'] || []).forEach(function (field) {
          //TODO: support grids
          if (field['bindTo']) {
            var value = form._model ? (form._model.get(field['bindTo']) || '') : '';
            switch (field['type']) {
              case 'radio':
              case 'checkbox':
                $.makeArray(value).forEach(function (val) {
                  var fld = $('input[name="' + field['id'] + '"][value="' + val + '"]');
                  if (fld.length) {
                    fld[0].checked = true;
                  }
                });
                break;
              case 'multiselect':
                $('#' + field['id']).multiselect('select', $.makeArray(value));
                break;
              default:
                $('#' + field['id']).val(value);
                break;
            }
          }
        });
      });
    });
  }
};
CotForm.prototype._watchChanges = function () {
  var form = this;
  if (this._isRendered) {
    (this._definition['sections'] || []).forEach(function (sectionInfo) {
      (sectionInfo['rows'] || []).forEach(function (row) {
        (row['fields'] || []).forEach(function (field) {
          //TODO: support grids
          if (field['bindTo']) {
            if (field['type'] == 'radio') {
              $('input[name="' + field['id'] + '"]').on('click', function (e) {
                if (form._model) {
                  form._model.set(field['bindTo'], $(e.currentTarget).val());
                }
              });
            } else if (field['type'] == 'checkbox') {
              $('input[name="' + field['id'] + '"]').on('click', function (e) {
                if (form._model) {
                  var value = $(e.currentTarget).val();
                  var values = $.makeArray(form._model.get(field['bindTo']) || []).slice();
                  var currentIndex = (values).indexOf(value);
                  if (e.currentTarget.checked && currentIndex == -1) {
                    values.push(value);
                  } else if (!e.currentTarget.checked && currentIndex > -1) {
                    values.splice(currentIndex, 1);
                  }
                  form._model.set(field['bindTo'], values);
                }
              });
            } else {
              $('#' + field['id']).on('change', function (e) {
                if (form._model) {
                  var newVal = $(e.currentTarget).val();
                  if (field['type'] === 'multiselect' && field['multiple'] && !newVal) {
                    newVal = [];
                  }
                  form._model.set(field['bindTo'], newVal);
                }
              });
            }
          }
        });
      });
    });
  }
};

/*
 A convenience method to get all of the current form data as a javascript object,
 where each key is the name of the field and each value is the value

 NOTE: this needs some help, since it is built on $.serializeArray, which does not get values for some empty fields (ex: radio buttons with no selected option)
 */
CotForm.prototype.getData = function () {
  var data = {},
    rowIndexMap = {}; // {stringIndex: intIndex}
  $.each($('#' + this.cotForm.id).serializeArray(), function (i, o) {
    if (o.name.indexOf('row[') !== -1) {
      var sRowIndex = o.name.substring(o.name.indexOf('[') + 1, o.name.indexOf(']'));
      if (sRowIndex !== 'template') {
        var rows = data['rows'] || [];
        var iRowIndex = rowIndexMap[sRowIndex];
        if (iRowIndex === undefined) {
          rows.push({});
          iRowIndex = rows.length - 1;
          rowIndexMap[sRowIndex] = iRowIndex;
        }
        rows[iRowIndex][o.name.split('.')[1]] = o.value;
        data['rows'] = rows;
      }
    } else {
      if (data.hasOwnProperty(o.name)) {
        data[o.name] = $.makeArray(data[o.name]);
        data[o.name].push(o.value);
      } else {
        data[o.name] = o.value;
      }
    }
  });
  return data;
};
