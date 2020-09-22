'use strict';

/*
 * /background/node-selector.js
 * Toggles the node selector when the extension's icon is clicked
 */

chrome.browserAction.setBadgeText({ text: '' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#8bc34a' });

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: 'toggleTargetingMode' });
    });
});

// Badge toggling listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "toggleBadge") {
        chrome.browserAction.setBadgeText({ text: request.status ? '👀' : '', tabId: sender.tab.id });
        sendResponse();
    }
});
