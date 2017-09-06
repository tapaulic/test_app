'use strict';

var DemoForm = CotView.extend({
  initialize: function initialize() {},
  render: function render(container) {
    container.append(this.el);
    this._form = new CotForm(this.formDefinition());
    this._form.render({ target: this.el });
    this._form.setModel(this.model);
    return this;
  },
  formDefinition: function formDefinition() {
    return {
      id: this.id + '_cot_form',
      title: this.title,
      rootPath: '/resources/test_app/',
      success: function success() {
        bootbox.alert('Form submitted!');return false;
      },
      useBinding: true,
      sections: [{
        id: "sample_section",
        title: "Sample Section",
        rows: [{
          fields: [{
            type: 'html',
            id: 'html_field',
            html: 'You can include <strong>html</strong> content'
          }]
        }, {
          fields: [{
            id: 'text_field',
            title: 'Sample Text field',
            required: false,
            infohelp: 'info help text',
            prehelptext: 'pre help text',
            posthelptext: 'post help text',
            disabled: false,
            placeholder: 'placeholder',
            htmlAttr: { maxLength: 15 },
            bindTo: 'text_field_name'
          }]
        }, {
          fields: [{
            type: 'static',
            id: 'static_field',
            title: 'Sample Static Field',
            addclass: '',
            infohelp: 'Some info help',
            value: 'Sample static value'
          }]
        }, {
          fields: [{
            type: 'checkbox',
            id: 'checkbox_field',
            title: 'Sample Checkbox field',
            orientation: 'horizontal',
            addclass: 'additional-class',
            required: true,
            infohelp: 'help info',
            prehelptext: 'pre help text',
            posthelptext: 'post help text',
            disabled: false,
            bindTo: 'checkbox_field_name',
            choices: [{ text: 'One', value: 'one' }, { text: 'Two', value: 'two' }, { text: 'Three', value: 'three' }]
          }]
        }, {
          fields: [{
            type: 'radio',
            id: 'radio_field',
            title: 'Sample radio field',
            orientation: 'horizontal',
            addclass: 'additional-class',
            required: true,
            infohelp: 'help info',
            prehelptext: 'pre help text',
            posthelptext: 'post help text',
            value: 'one',
            disabled: false,
            bindTo: 'radio_field_name',
            choices: [{ text: 'One', value: 'one' }, { text: 'Two', value: 'two' }, { text: 'Three', value: 'three' }]
          }]
        }, {
          fields: [{
            id: 'postal_code_Field',
            title: 'Postal Code field',
            bindTo: 'postal_code',
            validationtype: 'PostalCode',
            placeholder: 'M#M#M#'
          }]
        }, {
          fields: [{
            id: 'phone_field',
            title: 'Sample Phone field',
            validationtype: 'Phone',
            bindTo: 'phone',
            placeholder: '333-333-3333'
          }]
        }, {
          fields: [{
            id: 'url_field',
            title: 'Sample URL field',
            'class': 'pull-right',
            validationtype: 'URL',
            bindTo: 'url',
            placeholder: 'http://www.com.com'
          }]
        }, {
          fields: [{
            id: 'email_field',
            title: 'Email field',
            validationtype: 'Email',
            bindTo: 'email'
          }]
        }, {
          fields: [{
            type: 'daterangepicker',
            id: 'date_range',
            title: 'Date Range',
            required: false,
            infohelp: 'x',
            prehelptext: 'y',
            posthelptext: 'z',
            value: 'x', //optional, the value or content of this field
            html: 'x', //optional, the html content, only applies when type=html
            disabled: false, //optional, defaults to false, only applies to fields that can be disabled
            placeholder: 'a'
          }]
        }, {
          fields: [{
            type: 'dropdown',
            id: 'dropdown_field',
            title: 'Dropdown field',
            addclass: 'additional-class', //optional, append to the auto-generated classes
            required: true, //optional, defaults to false
            infohelp: 'info', //optional, help text for the field, which is shown via a tooltip for an info icon
            prehelptext: 'pre', //optional, help text for the field which is always displayed, in front of the field
            posthelptext: 'post', //optional, help text for the field which is always displayed, after the field
            value: '', //optional, the value or content of this field
            html: 'html', //optional, the html content, only applies when type=html
            disabled: false, //optional, defaults to false, only applies to fields that can be disabled
            placeholder: 'placeholder', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
            bindTo: 'select_field_name',
            choices: [{ text: 'Select...', value: '' }, { text: 'One', value: 'one' }, { text: 'Two', value: 'two' }, { text: 'Three', value: 'three' }]
          }]
        }, {
          fields: [{
            type: 'multiselect',
            id: 'multiselect', //required, used to create the dom element id
            title: 'Multiselect', //required except for type=html|button|static|checkbox|radio, the title/label for the field
            className: 'col-xs-6', //optional, override the auto-generated css grid col classes, ex: col-xs-12
            orientation: 'horizontal', //optional, enum: ['horizontal','vertical']. default is vertical. this affects fields like radio
            addclass: 'additional-class', //optional, append to the auto-generated classes
            required: false, //optional, defaults to false
            infohelp: 'info', //optional, help text for the field, which is shown via a tooltip for an info icon
            prehelptext: 'pre', //optional, help text for the field which is always displayed, in front of the field
            posthelptext: 'post', //optional, help text for the field which is always displayed, after the field
            value: 'a', //optional, the value or content of this field
            html: 'html', //optional, the html content, only applies when type=html
            disabled: false, //optional, defaults to false, only applies to fields that can be disabled
            placeholder: 'placeh', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
            choices: [{ text: 'A', value: 'a' }, { text: 'B' }, { text: 'C' }], //required when type=radio||checkbox||dropdown||multiselect, an array of text/value pairs, text is required, but value is not (defaults to text)
            multiple: true //optional, defaults to false, only applies when type=multiselect, determines if multiple selection is allowed
          }]
        }, {
          fields: [{
            type: 'datetimepicker',
            id: 'datetimepicker_field', //required, used to create the dom element id
            title: 'DateTime', //required except for type=html|button|static|checkbox|radio, the title/label for the field
            orientation: 'horizontal', //optional, enum: ['horizontal','vertical']. default is vertical. this affects fields like radio
            addclass: 'additional-class', //optional, append to the auto-generated classes
            required: true, //optional, defaults to false
            infohelp: 'i', //optional, help text for the field, which is shown via a tooltip for an info icon
            prehelptext: 'e', //optional, help text for the field which is always displayed, in front of the field
            posthelptext: 'o', //optional, help text for the field which is always displayed, after the field
            value: '', //optional, the value or content of this field
            html: '', //optional, the html content, only applies when type=html
            disabled: false, //optional, defaults to false, only applies to fields that can be disabled
            placeholder: '??' //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
          }]
        }, {
          fields: [{
            type: 'textarea',
            id: 'textarea_field', //required, used to create the dom element id
            title: 'Text area', //required except for type=html|button|static|checkbox|radio, the title/label for the field
            orientation: 'horizontal', //optional, enum: ['horizontal','vertical']. default is vertical. this affects fields like radio
            addclass: 'additional-class', //optional, append to the auto-generated classes
            required: false, //optional, defaults to false
            infohelp: 'i', //optional, help text for the field, which is shown via a tooltip for an info icon
            prehelptext: 'e', //optional, help text for the field which is always displayed, in front of the field
            posthelptext: 'o', //optional, help text for the field which is always displayed, after the field
            value: 'val', //optional, the value or content of this field
            html: 'html', //optional, the html content, only applies when type=html
            disabled: false, //optional, defaults to false, only applies to fields that can be disabled
            placeholder: '?????', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
            cols: '50', //optional, when type=textarea this specifies the cols attribute
            rows: '10' //optional, when type=textarea this specifies the rows attribute
          }]
        }, {
          fields: [{
            type: 'password',
            id: 'password-field', //required, used to create the dom element id
            title: 'Password', //required except for type=html|button|static|checkbox|radio, the title/label for the field
            placeholder: '???', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
            htmlAttr: {}
          }]
        }, {
          grid: {
            id: 'grid', //an id for the grid
            add: true, //appears to not be in use
            title: 'grid title', //a title for the grid
            headers: [//an array of objects with title values, for the grid column headings
            { title: 'Heading 1' }, { title: 'Heading 2' }],
            fields: [//an array of fields within the current grid
            {
              id: 'grid_fld_one',
              title: 'Grid field one',
              validationtype: 'URL',
              required: true
            }, {
              id: 'grid_fld_two',
              title: 'Grid field two',
              required: true
            }]
          }
        }, {
          grid: {
            id: 'grid2', //an id for the grid
            add: true, //appears to not be in use
            title: 'grid2 title', //a title for the grid
            headers: [//an array of objects with title values, for the grid column headings
            { title: 'Heading 1' }, { title: 'Heading 2' }],
            fields: [//an array of fields within the current grid
            {
              id: 'grid2_fld_one',
              title: 'Grid field one',
              validationtype: 'URL',
              required: true
            }, {
              id: 'grid2_fld_two',
              title: 'Grid field two',
              required: true
            }]
          }
        }, {
          fields: [{
            type: 'button',
            id: 'button_field',
            title: 'Sample Button',
            onclick: function onclick() {
              bootbox.alert('You clicked a button');
              return false;
            }
          }]
        }]
      }]
    };
  }
});