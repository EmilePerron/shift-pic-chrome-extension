class Flash {
    static initialize() {
        let container = Dom.node('<div id="flash-container"></div>');

        Dom.appendTo(document.querySelector('body'), container);

        return container;
    }

    static getContainer() {
        return document.querySelector('#flash-container');
    }

    static render(flash) {
        return Dom.node(`<div class="flash-message ${flash.type} ${flash.sticky ? 'sticky' : ''}">${flash.message}</div>`);
    }

    static show(type, message, sticky = false) {
        let container = Flash.getContainer();
        let node = null;

        if (!container) {
            container = Flash.initialize();
        }

        if (typeof type == 'object') {
            node = Flash.render(type);
        } else {
            node = Flash.render({ type: type, message: message, sticky: sticky });
        }

        Dom.appendTo(container, node);

        setTimeout(() => {
            node.classList.add('visible');
        }, 50);

        if (!sticky) {
            setTimeout(() => {
                Flash.remove(node);
            }, 5000);
        }

        // Close notification on click
        node.addEventListener('click', function(e) {
            e.preventDefault();
            Flash.remove(node);
        });

        return node;
    }

    static remove(node) {
        if (!node || node.matches('.hide')) {
            return;
        }

        node.classList.add('hide');

        setTimeout(() => {
            node.remove();
        }, 500);
    }
}
