'use strict';

/*
 * /popup/init.js
 * ...
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "initImageSelectionWindow") {
        window.sizeDataByDevice = request.sizeDataByDevice;
        window.imageUrl = '';
        window.imageUnsplashId = '';

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

                    window.imageFiles = [new File([imageBlob], filename)];
                });

                break;
            }
        }

        sendResponse();
    }
});
