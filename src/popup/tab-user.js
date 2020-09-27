'use strict';

/*
 * /popup/tab-user.js
 * ...
 */

document.querySelector('#tab-user').addEventListener('submit', function(e) {
    e.preventDefault();

    License.get((license) => {
        let formData = new FormData(this);
        formData.append('currentLicense', license);

        fetch("https://api.shiftpic.co/license/validateChange", { method: 'POST', body: formData }).then((response) => {
            return response.json();
        }).then((response) => {
            if (!response) {
                Flash.show('error', 'An unknown error occured. Please close this window and try again.');
            } else if (response.error) {
                const message = chrome.i18n.getMessage('error_' + response.error);
                Flash.show('error', message ? message : response.error);
            } else if (response.license && response.type) {
                License.set(response.license, () => {
                    Flash.show('success', chrome.i18n.getMessage('tab_user_license_change_success'));
                });
            }
        });
    });
});
