/*
Using modal dialogs is a common design pattern with core apps. This helper does most of the work for you, including AODA compliance.

If includeModal is set to true in your project's package.json coreConfig, then this file will be included.
The method below is a static method of the cot_app (if your app is standalone) or CotApp (if your app is embedded) class.
Use it like this:

CotApp.showModal({title:'My Title', body: 'My Body'}); //embedded apps

cot_app.showModal({title:'My Title', body: 'My Body'}); //standalone apps

 */

$(function () {
  (window['cot_app'] || window['CotApp']).showModal = function (o) {
    /*
    If you have any apps that load content into a modal popup dynamically, read this comment:
    In a previous app, the content of the modal was inserted dynamically in the modal shown.bs.modal javascript event.
    It turns out that on iOS 9 or later, this prevents the user from being able to scroll down the screen.
    See this bug: https://github.com/twbs/bootstrap/issues/17695
    A solution looks something like this:
    $('#myModal').on('shown.bs.modal', function(){
      $('#myModal').css('overflow-y','hidden');
      //...
      //do some code to retrieve and insert dynamic content into .modal-body
      //...
      //after modal content is all there:
      $('#myModal').css('overflow-y','​auto');
    })
    This fixed the bug.
     */
    var options = $.extend({
      title: '', //An HTML string. The title of the modal
      body: '', //An HTML string. The body of the modal
      modalSize: '', //Optional, set to modal-lg or modal-sm to use modal size classes
      originatingElement: null, //Optional, an element (DOM or $-selected) to set focus to after the modal is closed, use for accessibility
      className: '', //Optional, a CSS class to put on the root div.modal element
      onShow: o['onShow'] || function () {
      }, //Optional, hook into boostrap modal events
      onShown: o['onShown'] || function () {
      },
      onHide: o['onHide'] || function () {
      },
      onHidden: o['onHidden'] || function () {
      }
    }, o);
    var id = 'modal_' + Math.random().toString().split('.')[1];
    var html = '<div class="modal fade ' + options.className + '" id="' + id + '" tabindex="-1" role="dialog" aria-labelledby="' + id + '_title" aria-hidden="true">' +
      '    <div class="modal-dialog ' + options.modalSize + '" role="document">' +
      '      <div class="modal-content">' +
      '        <div class="modal-header">' +
      '          <button type="button" aria-label="Close" class="close" type="button" data-dismiss="modal">' +
      '            <span aria-hidden="true">&times;</span>' +
      '          </button>' +
      '          <div role="header" id="' + id + '_title" class="modal-title">' + options.title + '</div>' +
      '        </div>' +
      '        <div id="' + id + '_body" class="modal-body">' + options.body + '</div>' +
      '        <div class="modal-footer">' +
      '          <button class="btn btn-default" type="button" data-dismiss="modal">Close</button>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>';
    $('body').append(html);
    var modalElement = $("#" + id);
    var headerCloseButton = modalElement.find('.modal-header button').first();
    var footerCloseButton = modalElement.find('.modal-footer button').first();
    modalElement.modal({show: false})
      .on('show.bs.modal', function () {
        options.onShow();
      })
      .on('shown.bs.modal', function () {
        headerCloseButton.focus();
        options.onShown();
      })
      .on('hide.bs.modal', function () {
        options.onHide();
      })
      .on('hidden.bs.modal', function () {
        options.onHidden();
        if (options.originatingElement) {
          options.originatingElement.focus();
        }
        modalElement.remove();
      })
      .modal('show')
      .attr('aria-hidden', false);
    headerCloseButton.on('keydown', function (e) {
      if ((e.which || e.keyCode) === 9 && e.shiftKey) {
        footerCloseButton.focus();
        return false;
      }
    });
    footerCloseButton.on('keydown', function (e) {
      if ((e.which || e.keyCode) === 9 && !e.shiftKey) {
        headerCloseButton.focus();
        return false;
      }
    });
  }
});
