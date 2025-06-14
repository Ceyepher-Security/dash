document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const hamburgerBtn = document.querySelector('.hamburger');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.querySelector('.close-menu');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettingsBtn = document.querySelector('.close-settings');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const addLinkForm = document.getElementById('addLinkForm');
    const saveLinkBtn = document.getElementById('saveLinkBtn');
    const linkNameInput = document.getElementById('linkName');
    const linkUrlInput = document.getElementById('linkUrl');
    const menuLinks = document.getElementById('menuLinks');
    const quickLinks = document.getElementById('quickLinks');
    const viewportsContainer = document.getElementById('viewports');
    const editMenuToggle = document.getElementById('editMenuToggle');
    const chooseLogoBtn = document.getElementById('chooseLogoBtn');
    const logoUpload = document.getElementById('logoUpload');
    const chooseBgBtn = document.getElementById('chooseBgBtn');
    const bgUpload = document.getElementById('bgUpload');
    const logoImg = document.getElementById('logoImg');

    // State
    let customLinks = JSON.parse(localStorage.getItem('customLinks')) || [];
    let quickLinksData = JSON.parse(localStorage.getItem('quickLinks')) || [];
    let viewportStates = JSON.parse(localStorage.getItem('viewportStates')) || {};
    let draggedLink = null;

    // Initialize the app
    function init() {
        loadCustomLinks();
        loadViewports();
        loadSavedAssets();
    }

    // Load custom links into menu
    function loadCustomLinks() {
        customLinks.forEach(link => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-viewport="${encodeURIComponent(link.name)}">${link.name}</a>`;
            menuLinks.appendChild(li);
        });

        quickLinksData.forEach(link => {
            const btn = document.createElement('button');
            btn.textContent = link.name;
            btn.dataset.viewport = encodeURIComponent(link.name);
            quickLinks.appendChild(btn);
        });
    }

    // Load viewports
    function loadViewports() {
        viewportsContainer.innerHTML = '';
        
        customLinks.forEach(link => {
            const viewport = document.createElement('div');
            viewport.className = 'viewport';
            viewport.dataset.viewport = encodeURIComponent(link.name);
            viewport.style.width = '800px';
            viewport.style.height = '600px';
            viewport.style.top = '20px';
            viewport.style.left = '20px';
            viewport.innerHTML = `
                <div class="viewport-header">${link.name}</div>
                <iframe class="viewport-content" src="${link.url}" frameborder="0"></iframe>
            `;
            viewportsContainer.appendChild(viewport);
            setupViewport(viewport);
        });

        // Restore viewport positions
        Object.keys(viewportStates).forEach(viewportId => {
            const viewport = document.querySelector(`.viewport[data-viewport="${viewportId}"]`);
            if (viewport) {
                viewport.style.top = viewportStates[viewportId].top;
                viewport.style.left = viewportStates[viewportId].left;
                viewport.style.width = viewportStates[viewportId].width;
                viewport.style.height = viewportStates[viewportId].height;
            }
        });
    }

    // Setup viewport interactions
    function setupViewport(viewport) {
        const header = viewport.querySelector('.viewport-header');
        let isMaximized = false;

        // Maximize/restore on double click
        header.addEventListener('dblclick', () => {
            if (isMaximized) {
                viewport.classList.remove('maximized');
                isMaximized = false;
            } else {
                viewport.classList.add('maximized');
                isMaximized = true;
            }
        });

        // Dragging viewport
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !isMaximized) { // Left mouse button
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(viewport.style.left) || 0;
                startTop = parseInt(viewport.style.top) || 0;
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging && !isMaximized) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                viewport.style.left = (startLeft + dx) + 'px';
                viewport.style.top = (startTop + dy) + 'px';
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging && !isMaximized) {
                isDragging = false;
                const viewportId = encodeURIComponent(header.parentElement.dataset.viewport);
                viewportStates[viewportId] = {
                    top: viewport.style.top,
                    left: viewport.style.left,
                    width: viewport.style.width,
                    height: viewport.style.height
                };
                localStorage.setItem('viewportStates', JSON.stringify(viewportStates));
            }
        });

        // Viewport content interactions
        const content = viewport.querySelector('.viewport-content');
        let lastX, lastY;
        let scale = 1;

        content.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        // Alt+Tab between viewports
        window.addEventListener('keydown', (e) => {
            if (e.keyCode === 68 && e.altKey) { // Alt+D
                e.preventDefault();
                const viewports = document.querySelectorAll('.viewport');
                const currentIndex = Array.from(viewports).indexOf(document.activeElement);
                const nextIndex = (currentIndex + 1) % viewports.length;
                viewports[nextIndex].focus();
            }
        });

        // Zoom with alt+scroll
        content.addEventListener('wheel', (e) => {
            if (e.altKey) {
                e.preventDefault();
                scale += e.deltaY * -0.01;
                scale = Math.min(Math.max(0.125, scale), 4);
                content.style.transform = `scale(${scale})`;
            } else if (content.contentWindow) {
                content.contentWindow.scrollBy(0, e.deltaY);
            }
        });

        // Pan with mouse drag
        content.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 && content.contentWindow) { // Left mouse button pressed
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                content.contentWindow.scrollBy(-dx, -dy);
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
    }

    // Load saved assets (logo and background)
    function loadSavedAssets() {
        const savedLogo = localStorage.getItem('logo');
        if (savedLogo) {
            logoImg.src = savedLogo;
        }

        const savedBg = localStorage.getItem('background');
        if (savedBg) {
            document.body.style.backgroundImage = `url(${savedBg})`;
        }
    }

    // Event Listeners
    hamburgerBtn.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    addLinkBtn.addEventListener('click', toggleAddLinkForm);
    saveLinkBtn.addEventListener('click', saveNewLink);
    menuLinks.addEventListener('click', handleMenuLinkClick);
    editMenuToggle.addEventListener('change', toggleEditMode);
    menuLinks.addEventListener('mousedown', handleLinkDragStart);
    menuLinks.addEventListener('mouseup', handleLinkDragEnd);
    menuLinks.addEventListener('mouseleave', cancelLinkDrag);
    chooseLogoBtn.addEventListener('click', triggerLogoUpload);
    chooseBgBtn.addEventListener('click', triggerBgUpload);
    logoUpload.addEventListener('change', handleLogoUpload);
    bgUpload.addEventListener('change', handleBgUpload);
    quickLinks.addEventListener('click', handleQuickLinkClick);

    // Menu functions
    function openMenu() {
        menuOverlay.classList.add('active');
    }

    function closeMenu() {
        menuOverlay.classList.remove('active');
    }

    function openSettings() {
        settingsOverlay.classList.add('active');
    }

    function closeSettings() {
        settingsOverlay.classList.remove('active');
    }

    function toggleAddLinkForm() {
        addLinkForm.style.display = addLinkForm.style.display === 'flex' ? 'none' : 'flex';
    }

    function saveNewLink() {
        const name = linkNameInput.value.trim();
        const url = linkUrlInput.value.trim();

        if (name && url) {
            const newLink = { name, url };
            customLinks.push(newLink);
            localStorage.setItem('customLinks', JSON.stringify(customLinks));

            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-viewport="${encodeURIComponent(name)}">${name}</a>`;
            menuLinks.appendChild(li);

            linkNameInput.value = '';
            linkUrlInput.value = '';
            addLinkForm.style.display = 'none';

            loadViewports();
        }
    }

    function handleMenuLinkClick(e) {
        const link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            const viewportId = link.dataset.viewport;
            const viewport = document.querySelector(`.viewport[data-viewport="${viewportId}"]`);

            if (viewport) {
                // Bring viewport to front
                document.querySelectorAll('.viewport').forEach(vp => {
                    vp.style.zIndex = 1;
                });
                viewport.style.zIndex = 2;
            } else if (viewportId !== 'dashboard') {
                // Only load viewport if it's not the dashboard
                loadViewports();
            }
        }
    }

    function toggleEditMode(e) {
        if (e.target.checked) {
            menuLinks.classList.add('edit-mode');
            
            // Add edit buttons to each link
            const links = menuLinks.querySelectorAll('li');
            links.forEach(link => {
                if (!link.querySelector('.remove-btn')) {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.textContent = '-';
                    link.appendChild(removeBtn);
                    
                    const moveBtn = document.createElement('button');
                    moveBtn.className = 'move-btn';
                    moveBtn.textContent = '≡';
                    link.appendChild(moveBtn);
                }
            });
        } else {
            menuLinks.classList.remove('edit-mode');
            
            // Remove edit buttons
            const removeBtns = menuLinks.querySelectorAll('.remove-btn');
            const moveBtns = menuLinks.querySelectorAll('.move-btn');
            
            removeBtns.forEach(btn => btn.remove());
            moveBtns.forEach(btn => btn.remove());
        }
    }

    function handleLinkDragStart(e) {
        const li = e.target.closest('li');
        if (li && editMenuToggle.checked) {
            const viewportId = li.querySelector('a').dataset.viewport;
            
            if (e.target.classList.contains('remove-btn')) {
                // Remove link
                customLinks = customLinks.filter(link => encodeURIComponent(link.name) !== viewportId);
                quickLinksData = quickLinksData.filter(link => encodeURIComponent(link.name) !== viewportId);
                
                localStorage.setItem('customLinks', JSON.stringify(customLinks));
                localStorage.setItem('quickLinks', JSON.stringify(quickLinksData));
                
                li.remove();
                
                const viewport = document.querySelector(`.viewport[data-viewport="${viewportId}"]`);
                if (viewport) viewport.remove();
            } else if (e.target.classList.contains('move-btn')) {
                // Start dragging link
                draggedLink = li;
                li.style.opacity = '0.4';
            }
        }
    }

    function handleLinkDragEnd(e) {
        if (draggedLink) {
            const targetLi = e.target.closest('li');
            if (targetLi && targetLi !== draggedLink) {
                // Move the dragged link before the target link
                targetLi.parentNode.insertBefore(draggedLink, targetLi);
            }
            draggedLink.style.opacity = '1';
            draggedLink = null;
        }
    }

    function cancelLinkDrag() {
        if (draggedLink) {
            draggedLink.style.opacity = '1';
            draggedLink = null;
        }
    }

    // Asset handling
    function triggerLogoUpload() {
        logoUpload.click();
    }

    function triggerBgUpload() {
        bgUpload.click();
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            logoImg.src = url;
            localStorage.setItem('logo', url);
        }
    }

    function handleBgUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            document.body.style.backgroundImage = `url(${url})`;
            localStorage.setItem('background', url);
        }
    }

    // Quick links
    function handleQuickLinkClick(e) {
        const viewportId = e.target.dataset.viewport;
        if (viewportId) {
            e.preventDefault();
            const viewport = document.querySelector(`.viewport[data-viewport="${viewportId}"]`);
            if (viewport) {
                // Bring viewport to front
                document.querySelectorAll('.viewport').forEach(vp => {
                    vp.style.zIndex = 1;
                });
                viewport.style.zIndex = 2;
            }
        }
    }

    // Initialize the app
    init();
});
