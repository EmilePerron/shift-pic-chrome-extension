'use strict';

/*
 * /image-selection.js
 * ...
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "initImageSelectionWindow") {
        window.sizeDataByDevice = request.sizeDataByDevice;

        // Update image preview with selected image
        for (const breakpoint of ['4K', 'Desktop', 'Tablet', 'Mobile']) {
            if (window.sizeDataByDevice[breakpoint].imageUrl) {
                document.querySelector('#tab-upload .image-preview img').src = window.sizeDataByDevice[breakpoint].imageUrl;

                fetch(window.sizeDataByDevice[breakpoint].imageUrl).then((response) => {
                    return response.blob();
                }).then((imageBlob) => {
                    let filename = 'image';

                    if (window.sizeDataByDevice[breakpoint].imageUrl.indexOf('data:') !== 0) {
                        try {
                            filename = window.sizeDataByDevice[breakpoint].imageUrl.split('?')[0].split('/').pop().replace(/\.[a-zA-Z0-9]+$/, '')
                        } catch (e) { }
                    }

                    window.imageFile = new File([imageBlob], filename);
                })

                break;
            }
        }

        sendResponse();
    }
});

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
    }

    window.imageFile = imageFile;

    document.querySelector('form#tab-upload').dispatchEvent(new Event('submit'));
});

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
    }
});

document.querySelector('#tab-upload').addEventListener('submit', function(e) {
    e.preventDefault();

    document.querySelector('#processing-overlay').classList.add('visible');

    const formData = new FormData(this);
    formData.append('image', window.imageFile);
    formData.append('devices', JSON.stringify(window.sizeDataByDevice));
    fetch("https://optimizer.emileperron.com/process", { method: 'POST', body: formData }).then((response) => {
        return response.json();
    }).then((response) => {
        if (typeof response.error != 'undefined') {
            const message = chrome.i18n.getMessage('error_' + response.error);
            Flash.show('error', message ? message : response.error);
        } else {
            const originalFilename = window.imageFile.name.replace(/^(.*)(\.[a-zA-Z0-9]+)$/, '$1');
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
    }).catch(() => {
        document.querySelector('#processing-overlay').classList.remove('visible');
    });
});
