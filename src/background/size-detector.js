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

        // Step 1: Get toolbar height
        chrome.tabs.setZoom(tab.id, 1, () => {
            chrome.tabs.sendMessage(tab.id, { action: 'getInnerWindowDimensions' }, (windowInnerSize) => {
                const toolbarHeight = window.height - windowInnerSize.height;

                // Step 2: Get maximum window height
                chrome.windows.update(window.id, { width: 6000, height: 6000 }, (maxedOutWindow) => {
                    setTimeout(() => {
                        const maxWindowHeight = maxedOutWindow.height;

                        // Step 3: Define the resolution looping method
                        const checkNextResolution = function() {
                            if (deviceIndex < deviceNames.length) {
                                const nextResolution = devices[deviceNames[deviceIndex]];
                                let zoomLevel = 1;
                                let requiredWindowWidth = nextResolution.width;
                                let requiredWindowHeight = nextResolution.height + toolbarHeight;

                                // Step 3.1: Check if required height exceeds maximum
                                if (nextResolution.height + toolbarHeight > maxWindowHeight) {
                                    const rawZoomRatio = (maxWindowHeight - toolbarHeight) / nextResolution.height;
                                    const flooredZoomRatio = Math.floor((rawZoomRatio + Number.EPSILON) * 100) / 100;
                                    requiredWindowHeight = (1 - (rawZoomRatio - flooredZoomRatio)) * maxWindowHeight;
                                    requiredWindowWidth = nextResolution.width / nextResolution.height * (requiredWindowHeight - toolbarHeight);
                                    zoomLevel = flooredZoomRatio;
                                }

                                chrome.tabs.setZoom(tab.id, zoomLevel, () => {
                                    chrome.windows.update(window.id, { width: Math.round(requiredWindowWidth), height: Math.round(requiredWindowHeight) }, (updatedWindow) => {
                                        setTimeout(() => {
                                            chrome.tabs.sendMessage(tab.id, { action: 'getNodeSizeData', isFirst: !deviceIndex, isLast: deviceIndex == deviceNames.length - 1 }, ((sizeData) => {
                                                results[deviceNames[deviceIndex]] = sizeData;
                                                deviceIndex += 1;
                                                checkNextResolution();
                                            }));
                                        }, 150);
                                    });
                                });
                            } else {
                                // Done checking resolutions.
                                // Reset window size and process image
                                chrome.windows.update(window.id, originalResolution)

                                // Before we proceed, check to standardize image resolutions that are within 10x10px or less of each other
                                // (ex.: combine 161x161, 165x165 and 170x170 to a single 170x170)
                                const standardizedData = results;
                                for (const key in standardizedData) {
                                    const originalHeight = standardizedData[key].height;
                                    const originalWidth = standardizedData[key].width;

                                    for (const otherKey in standardizedData) {
                                        if (key == otherKey) {
                                            continue;
                                        }

                                        if (Math.abs(originalHeight - standardizedData[otherKey].height) < 10 && Math.abs(originalWidth - standardizedData[otherKey].width) < 10) {
                                            standardizedData[key].height = standardizedData[otherKey].height = Math.max(originalHeight, standardizedData[otherKey].height);
                                            standardizedData[key].width = standardizedData[otherKey].width = Math.max(originalWidth, standardizedData[otherKey].width);
                                        }
                                    }
                                }

                                // Open image selection UI and pass size data
                                chrome.windows.create({ url: 'views/image-selection.html', type: 'popup', focused: true, width: 900, height: 640 }, function(window) {
                                    setTimeout(() => { chrome.runtime.sendMessage({ action: 'initImageSelectionWindow', sizeDataByDevice: standardizedData }); }, 500);
                                });
                            }
                        };

                        checkNextResolution();
                    }, 150);
                });
            });
        });
    });
}
