'use strict';

/*
 * /content/size-detector.js
 * ...
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == 'getInnerWindowDimensions') {
        sendResponse({ width: window.innerWidth, height: window.innerHeight });
        return false;
    }

    if (request.action == "getNodeSizeData") {
        const node = document.querySelector('[wsr-target-node]');

        if (request.isFirst) {
            // Insert overlay to indicate that the extension is processing things
            const overlay = document.createElement('div');
            overlay.style.cssText = 'display: grid; width: 100%; height: 100%; place-items: center; font-family: sans-serif; font-size: 16px; font-weight: 600; color: #333; background-color: rgba(255, 255, 255, .85); backdrop-filter: blur(2px); position: fixed; top: 0; left: 0; z-index: 9999999; transition: none;';
            overlay.id = "wsr--processing-overlay";
            overlay.innerHTML = "Processing image size, please wait...";
            document.body.appendChild(overlay);
        }

        if (!node) {
            sendResponse({ width: null, height: null, objectFit: null, backgroundSize: null, imageUrl: null });

            if (request.isLast) {
                // Remove the overlay that was added earlier
                const overlay = document.querySelector('#wsr--processing-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }

            return true;
        }

        const styles = window.getComputedStyle(node);
        const sizeData = { width: node.offsetWidth, height: node.offsetHeight, objectFit: null, backgroundSize: null, imageUrl: null };

        // Wait for transitions...
        const transitionDuration = Math.max(...styles.transitionDuration.split(', ').map(parseFloat));
        setTimeout(() => {
            // Get image node size, object-fit / background-size, etc.
            if (node.matches('img')) {
                sizeData.objectFit = styles.objectFit || null;
                sizeData.imageUrl = node.currentSrc;
            } else if (node.matches('svg')) {
                const serializedSvg = new XMLSerializer().serializeToString(node);
                sizeData.imageUrl = 'data:image/svg+xml;base64,' + window.btoa(serializedSvg);
            } else {
                sizeData.backgroundSize = styles.backgroundSize || null;
                sizeData.imageUrl = styles.backgroundImage.replace(/^.*?url\((['"])(.+?)\1\).*$/g, '$2');
            }

            if (request.isLast) {
                // Remove the overlay that was added earlier
                const overlay = document.querySelector('#wsr--processing-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }

            sendResponse(sizeData);
        }, transitionDuration * 1000 + 50);

        return true;
    }
});
