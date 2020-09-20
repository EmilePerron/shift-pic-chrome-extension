'use strict';

/*
 * /popup/tab-search.js
 * ...
 */

(function() {
    const tabSearch = document.querySelector('#tab-search');
    const searchResultsWrapper = document.querySelector('#tab-search #search-results');
    const searchQueryInput = document.querySelector('#tab-search input[name="query"]');
    const searchPageInput = document.querySelector('#tab-search input[name="page"]');
    let previousSearchQuery = null;
    let isLoadingMore = false;

    // On page load, fetch recent pictures and display those
    fetch("https://optimizer.emileperron.com/search/recent").then((response) => {
        return response.json();
    }).then((response) => {
        if (typeof response.error == 'undefined') {
            displaySearchResults(response);
        }
    }).catch((error) => {
        Rollbar.error("Search recent request error", error);
    });

    // Regular form submission
    document.querySelector('#tab-search').addEventListener('submit', function(e) {
        e.preventDefault();

        if (previousSearchQuery == searchQueryInput.value && previousSearchQuery) {
            searchPageInput.value = parseInt(searchPageInput.value) + 1;
        } else {
            searchPageInput.value = 1;
            searchResultsWrapper.innerHTML = '';
        }

        previousSearchQuery = searchQueryInput.value;
        searchForImages();
    });

    searchResultsWrapper.addEventListener('click', function(e){
        if (!e.target.matches('.download')) {
            return;
        }

        e.preventDefault();

        const previewUrl = e.target.getAttribute('url-preview');
        const fullUrl = e.target.getAttribute('url-full');
        const unsplashId = e.target.getAttribute('photo-id');

        document.querySelector('#tab-upload .image-preview img').src = previewUrl;
        document.querySelector('nav [toggles="#tab-upload"]').click();
        document.querySelector('#tab-upload button[type="submit"]').disabled = true;
        Flash.show('info', chrome.i18n.getMessage('tab_search_notice_downloading_image'));

        fetch(fullUrl).then((response) => {
            return response.blob();
        }).then((imageBlob) => {
            const filename = 'unsplash-image-' + unsplashId;
            window.imageFile = new File([imageBlob], filename);
            document.querySelector('#tab-upload button[type="submit"]').disabled = false;
            Flash.show('success', chrome.i18n.getMessage('tab_search_notice_image_downloaded'));
        });

        fetch('https://optimizer.emileperron.com/search/download?id=' + unsplashId);
    }, true);

    // Auto-load more images when scrolling near the bottom
    setInterval(() => {
        if (tabSearch.getAttribute('aria-hidden') != 'true' && previousSearchQuery && !isLoadingMore) {
            const lastResultsPage = searchResultsWrapper.querySelector('.page:last-child');
            if (lastResultsPage && !lastResultsPage.classList.contains('last') && (window.scrollY + window.innerHeight) > (lastResultsPage.offsetTop + lastResultsPage.offsetHeight - 300)) {
                isLoadingMore = true;
                searchPageInput.value = parseInt(searchPageInput.value) + 1;
                searchForImages(previousSearchQuery);
            }
        }
    }, 500);

    function searchForImages(query = null, page = null) {
        if (query === null) {
            query = searchQueryInput.value;
        }

        if (page === null) {
            page = searchPageInput.value;
        }

        const formData = new FormData();
        formData.append('query', query);
        formData.append('page', page);

        fetch("https://optimizer.emileperron.com/search/photos", { method: 'POST', body: formData }).then((response) => {
            return response.json();
        }).then((response) => {
            if (typeof response.error != 'undefined') {
                const message = chrome.i18n.getMessage('error_' + response.error);
                Flash.show('error', message ? message : response.error);
            } else {
                displaySearchResults(response);
            }
            isLoadingMore = false;
        }).catch((error) => {
            Flash.show('error', chrome.i18n.getMessage('error_loading_search_results'));
            Rollbar.error("Search results request error", error);
            isLoadingMore = false;
        });
    }

    function displaySearchResults(response) {
        const fragment = new DocumentFragment()
        const newPage = document.createElement('div');
        newPage.classList.add('page');

        for (const photo of response) {
            const preview = document.createElement('div');
            preview.classList.add('photo-preview');
            preview.style.backgroundColor = photo.color;
            preview.innerHTML += `
                <img src="${photo.url_preview}" alt="${photo.alt_description}" />
                <div class="photo-infos">
                    <button type="button" class="secondary download" url-full="${photo.url_raw}" url-preview="${photo.url_small}" photo-id="${photo.id}">${chrome.i18n.getMessage('tab_search_use_image')}</button>
                    <div class="attribution">
                        Photo by <a href="${photo.user_url}" target="_blank">${photo.user_name}</a> on <a href="${photo.unsplash_url}" target="_blank">Unsplash</a>
                    </div>
                </div>
            `;
            newPage.appendChild(preview);
        }

        if (response.length < 20) {
            newPage.classList.add('last');

            if (response.length == 0 && searchResultsWrapper.childElementCount == 0) {
                newPage.classList.add('empty-state');
                newPage.innerHTML = chrome.i18n.getMessage('tab_search_no_results');
            } else {
                const lastPageIndicator = document.createElement('div');
                lastPageIndicator.classList.add('last-page-indicator');
                lastPageIndicator.innerHTML = chrome.i18n.getMessage('tab_search_no_more_results');
                newPage.appendChild(lastPageIndicator);
            }
        }

        fragment.appendChild(newPage);

        searchResultsWrapper.appendChild(fragment);
    }
})();
