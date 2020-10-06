'use strict';

/*
 * /popup/tab-plans.js
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

    const type = this.getAttribute('checkout-trigger');

    if (window.license && window.license.indexOf('free_') == -1) {
        License.getType((currentType) => {
            if (currentType == 'free') {
                showSubscriptionPlanCheckout(this.getAttribute('checkout-trigger'));
            } else {
                showPlanUpgradeModal(currentType, type);
            }
        });
    } else {
        showSubscriptionPlanCheckout(type);
    }
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

function showPlanUpgradeModal(currentPlan, newPlan) {
    const changeType = License.getChangeType(currentPlan, newPlan);
    const modal = Modal.show(`
        <div>
            <p>${chrome.i18n.getMessage('tab_plans_change_modal_intro')
                    .replace('%changeType', chrome.i18n.getMessage(changeType))
                    .replace('%currentPlan', chrome.i18n.getMessage(`tab_plans_${currentPlan}_title`))
                    .replace('%newPlan', chrome.i18n.getMessage(`tab_plans_${newPlan}_title`))}</p>
            <p>${chrome.i18n.getMessage('tab_plans_change_modal_' + changeType + '_notice')
                    .replace(/%currentPlan/g, chrome.i18n.getMessage(`tab_plans_${currentPlan}_title`))
                    .replace(/%newPlan/g, chrome.i18n.getMessage(`tab_plans_${newPlan}_title`))}</p>
            <div class="button-container">
                <button type="button" class="confirm secondary">
                    ${chrome.i18n.getMessage('tab_plans_change_modal_' + changeType + '_button')
                    .replace(/%newPlan/g, chrome.i18n.getMessage(`tab_plans_${newPlan}_title`))}
                </button>
            </div>
        </div>
    `, chrome.i18n.getMessage(`tab_plans_${changeType}_modal_title`), '', 'plan-upgrade-modal small');

    modal.querySelector('button.confirm').addEventListener('click', function(e){
        e.preventDefault();
        modal.classList.add('loading');

        const formData = new FormData();
        formData.append('plan', newPlan);
        formData.append('license', window.license);
        fetch("https://api.shiftpic.co/license/change", { method: 'POST', body: formData }).then((response) => {
            return response.json();
        }).then((response) => {
			if (response && window.license == response.license && newPlan == response.plan && typeof response.error == 'undefined') {
                if (changeType == 'upgrade') {
                    License.updateUI(response.license, response.plan);
                }

                Flash.show('success', chrome.i18n.getMessage('tab_plans_' + changeType + '_success').replace('%s', chrome.i18n.getMessage(`tab_plans_${newPlan}_title`)));
                Modal.close();
			} else {
                throw Error();
			}
        }).catch(() => {
            modal.classList.remove('loading');
            Flash.show('error', chrome.i18n.getMessage('tab_plans_change_error'));
        });
    });

}
