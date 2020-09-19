let _domData = [];

class Dom {
    static node(string) {
        let node = document.createElement('div');
        node.innerHTML = string.trim();
        return node.firstChild;
    }

    static prependTo(parentNode, node) {
        if (typeof node == 'string') {
            node = Dom.node(node);
        }

        parentNode.prepend(node);
        return node;
    }

    static appendTo(parentNode, node) {
        if (typeof node == 'string') {
            node = Dom.node(node);
        }

        parentNode.append(node);
        return node;
    }

    static before(referenceNode, node) {
        this.insert(referenceNode, node, 'before');
        return node;
    }

    static after(referenceNode, node) {
        this.insert(referenceNode, node, 'after');
        return node;
    }

    static replace(referenceNode, node) {
        this.insert(referenceNode, node, 'replace');
        return node;
    }

    static insert(referenceNode, node, mode) {
        if (typeof referenceNode == 'string') {
            referenceNode = document.querySelector(referenceNode);
        }

        if (typeof node == 'string') {
            node = Dom.node(node);
        }

        if (referenceNode && node) {
            if (mode == 'replace') {
                referenceNode.parentNode.replaceChild(node, referenceNode);
            } else if (mode == 'before') {
                referenceNode.parentNode.insertBefore(node, referenceNode);
            } else if (mode == 'after') {
                referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
            }
        }

        return node;
    }

    static data(node, key, value) {
        let setMode = typeof value != 'undefined';

        for (let index in _domData) {
            let element = _domData[index];
            if (element.node == node) {
                if (typeof element.data == 'undefined') {
                    element.data = {};
                }

                if (setMode) {
                    element.data[key] = value;
                    return this;
                } else {
                    return element.data[key];
                }
            }
        }

        if (setMode) {
            let data = {};
            data[key] = value;
            _domData.push({ node: node, data: data });
        }

        return setMode ? this : null;
    }

    static delegate(events, selector, callback, strict) {
        strict = typeof strict != 'undefined' ? strict : false;

        for (let event of events.split(' ')) {
            document.querySelector('body').addEventListener(event, (e) => {
                if (!e.target.matches(selector) && (strict || !e.target.closest(selector))) {
                    return;
                }

                let node = e.target;
                if (!strict && !e.target.matches(selector)) {
                    node = e.target.closest(selector);
                }

                callback.bind(node)(e);
            }, true);
        }
    }

    static index(node) {
        let i = 0;
        while ((node=node.previousElementSibling) != null) {
            ++i;
        }
        return i;
    }

    static triggerInlineScripts(node) {
        // Trigger any <script> included in the specified node's content
        for (const scriptNode of node.querySelectorAll('script')) {
            try {
                eval(scriptNode.textContent);
            } catch (e) {
                console.error(e); // eslint-disable-line no-console
            }
        }
    }
}
