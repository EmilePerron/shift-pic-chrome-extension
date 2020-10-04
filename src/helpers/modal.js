class Modal { // eslint-disable-line no-unused-vars
    static getWrapper() {
        let wrapperNode = document.querySelector('#modals-wrapper');

        if (wrapperNode) {
            return wrapperNode;
        }

        wrapperNode = Dom.node('<div id="modals-wrapper" class="modern"></div>');
        Dom.appendTo(document.querySelector('body'), wrapperNode);

        // Close modals when clicking in the wrapper's dark area
        wrapperNode.addEventListener('click', function(e){
            if (e.target.matches('#modals-wrapper')) {
                const topModal = wrapperNode.querySelector('.modal:last-child');

                if (topModal) {
                    topModal.dispatchEvent(new CustomEvent('close'));
                }
            }
        });

        return wrapperNode;
    }

    static renderBaseNode(title = '', topActions = '', classes = '') {
        const modalNode = Dom.node(`
            <div class="modal ${classes}">
                <div class="header ${title ? '' : 'no-title'}">
                    <div class="title">${title}</div>
                    <div class="top-actions">
                        ${topActions}
                        <a href="#" class="button icon-only small gray-lighter close-modal">
                            <i class="far fa-times"></i>
                        </a>
                    </div>
                </div>
                <div class="content">

                </div>
            </div>
        `);
        modalNode.querySelector('.close-modal').addEventListener('click', (e) => { e.preventDefault(); Modal.close(); });
        return modalNode;
    }

    static show(content, title = '', topActions = '', classes = '') {
        const modalNode = Modal.renderBaseNode(title, topActions, classes);

        Dom.appendTo(modalNode.querySelector('.content'), content);
        Dom.appendTo(Modal.getWrapper(), modalNode);

        Dom.triggerInlineScripts(modalNode);

        // Trigger the modal's appearance automatically
        setTimeout(function(){
            modalNode.classList.add('open');
        }, 10);

        Modal.setCloseListener(modalNode);

        return modalNode;
    }

    static showFromUrl(url, title = '', topActions = '', classes = '') {
        // Output the empty modal
        const modalNode = Modal.renderBaseNode(title, topActions, classes);
        Dom.appendTo(Modal.getWrapper(), modalNode);
        Modal.setCloseListener(modalNode);

        // Trigger the modal's appearance automatically
        setTimeout(function(){
            modalNode.classList.add('open');
        }, 10);

        // Toggle the loading before the request is made
        Modal.toggleLoading();

        // Make the request to load the content
        fetch(url).then(function(response){
            return response.text();
        }).then(function(html) {
            // Toggle off the loading state
            Modal.toggleLoading();

            // Output the content
            Dom.appendTo(modalNode.querySelector('.content'), html);

            // Execute scripts
            Dom.triggerInlineScripts(modalNode);

            modalNode.dispatchEvent(new CustomEvent('content-loaded'));
        }).catch(function() {
            // Toggle off the loading state
            Modal.toggleLoading();

            // Output an error message in the modal
            Dom.appendTo(modalNode.querySelector('.content'), localize('Une erreur s\'est produite lors du chargement. Veuillez réessayer plus tard.'));
        });

        return modalNode;
    }

    static triggerInlineScripts(modalNode) {
        // Trigger any <script> included in the modal's content
        for (const scriptNode of modalNode.querySelectorAll('script')) {
            try {
                eval(scriptNode.textContent);
            } catch (e) {
                console.error(e); // eslint-disable-line no-console
            }
        }
    }

    static setCloseListener(modalNode) {
        // Close event listener allows easy closing via JS
        modalNode.addEventListener('close', function(e) {
            const force = typeof e.detail == 'object' && e.detail !== null && typeof e.detail.force != 'undefined' && e.detail.force;

            if (!force && this.matches('.unclosable')) {
                return;
            }

            modalNode.classList.remove('open');

            setTimeout(function(){
                modalNode.remove();
            }, 250);
        });

        // Allow closing of the modal when clicking on elements with the [close-modal] attribute
        modalNode.addEventListener('click', function(e) {
            if (e.target.matches('[close-modal], [close-modal] *')) {
                modalNode.dispatchEvent(new CustomEvent('close'));
            }
        });
    }

    static close(force = false) {
        const modalNode = Modal.get();

        if (modalNode) {
            modalNode.dispatchEvent(new CustomEvent('close', { detail: { force: force }}));
        }
    }

    static get() {
        return Modal.getWrapper().querySelector('.modal:last-child');
    }

    static toggleLoading() {
        const modalNode = Modal.get();

        if (modalNode) {
            modalNode.classList.toggle('loading');
        }
    }
}
