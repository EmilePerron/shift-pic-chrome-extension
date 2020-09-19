/*
	view.js allows the use of sub-views, by replacing all [view] elements in the document by the view indicated in the attribute on page load.
	This is done synchronously, in order to prevent issues with other scripts.
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
