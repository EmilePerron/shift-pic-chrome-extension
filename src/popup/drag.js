'use strict';

/*
 * /popup/drag.js
 * ...
 */

document.addEventListener('dragover', function(e) {
    e.preventDefault();
    document.querySelector('#drag-overlay').classList.add('visible');
});

document.addEventListener('mouseout', function() {
    document.querySelector('#drag-overlay').classList.remove('visible');
});

document.querySelector('#drag-overlay').addEventListener('drop', function(e) {
    e.preventDefault();

    let imageFile = null;

    for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
            imageFile = e.dataTransfer.items[i].getAsFile();
            break;
        }
    }

    if (!imageFile) {
        Flash.show('error', chrome.i18n.getMessage('error_invalid_file'));
        return;
    }

    window.imageFile = imageFile;
    window.imageUrl = '';
    window.imageUnsplashId = '';

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!(/^data:image\/.+/.test(e.target.result)) && !(/^data:application\/octet-stream;.+/.test(e.target.result))) {
            Flash.show('error', chrome.i18n.getMessage('error_invalid_file'));
        } else {
            document.querySelector('#tab-upload .image-preview img').src = e.target.result;
            document.querySelector('#drag-overlay').classList.remove('visible');
        }
    }
    reader.readAsDataURL(imageFile);

    // @TODO: implement "Auto optimize on drag" setting here
    //document.querySelector('form#tab-upload').dispatchEvent(new Event('submit'));
});
