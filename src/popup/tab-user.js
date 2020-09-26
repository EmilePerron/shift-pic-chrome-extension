'use strict';

/*
 * /popup/tab-user.js
 * ...
 */

window.addEventListener("message", (event) => {
    if (!event.data || event.data.type != 'shiftpic') {
        return;
    }

    if (event.data.action == 'fastSpringPopupClosed') {
        document.querySelector('iframe[src^="https://www.shiftpic.co/checkout"]').remove();

        if (event.data.id) {
            Flash.show('success', chrome.i18n.getMessage('tab_plans_new_order_validating'));
            chrome.storage.local.set({ 'orderId': event.data.id });

            License.saveLicenseFromOrder(event.data.id, () => {
                License.get((license) => {
                    if (license) {
                        License.getType((type) => {
                            Flash.show('success', chrome.i18n.getMessage('tab_plans_new_order_success').replace('%s', type));
                        });
                    }
                });
            });
        }
    }
}, false);

Dom.delegate('click', '[checkout-trigger]', function(e) {
    e.preventDefault();
    showSubscriptionPlanCheckout(this.getAttribute('checkout-trigger'));
});

function showSubscriptionPlanCheckout(plan) {
    // Remove any existing checkout frame
    const existingIframe = document.querySelector('iframe[src^="https://www.shiftpic.co/checkout"]');
    if (existingIframe) {
        existingIframe.remove();
    }

    const newIframe = document.createElement('iframe');
    newIframe.src = "https://www.shiftpic.co/checkout?" + plan;
    newIframe.setAttribute('frameborder', 0);
    newIframe.classList.add('checkout-popup');
    document.body.appendChild(newIframe);
}
