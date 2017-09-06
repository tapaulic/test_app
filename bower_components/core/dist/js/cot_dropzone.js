var CotDropzone = function(){

};

CotDropzone.prototype.render = function(o) {
  var options = $.extend({
    selector: '.dropzone', //the element to add the dropzone to
    url: '', //the url to upload files to
    allowImages: true, //allow image files to be uploaded
    allowDocuments: true, //allow document files to be uploaded
    maxFiles: 1, //how many files can be uploaded?
    onAdd: function (fileName, binId) { //a callback after a file is added
    },
    onRemove: function (fileName) { //a callback after a file is removed
    }
  }, o);

  Dropzone.autoDiscover = false;
  var acceptFiles = options.allowImages ? 'image/gif,image/GIF,image/png,image/PNG,image/jpg,image/JPG,image/jpeg,image/JPEG' : '',
    fileTypes = options.allowImages ? 'gif, png, jpg, jpeg' : '';

  if (options.allowDocuments) {
    acceptFiles += (acceptFiles ? ',' : '') + 'application/pdf,application/PDF,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    fileTypes += (fileTypes ? ', ' : '') + 'pdf, doc, docx';
  }

  $(options.selector).dropzone({
    url: options.url,
    dictDefaultMessage: "Drop files here or click to upload",
    acceptedFiles: acceptFiles,
    dictInvalidFileType: "Only following file types are allowed: " + fileTypes,
    addRemoveLinks: true,
    maxFilesize: 5,
    dictFileTooBig: "Maximum size for file attachment is 5 MB",
    maxFiles: options.maxFiles,
    dictMaxFilesExceeded: "Maximum " + options.maxFiles + " uploaded files",
    success: function (file, response) {
      var binID = (JSON.parse(response))['BIN_ID'];
      file.previewElement.classList.add("dz-success");
      options.onAdd(file.name, String(binID));
    },
    error: function (file, response) {
      file.previewElement.classList.add("dz-error");
      var errMsg = response;
      try {
        errMsg = JSON.parse(response)['err'];
      } catch (e) {
      }
      $(file.previewElement).find('.dz-error-message').text(errMsg);
    },
    removedfile: function (file) {
      options.onRemove(file.name);
      var _ref;
      if (file.previewElement) {
        if ((_ref = file.previewElement) !== null) {
          _ref.parentNode.removeChild(file.previewElement);
        }
      }
      return this._updateMaxFilesReachedClass();
    }
  });
};
