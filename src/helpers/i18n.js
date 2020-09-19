/*
	i18n.js transforms all [i18n] elements in the view into regular strings using the attribute's value as an i18n message key
	If a [i18n-prefix] is defined on a parent tag, it will be used on all i18n conversions
	EXCEPT those with keys starting with _ (underscore)

	[Example]
	In the following HTML:
		<html i18n-prefix="popup_login_">
			<body>
				<i i18n="title"></i>
				<i i18n="_appname"></i>
				<input placeholder="i18n.placeholder" i18n>
				<input placeholder="i18n._placeholder" i18n>
			</body>
		</html>
	The first tag would be converted using the "popup_login_title" key.
	The second tag would be converted using the "_appname" key.
	The third tag would have its placeholder attribute's value converted using the "popup_login_placeholder" key
	The fourth tag would have its placeholder attribute's value converted using the "_placeholder" key
*/

(function(){
	let prefix = document.querySelector("html").getAttribute("i18n-prefix");
	let elements = document.querySelectorAll("[i18n]");

	for (let element of elements) {
		let key = element.getAttribute('i18n');

		if (key.length > 0) {
			// Replace the element itself with the i18n message
			if (key.substr(0, 1) != '_') {
				let prefixedParent = element.closest('[i18n-prefix]')
				key = (prefixedParent ? prefixedParent.getAttribute('i18n-prefix') : '') + key;
			}
			let message = chrome.i18n.getMessage(key);
			if (message) {
				element.outerHTML = message;
			}
		} else {
			// Check inside the attributes for i18n strings
			let attributes = element.attributes;

			for (let attribute of attributes) {
				let value = attribute.value;
				if (value.length > 5 && value.substr(0, 5) == "i18n.") {
					var computedKey = value.substr(5);
					if (computedKey.substr(0, 1) != '_') {
						let prefixedParent = element.closest('[i18n-prefix]')
						computedKey = (prefixedParent ? prefixedParent.getAttribute('i18n-prefix') : '') + computedKey;
					}
					let message = chrome.i18n.getMessage(computedKey);
					if (message) {
						element.setAttribute(attribute.name, message);
					}
				}
			}
		}
	}
})();
