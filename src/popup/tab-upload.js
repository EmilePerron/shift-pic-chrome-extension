'use strict';

/*
 * /popup/tab-upload.js
 * ...
 */

setTimeout(() => {
    if (typeof window.sizeDataByDevice == 'undefined') {
        Flash.show('error', chrome.i18n.getMessage('error_refreshed'), true);
    }
}, 1000);

document.querySelector('#tab-upload .image-preview button').addEventListener('click', function(e) {
    document.querySelector('#filepicker').click();
});

document.querySelector('#filepicker').addEventListener('change', function(e) {
    e.preventDefault();

    if (e.target.files.length) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('#tab-upload .image-preview img').src = e.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
        window.imageFile = e.target.files[0];
        window.imageUrl = '';
        window.imageUnsplashId = '';
    }
});

document.querySelector('#tab-upload').addEventListener('submit', function(e) {
    e.preventDefault();

    document.querySelector('#processing-overlay').classList.add('visible');

    const formData = new FormData(this);
    formData.append('url', window.imageUrl);
    formData.append('unsplashId', window.imageUnsplashId);
    formData.append('license', window.license);
    formData.append('image', window.imageFile);
    formData.append('devices', JSON.stringify(window.sizeDataByDevice));
    fetch("https://api.shiftpic.co/process", { method: 'POST', body: formData }).then((response) => {
        return response.json();
    }).then((response) => {
        if (typeof response.error != 'undefined') {
            const message = chrome.i18n.getMessage('error_' + response.error);
            Flash.show('error', message ? message : response.error);
        } else {
            const originalFilename = window.imageUnsplashId ? `unsplash-image-${window.imageUnsplashId}` : window.imageFile.name.replace(/^(.*)(\.[a-zA-Z0-9]+)$/, '$1');
            for (const resolution in response) {
                if (typeof response[resolution].error == 'undefined') {
                    chrome.downloads.download({
                        url: response[resolution].image,
                        filename: `${originalFilename}-${response[resolution].devices.join('-').toLowerCase()}-${resolution}${response[resolution].extension}`
                    }, (downloadId) => {
                        if (typeof downloadId == 'undefined') {
                            Flash.show('error', chrome.i18n.getMessage('error_download'));
                        }
                    });
                } else {
                    const message = chrome.i18n.getMessage('error_' + response[resolution].error);
                    Flash.show('warning', message ? message : response[resolution].error);
                }
            }
        }
        document.querySelector('#processing-overlay').classList.remove('visible');
    }).catch((error) => {
        Flash.show('error', chrome.i18n.getMessage('error_generic'));
        document.querySelector('#processing-overlay').classList.remove('visible');
        Rollbar.error("Upload & optimize request error", error);
    });
});
