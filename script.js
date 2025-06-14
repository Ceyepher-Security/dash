// ... (keep the rest of your script as before) ...

function renderCustomLinks() {
  menuCustomLinks.innerHTML = '';
  customLinks.forEach((link, idx) => {
    // Make each link a button!
    const btn = document.createElement('button');
    btn.type = "button";
    btn.className = 'custom-link' + (editMode ? ' edit-mode' : '');
    btn.style.width = "100%";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "flex-start";
    btn.style.background = "none";
    btn.style.border = "none";
    btn.style.font = "inherit";
    btn.style.padding = "13px 20px 13px 22px";
    btn.style.cursor = "pointer";
    btn.dataset.idx = idx;
    btn.tabIndex = 0;
    btn.innerText = link.name;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openViewport(link.name, link.url);
      closeMenu();
    });

    // Remove button in edit mode
    if (editMode) {
      const remove = document.createElement('button');
      remove.className = 'remove-link';
      remove.innerHTML = '&minus;';
      remove.title = "Remove link";
      remove.style.marginLeft = "auto";
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        customLinks.splice(idx, 1);
        LS.set(CUSTOM_LINKS_KEY, customLinks);
        renderCustomLinks();
        renderQuickLinks();
        updateMenuHeight();
      });
      btn.appendChild(remove);

      // Move/drag logic
      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => {
        btn.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });
      btn.addEventListener('dragend', () => {
        btn.classList.remove('dragging');
        Array.from(menuCustomLinks.children).forEach(el => el.classList.remove('drag-over'));
      });
      btn.addEventListener('dragover', (e) => {
        e.preventDefault();
        btn.classList.add('drag-over');
      });
      btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = Number(e.dataTransfer.getData('text/plain'));
        const toIdx = Number(btn.dataset.idx);
        if (fromIdx !== toIdx) {
          const moved = customLinks.splice(fromIdx, 1)[0];
          customLinks.splice(toIdx, 0, moved);
          LS.set(CUSTOM_LINKS_KEY, customLinks);
          renderCustomLinks();
          renderQuickLinks();
          updateMenuHeight();
        }
      });
    }
    // Allow drag to quicklinks
    btn.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('custom-link-idx', idx);
    });

    // Drag to header
    btn.addEventListener('mousedown', (e) => {
      if (!editMode && e.button === 0) {
        btn.draggable = true;
      }
    });

    menuCustomLinks.appendChild(btn);
  });
  updateMenuHeight();
}

// ... (rest of your script unchanged) ...

function renderViewports() {
  viewportCarousel.innerHTML = '';
  if (!viewports.length) {
    openViewport('Dashboard', '', true);
    return;
  }
  viewports.forEach((vp, idx) => {
    const vpDiv = document.createElement('div');
    vpDiv.className = 'viewport' + (vp.maximized ? ' maximized' : '') + (idx !== activeViewportIdx ? ' inactive' : '');
    vpDiv.dataset.idx = idx;

    // Position and size
    if (!vp.maximized) {
      vpDiv.style.left = `${vp.x || 64}px`;
      vpDiv.style.top = `${vp.y || 64}px`;
      vpDiv.style.width = `${vp.w || 470}px`;
      vpDiv.style.height = `${vp.h || 330}px`;
    } else {
      vpDiv.style.left = "";
      vpDiv.style.top = "";
      vpDiv.style.width = "";
      vpDiv.style.height = "";
    }

    // Header
    const head = document.createElement('div');
    head.className = 'viewport-header';
    head.textContent = vp.name;
    head.title = vp.url;
    // Double click to maximize
    head.addEventListener('dblclick', () => {
      vp.maximized = !vp.maximized;
      renderViewports();
    });
    // Minimize/maximize button
    if (vp.maximized) {
      const minBtn = document.createElement('button');
      minBtn.className = 'minimize-btn';
      minBtn.textContent = '🗗';
      minBtn.title = 'Restore';
      minBtn.onclick = (e) => {
        e.stopPropagation();
        vp.maximized = false;
        renderViewports();
      };
      head.appendChild(minBtn);
    }
    // Close button, except home
    if (!vp.isHome) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'minimize-btn';
      closeBtn.textContent = '✖';
      closeBtn.title = 'Close';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        removeViewport(idx);
      };
      head.appendChild(closeBtn);
    }
    vpDiv.appendChild(head);

    // Content
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'viewport-content-wrapper';
    contentWrapper.style.overflow = 'hidden';

    if (vp.isHome) {
      contentWrapper.innerHTML = `<div style="padding:32px;font-size:1.3em;color:#222;">Welcome to your Security Dashboard!</div>`;
    } else {
      // Iframe with pan/zoom
      const iframe = document.createElement('iframe');
      iframe.className = 'viewport-iframe';
      iframe.src = vp.url;
      iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
      contentWrapper.appendChild(iframe);

      // Pan/zoom logic
      let isDragging = false, startX = 0, startY = 0, startPan = {x:0, y:0};

      // --- FIXED: DRAG HEADER, MOUSE STAYS WHERE CLICKED ---
      let drag = {active: false, offsetX:0, offsetY:0};
      head.style.cursor = "move";
      head.addEventListener('mousedown', (ev) => {
        if (vp.maximized || ev.button !== 0) return;
        drag.active = true;
        // Use the viewport's bounding rect for accurate math
        const rect = vpDiv.getBoundingClientRect();
        // The offset is mouse - viewport's top/left
        drag.offsetX = ev.clientX - rect.left;
        drag.offsetY = ev.clientY - rect.top;
        document.body.style.userSelect = "none";
      });
      window.addEventListener('mousemove', (ev) => {
        if (drag.active) {
          // Use offset to keep mouse at the point where it was clicked
          vp.x = clamp(ev.clientX - drag.offsetX, 0, window.innerWidth - (vpDiv.offsetWidth || 470));
          vp.y = clamp(ev.clientY - drag.offsetY, 0, window.innerHeight - (vpDiv.offsetHeight || 330));
          vpDiv.style.left = `${vp.x}px`;
          vpDiv.style.top = `${vp.y}px`;
        }
      });
      window.addEventListener('mouseup', () => {
        if (drag.active) {
          drag.active = false;
          document.body.style.userSelect = "";
        }
      });

      // Pan/zoom (unchanged)
      contentWrapper.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPan = {...vp.pan};
        contentWrapper.style.cursor = 'grabbing';
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          vp.pan.x = startPan.x + dx;
          vp.pan.y = startPan.y + dy;
          iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
        }
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
        contentWrapper.style.cursor = 'grab';
      });

      // Zoom
      contentWrapper.addEventListener('wheel', (e) => {
        if (e.altKey) {
          e.preventDefault();
          let newZoom = clamp(vp.zoom + (e.deltaY < 0 ? 0.1 : -0.1), 0.1, 4);
          const rect = contentWrapper.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const scaleDelta = newZoom / vp.zoom;
          vp.pan.x = mx - scaleDelta * (mx - vp.pan.x);
          vp.pan.y = my - scaleDelta * (my - vp.pan.y);
          vp.zoom = newZoom;
          iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
        }
      }, { passive: false });
    }
    vpDiv.appendChild(contentWrapper);

    // --- Resizing logic ---
    if (!vp.maximized) {
      vpDiv.style.resize = "both";
      vpDiv.addEventListener('mouseup', (e) => {
        const rect = vpDiv.getBoundingClientRect();
        if (Math.abs(rect.width - vp.w) > 2 || Math.abs(rect.height - vp.h) > 2) {
          vp.w = clamp(rect.width, 240, window.innerWidth * 0.97);
          vp.h = clamp(rect.height, 120, window.innerHeight * 0.92);
        }
      });
    } else {
      vpDiv.style.resize = "none";
    }
    viewportCarousel.appendChild(vpDiv);
  });
}

// ... (keep the rest of your script as before) ...
