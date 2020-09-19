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
	const elements = document.querySelectorAll("[view]");

	for (const element of elements) {
		const path = element.getAttribute('view');
        const url = chrome.runtime.getURL('views/' + path);

        var request = new XMLHttpRequest();
        request.open('GET', url, false);
        request.send(null);

        if (request.status === 200) {
          element.outerHTML = request.responseText;
        }
	}
})();
