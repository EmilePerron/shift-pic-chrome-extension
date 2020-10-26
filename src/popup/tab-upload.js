'use strict';

/*
 * /popup/tab-upload.js
 * ...
 */

(function() {
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

            window.imageFiles = [];

            for (let i = 0; i < e.target.files.length; i++) {
                window.imageFiles.push(e.target.files[i]);
            }

            window.imageUrl = '';
            window.imageUnsplashId = '';

            document.querySelector('#tab-upload .image-preview').setAttribute('image-count', window.imageFiles.length);
        }
    });

    document.querySelector('#tab-upload').addEventListener('submit', function(e) {
        e.preventDefault();

        if (window.imageFiles && window.imageFiles.length > 1) {
            startMultiImageProcessing();
        } else {
            window.imageFile = (window.imageFiles && window.imageFiles.length == 1) ? window.imageFiles[0] : null;
            document.querySelector('#processing-overlay').classList.add('visible');
            processCurrentImage(false);
        }
    });

    async function startMultiImageProcessing() {
        const processingModal = Modal.show(`
            <ol>
                ${window.imageFiles.map((file) => { return `<li>
                    <div class="filename">${file.name}</div>
                    <div class="status"></div>
                </li>`}).join('')}
            </ol>
        `, chrome.i18n.getMessage('tab_upload_multi_modal_title'), '', 'small unclosable multi-processing-modal');

        processMultiImage(processingModal);
    }

    function processMultiImage(processingModal, index = 0) {
        window.imageFile = window.imageFiles[index];

        const statusNode = processingModal.querySelector('ol li:nth-child(' + (index + 1) + ') .status');
        statusNode.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const processingPromise = processCurrentImage(true);

        processingPromise.then((warnings) => {
            if (warnings.length) {
                statusNode.innerHTML = `<i class="fas fa-check-circle has-warnings has-tooltip">
                <div class="tooltip opaque left">${warnings.join('<br>')}</div>
                </i>`;
            } else {
                statusNode.innerHTML = '<i class="fas fa-check-circle"></i>';
            }
        }).catch((userFriendlyError) => {
            statusNode.innerHTML = `<i class="fas fa-times-circle has-tooltip">
                <div class="tooltip opaque left">${userFriendlyError}</div>
            </i>`;
        }).finally(() => {
            if (index + 1 < window.imageFiles.length) {
                processMultiImage(processingModal, index + 1);
            } else {
                processingModal.classList.remove('unclosable');

                if (processingModal.querySelector('.fa-times-circle')) {
                    Flash.show('error', chrome.i18n.getMessage('error_multi_processing'));
                } else {
                    Flash.show('success', chrome.i18n.getMessage('tab_upload_multi_modal_success'));
                }
            }
        });
    }

    function processCurrentImage(multipleMode = false) {
        const formData = new FormData(this);
        formData.append('url', window.imageUrl);
        formData.append('unsplashId', window.imageUnsplashId);
        formData.append('license', window.license);
        formData.append('image', window.imageFile);
        formData.append('devices', JSON.stringify(window.sizeDataByDevice));

        return new Promise((resolve, reject) => {
            const warnings = [];

            fetch("https://api.shiftpic.co/process", { method: 'POST', body: formData }).then((response) => {
                return response.json();
            }).then((response) => {
                if (typeof response.error != 'undefined') {
                    let message = chrome.i18n.getMessage('error_' + response.error);
                    message = message ? message : response.error;

                    if (multipleMode) {
                        reject(message);
                    } else {
                        Flash.show('error', message);
                    }
                } else {
                    const originalFilename = window.imageUnsplashId ? `unsplash-image-${window.imageUnsplashId}` : window.imageFile.name.replace(/^(.*)(\.[a-zA-Z0-9]+)$/, '$1');
                    for (const resolution in response) {
                        if (typeof response[resolution].image != 'undefined' && response[resolution].image) {
                            chrome.downloads.download({
                                url: response[resolution].image,
                                filename: `${originalFilename}-${response[resolution].devices.join('-').toLowerCase()}-${resolution}${response[resolution].extension}`
                            }, (downloadId) => {
                                if (typeof downloadId == 'undefined') {
                                    Flash.show('error', chrome.i18n.getMessage('error_download'));
                                }
                            });
                        }

                        if (typeof response[resolution].error != 'undefined') {
                            let message = chrome.i18n.getMessage('error_' + response[resolution].error);
                            message = message ? message : response[resolution].error;

                            if (multipleMode) {
                                warnings.push(message);
                            } else {
                                Flash.show('warning', message);
                            }
                        }
                    }
                }

                if (!multipleMode) {
                    document.querySelector('#processing-overlay').classList.remove('visible');
                }

                License.refreshUsage();

                resolve(warnings);
            }).catch((error) => {
                Rollbar.error("Upload & optimize request error", error);

                if (multipleMode) {
                    reject(chrome.i18n.getMessage('error_generic'));
                } else {
                    Flash.show('error', chrome.i18n.getMessage('error_generic'));
                    document.querySelector('#processing-overlay').classList.remove('visible');
                }
            });
        });
    }
})();
