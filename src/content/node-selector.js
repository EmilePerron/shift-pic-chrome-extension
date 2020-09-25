'use strict';

(function() {
    let wsr__targetingEnabled = false;
    let wsr__currentTarget = null;
    let wsr__targetingOverlay = null;

    // Allow toggling on & off via extension icon click
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action == "getScrollYOffset") {
            sendResponse({ scrollYOffset: window.scrollY });
            return false;
        }

        if (request.action == "probeForTargetingMode") {
            if (!wsr__targetingOverlay) {
                // Add overlay to the page
                wsr__targetingOverlay = document.createElement('div');
                wsr__targetingOverlay.id = "wsr--element-overlay"
                document.body.appendChild(wsr__targetingOverlay);
            }

            sendResponse({ ready: true });
            return false;
        }

        if (request.action == "toggleTargetingMode") {
            // Scroll to same position as in source tab
            const originalScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo({ top: request.scrollYOffset, behavior: 'auto' });
            document.documentElement.style.scrollBehavior = originalScrollBehavior;

            wsr__toggleBadge();
            sendResponse();
            return false;
        }
    });

    // Check for image node when hovering new element
    document.addEventListener('mousemove', function(e) {
        if (!wsr__targetingEnabled) {
            return;
        }

        const imageNode = wsr__getImageNodeFromEvent(e);
        wsr__updateTargetedNodeTo(imageNode);
    }, true);

    // Update overlay location on scroll
    document.addEventListener('scroll', function(){
        if (!wsr__targetingEnabled) {
            return;
        }

        if (wsr__currentTarget) {
            wsr__updateTargetedNodeTo(wsr__currentTarget);
        }
    });

    // Initiate image size detection and replacement sequence
    document.addEventListener('click', function(e) {
        if (!wsr__currentTarget || !wsr__targetingEnabled) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Mark image node as target via attribute
        for (const previousTargets of document.querySelectorAll('[wsr-target-node]')) {
            previousTargets.removeAttribute('wsr-target-node');
        }
        wsr__currentTarget.setAttribute('wsr-target-node', wsr__currentTarget.matches('img, svg') ? 'image' : 'background');

        // Send message to background to start the detection process
        chrome.runtime.sendMessage({ action: "initSizeDetection" });
        wsr__toggleBadge();
    }, true);

    // Toggles the overlay and updates its size & position if need be
    function wsr__updateTargetedNodeTo(imageNode) {
        if (imageNode) {
            const boundingRect = imageNode.getBoundingClientRect();
            wsr__currentTarget = imageNode;
            wsr__targetingOverlay.style.display = 'grid';
            wsr__targetingOverlay.style.top = (window.scrollY + boundingRect.top) + 'px';
            wsr__targetingOverlay.style.left = (window.scrollX + boundingRect.left) + 'px';
            wsr__targetingOverlay.style.width = boundingRect.width + 'px';
            wsr__targetingOverlay.style.height = boundingRect.height + 'px';

            wsr__targetingOverlay.setAttribute('data-type', imageNode.matches('img, svg') ? 'image' : 'background');
        } else {
            wsr__currentTarget = null;
            wsr__targetingOverlay.style.display = 'none';
        }
    }

    // Gets the node with the image, if any. Otherwise, returns null.
    function wsr__getImageNodeFromEvent(e) {
        const nodesUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

        for (let node of nodesUnderCursor) {
            // Simple image or picture tags
            if (node.matches('img, svg')) {
               return node;
           } else if (node.matches('picture *, svg *')) {
               return node.closest('picture, svg');
           }

            // Background images
            do {
                const styles = window.getComputedStyle(node);
                if ((styles.backgroundImage || 'none') != 'none' && styles.backgroundImage.indexOf('url(') != -1) {
                    return node;
                }
                node = node.parentElement;
            } while (node && node.parentElement);
        }

        return null;
    }

    function wsr__toggleBadge() {
        wsr__targetingEnabled = !wsr__targetingEnabled;

        if (!wsr__targetingEnabled) {
            wsr__updateTargetedNodeTo(null);
        }

        chrome.runtime.sendMessage({ action: "toggleBadge", status: wsr__targetingEnabled });
    }

    function wsr__toggleBadge() {
        wsr__targetingEnabled = !wsr__targetingEnabled;

        if (!wsr__targetingEnabled) {
            wsr__updateTargetedNodeTo(null);
        }

        chrome.runtime.sendMessage({ action: "toggleBadge", status: wsr__targetingEnabled });
    }
})();
