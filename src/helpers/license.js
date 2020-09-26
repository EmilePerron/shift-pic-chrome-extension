class License {
	static init() {
		License.get((license) => {
			if (license) {
				window.license = license;
				License.getType((type) => {
					License.updateUI(license, type);
				});
			} else {
				License.assignFreeLicense(() => {

				});
			}
		});
	}

    static get(callback) {
        chrome.storage.sync.get('license', function(obj){
			callback(obj.license || null);
		});
    }

    static set(license, callback) {
		if (!license) {
			callback();
			return;
		}

		License.get((previousLicense) => {
			if (previousLicense || window.license) {
				previousLicense = previousLicense || window.license;

				if (/^free_.+$/.test(previousLicense)) {
					callback();
					return;
				}
			}

			window.license = license;
	        chrome.storage.sync.set({ 'license': license }, callback);

			License.getType((type) => {
				License.updateUI(license, type);
			});
		});
    }

	static assignFreeLicense(callback) {
		License.get((license) => {
			if (license || window.license) {
				License.set(license || window.license, callback);
			} else {
                fetch("https://api.shiftpic.co/license/free", { method: 'POST' }).then((response) => {
                    return response.json();
                }).then((response) => {
                    if (response && response.license) {
						License.set(response.license, callback);
					} else {
						Flash.show('error', 'An error occured while generating your free license. Please close this window and try again.');
					}
                });
			}
		});
	}

    static getType(callback) {
        License.getApiValidationData((response) => {
			let type = 'free';

			if (response && response.type) {
                type = response.type;
            }

			document.documentElement.setAttribute('license-type', type);
            callback(type);
        });
    }

    static getApiValidationData(callback) {
        License.get((license) => {
            if (!license) {
                callback(null);
            } else {
                const formData = new FormData();
                formData.append('license', license);
                fetch("https://api.shiftpic.co/license/validate", { method: 'POST', body: formData }).then((response) => {
                    return response.json();
                }).then((response) => {
                    callback(response);
                });
            }
        });
    }

    static saveLicenseFromOrder(orderId, callback) {
        const formData = new FormData();
        formData.append('id', orderId);
        fetch("https://api.shiftpic.co/license/get", { method: 'POST', body: formData }).then((response) => {
            return response.json();
        }).then((response) => {
			if (response && response.license) {
				License.set(response.license, callback);
			} else {
				callback();
			}
        });
    }

	static getUsage(callback) {
		License.get((license) => {
	        const formData = new FormData();
	        formData.append('license', license);

			fetch("https://api.shiftpic.co/usage/get", { method: 'POST', body: formData }).then((response) => {
				return response.json();
			}).then((response) => {
				if (response && response.usage) {
					callback(response.usage);
				} else {
					Flash.show('error', 'Sorry, your usage records could not be fetched.');
				}
			});
		});
	}

	static updateUI(license, type) {
		const planTitle = chrome.i18n.getMessage(`tab_plans_${type ? type : 'free'}_title`);
		document.documentElement.setAttribute('license-type', type);
		document.querySelector('#tab-user .field.license-type input').value = planTitle;
		document.querySelector('#tab-user .field.license input').value = license;
	}
}

License.init();
