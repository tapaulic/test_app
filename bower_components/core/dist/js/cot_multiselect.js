/*
Using the multiselect plugin (outside of CotForm usage) has some AODA-related pitfalls. This helper method solves those issues.

If includeMultiSelect is set to true in your project's package.json coreConfig, then this file will be included.
The method below is a static method of the cot_app (if your app is standalone) or CotApp (if your app is embedded) class.

Use it like this:

CotApp.addMultiselect('my_select_id', 'my_label_id', {}); //embedded apps

cot_app.addMultiselect('my_select_id', 'my_label_id', {}); //standalone apps

 */
$(function () {
  (window['cot_app'] || window['CotApp']).addMultiselect = function (o) {
    var options = $.extend({
      $select:'', //Required. The select element to make into a multiselect, as a jquery element
      ariaLabelledBy: '', //Required. The ID to use for the aria-labelledby property of the field
      ariaDescribedBy: '', //Optional. The ID(s) to use for the aria-describedby property of the field
      ariaRequired: false, //Optional. The value to use for the aria-required field
      multiselectOptions: {} //Optional. a set of options to use when creating the multiselect. see http://davidstutz.github.io/bootstrap-multiselect/#configuration-options
    }, o);
    var ods = options.multiselectOptions['onDropdownShown'] || function () {
      },
      odh = options.multiselectOptions['onDropdownHidden'] || function () {
      },
      oc = options.multiselectOptions['onChange'] || function () {
      };

    options.$select.multiselect($.extend(options.multiselectOptions, {
      onDropdownShown: function () {
        var parent = options.$select.parent().find('.btn-group');
        parent.find('button').attr('aria-expanded', true);
        var firstChecked = parent.find('ul li.active a');
        if (firstChecked.length === 0) {
          firstChecked = parent.find('ul li a');
        }
        firstChecked.first().focus();
        ods();
      },
      onDropdownHidden: function () {
        options.$select.parent().find('.btn-group button').attr('aria-expanded', false);
        odh();
      },
      onChange: function (option, selected) {
        if (selected && !options.$select[0].multiple) {
          options.$select.parent().find('.btn-group button').focus();
        }
        oc(option, selected);
      }
    }));

    var $ms = options.$select.parent().find('.btn-group');

    var listId = 'ms_popup_list_' + Math.random().toString().split('.')[1];
    $ms.find('button').attr({
      'aria-controls': listId,
      'aria-expanded': 'false',
      'aria-haspopup': 'true',
      'aria-labelledby': options.ariaLabelledBy,
      'aria-describedby': options.ariaDescribedBy
    });
    $ms.find('ul').attr({
      'id': listId,
      'aria-labelledby': options.ariaLabelledBy,
      'aria-describedby': options.ariaDescribedBy
    }).find('input').attr({
      'aria-required': options.ariaRequired,
      'aria-describedby': options.ariaDescribedBy
    });
  };
});
