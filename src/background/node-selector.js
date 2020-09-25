'use strict';

/*
 * /background/node-selector.js
 * Toggles the node selector when the extension's icon is clicked
 */

chrome.browserAction.setBadgeText({ text: '' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#8bc34a' });

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'getScrollYOffset' }, (scrollData) => {
        chrome.windows.get(tab.windowId, (window) => {
            chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
                chrome.windows.create({ url: tabs[0].url ? tabs[0].url : tabs[0].pendingUrl, type: 'popup', focused: true, width: window.width, height: window.height }, function(popupWindow) {
                    chrome.tabs.getAllInWindow(popupWindow.id, function(popupWindowTabs) {
                        // Set interval to probe for window readyness with sendMessage
                        let popupIsReady = false;
                        const probingInterval = setInterval(() => {
                            chrome.tabs.sendMessage(popupWindowTabs[0].id, { action: 'probeForTargetingMode' }, (probeResponse) => {
                                if (popupIsReady) {
                                    return;
                                }

                                if (probeResponse && probeResponse.ready) {
                                    popupIsReady = true;
                                    clearInterval(probingInterval);
                                    chrome.tabs.sendMessage(popupWindowTabs[0].id, { action: 'toggleTargetingMode', scrollYOffset: scrollData.scrollYOffset });
                                }
                             });
                        }, 100);
                    });
                });
            });
        });
    });
});

// Badge toggling listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "toggleBadge") {
        chrome.browserAction.setBadgeText({ text: request.status ? '👀' : '', tabId: sender.tab.id });
        sendResponse();
    }
});
