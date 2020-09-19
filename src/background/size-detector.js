'use strict';

/*
 * /background/size-detector.js
 * ...
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "initSizeDetection") {
        detectSize(sender.tab);
        sendResponse();
    }
});

function detectSize(tab) {
    chrome.windows.get(tab.windowId, (window) => {
        const originalResolution = { width: window.width, height: window.height };
        const devices = {
            '4K': { width: 3840, height: 2160 },
            'Desktop': { width: 1920, height: 1080 },
            'Tablet': { width: 1024, height: 768 },
            'Mobile': { width: 375, height: 812 }
        };
        const deviceNames = Object.keys(devices);
        const results = {};
        let deviceIndex = 0;

        const checkNextResolution = function() {
            if (deviceIndex < deviceNames.length) {
                const nextResolution = devices[deviceNames[deviceIndex]];
                chrome.windows.update(window.id, nextResolution, () => {
                    chrome.tabs.sendMessage(tab.id, { action: 'getNodeSizeData', isFirst: !deviceIndex, isLast: deviceIndex == deviceNames.length - 1 }, ((sizeData) => {
                        results[deviceNames[deviceIndex]] = sizeData;
                        deviceIndex += 1;
                        checkNextResolution();
                    }));
                });
            } else {
                // Done checking resolutions.
                // Reset window size and process image
                chrome.windows.update(window.id, originalResolution)

                // Open image selection UI and pass size data
                chrome.windows.create({ url: 'views/image-selection.html', type: 'popup', focused: true, width: 800, height: 600 }, function(window) {
                    setTimeout(() => { chrome.runtime.sendMessage({ action: 'initImageSelectionWindow', sizeDataByDevice: results }); }, 500);
                });
            }
        };

        checkNextResolution();
    });
}
