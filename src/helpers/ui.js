class UI {
	static init() {
		UI.initTabs();
		UI.initTogglers();
	}

	static initTabs() {
		document.addEventListener('click', function(e) {
			if (!e.target.matches('[role="tab"], [role="tab"] *')) {
				return;
			}

			e.preventDefault();

			const tabToggle = e.target.closest('[role="tab"]');

			for (const activeTabToggle of document.querySelectorAll('[role="tab"][aria-selected="true"]')) {
				activeTabToggle.setAttribute('aria-selected', 'false');
			}
			tabToggle.setAttribute('aria-selected', 'true');

			for (const activeTab of document.querySelectorAll('[role="tabpanel"][aria-hidden="false"]')) {
				activeTab.setAttribute('aria-hidden', 'true');
			}

			const targetTab = document.querySelector('[role="tabpanel"]' + tabToggle.getAttribute('toggles'));
			document.documentElement.setAttribute('active-tab', targetTab.id);
			targetTab.setAttribute('aria-hidden', 'false');
			document.querySelector('h1').innerHTML = targetTab.getAttribute('data-title');
			document.querySelector('h2').innerHTML = targetTab.getAttribute('data-subtitle');

			UI.initTogglersBackground();
		}, true);
	}

	static initTogglers() {
		document.addEventListener('click', function(e) {
			if (!e.target.matches('.toggler > *, .toggler > * *')) {
				return;
			}

			e.preventDefault();

			const toggler = e.target.closest('.toggler');
			const togglerOption = e.target.closest('.toggler > *');
			const togglerInput = toggler.querySelector('input');
			const selectedBackground = toggler.querySelector('.selected-background');

			for (const activeOption of toggler.querySelectorAll('[aria-selected="true"]')) {
				activeOption.setAttribute('aria-selected', 'false');
			}

			togglerOption.setAttribute('aria-selected', 'true');

			if (togglerInput) {
				togglerInput.value = togglerOption.getAttribute('value');
				togglerInput.dispatchEvent(new Event('change'));
			}

			// Animate selected background to new selection
			selectedBackground.style.width = togglerOption.offsetWidth + 'px';
			selectedBackground.style.left = togglerOption.offsetLeft + 'px';
		}, true);

		document.addEventListener('keydown', function(e) {
			if (!document.activeElement.matches('.toggler > *')) {
				return;
			}

			if (e.key == 'Enter') {
				document.activeElement.click();
			}
		}, true);

		UI.initTogglersBackground();
	}

	static initTogglersBackground() {
		for (const toggler of document.querySelectorAll('.toggler:not(.ready)')) {
			setTimeout(() => {
				const background = document.createElement("span");
				background.classList.add('selected-background');
				toggler.prepend(background, toggler.querySelector('*:first-child'));
				const selectedNode = toggler.querySelector('[aria-selected="true"]');

				background.style.width = selectedNode.offsetWidth + 'px';
				background.style.left = selectedNode.offsetLeft + 'px';

				if (selectedNode.offsetWidth > 0) {
					toggler.classList.add('ready');
				}
			}, 250);
		}
	}
}

// Initialize the basics of the UI features
UI.init();
