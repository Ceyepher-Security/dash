// --- Persistent Data Helpers ---
const LS = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const CUSTOM_LINKS_KEY = 'customLinks';
const QUICKLINKS_KEY = 'quickLinks';
const LOGO_KEY = 'dashboardLogo';
const BG_KEY = 'dashboardBg';

// --- DOM Elements ---
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const menuCustomLinks = document.getElementById('menu-custom-links');
const addLinkBtn = document.getElementById('add-link-btn');
const addLinkPanel = document.getElementById('add-link-panel');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const toggleEditSwitch = document.getElementById('toggle-edit-switch');
const toggleEditMenu = document.getElementById('toggle-edit-menu');
const newLinkName = document.getElementById('new-link-name');
const newLinkUrl = document.getElementById('new-link-url');
const saveLink = document.getElementById('save-link');
const logo = document.getElementById('dashboard-logo');
const logoUpload = document.getElementById('logo-upload');
const chooseLogo = document.getElementById('choose-logo');
const chooseBg = document.getElementById('choose-bg');
const bgUpload = document.getElementById('bg-upload');
const quickLinksHeader = document.getElementById('quicklinks-header');
const viewportCarousel = document.getElementById('viewport-carousel');

// --- State ---
let customLinks = LS.get(CUSTOM_LINKS_KEY, []);
let quickLinks = LS.get(QUICKLINKS_KEY, []);
let editMode = false;
let activeViewportIdx = 0;
let viewports = []; // {name, url, id, maximized, pan/zoom state, x, y, w, h}

// --- Menu Logic ---

function updateMenuHeight() {
  // Only show as tall as needed: links + menu-bottom
  const menuLinks = document.getElementById('menu-links');
  const menuBottom = document.getElementById('menu-bottom');
  const numLinks = customLinks.length;
  let linkHeight = 0;
  if (numLinks > 0) {
    // get the height of one link
    const dummy = document.createElement('li');
    dummy.className = "custom-link";
    dummy.style.visibility = "hidden";
    dummy.innerText = "dummy";
    menuLinks.appendChild(dummy);
    linkHeight = dummy.offsetHeight;
    menuLinks.removeChild(dummy);
  }
  // Each link + menu-bottom + some margin
  const total = (linkHeight * numLinks) + menuBottom.offsetHeight + 10;
  sideMenu.style.height = total + "px";
}

function renderCustomLinks() {
  menuCustomLinks.innerHTML = '';
  customLinks.forEach((link, idx) => {
    const li = document.createElement('li');
    li.draggable = editMode;
    li.className = 'custom-link' + (editMode ? ' edit-mode' : '');
    li.dataset.idx = idx;

    const a = document.createElement('a');
    a.textContent = link.name;
    a.className = 'custom-link-link';
    a.href = '#';
    a.dataset.url = link.url;
    a.dataset.name = link.name;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openViewport(link.name, link.url);
      closeMenu();
    });

    li.appendChild(a);

    // Remove button in edit mode
    if (editMode) {
      const remove = document.createElement('button');
      remove.className = 'remove-link';
      remove.innerHTML = '&minus;';
      remove.title = "Remove link";
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        customLinks.splice(idx, 1);
        LS.set(CUSTOM_LINKS_KEY, customLinks);
        renderCustomLinks();
        renderQuickLinks();
        updateMenuHeight();
      });
      li.appendChild(remove);

      // Move/drag logic
      li.addEventListener('dragstart', (e) => {
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        Array.from(menuCustomLinks.children).forEach(el => el.classList.remove('drag-over'));
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = Number(e.dataTransfer.getData('text/plain'));
        const toIdx = Number(li.dataset.idx);
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
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('custom-link-idx', idx);
    });

    // Drag to header
    li.addEventListener('mousedown', (e) => {
      if (!editMode && e.button === 0) {
        // Allow drag to header for quicklinks
        li.draggable = true;
      }
    });

    menuCustomLinks.appendChild(li);
  });
  updateMenuHeight();
}

function renderQuickLinks() {
  quickLinksHeader.innerHTML = '';
  quickLinks.forEach(idx => {
    if (customLinks[idx]) {
      const btn = document.createElement('button');
      btn.className = 'quicklink-header-btn';
      btn.textContent = customLinks[idx].name;
      btn.title = customLinks[idx].url;
      btn.addEventListener('click', (e) => {
        openViewport(customLinks[idx].name, customLinks[idx].url);
      });

      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('quick-link-idx', idx);
      });
      quickLinksHeader.appendChild(btn);
    }
  });

  // Allow dropping from menu to header
  quickLinksHeader.ondragover = e => e.preventDefault();
  quickLinksHeader.ondrop = e => {
    const idx = e.dataTransfer.getData('custom-link-idx');
    if (idx !== '' && !quickLinks.includes(Number(idx))) {
      quickLinks.push(Number(idx));
      LS.set(QUICKLINKS_KEY, quickLinks);
      renderQuickLinks();
    }
  };
}

// Modern menu open/close (toggle .visible and .hidden)
function openMenu() {
  sideMenu.classList.add('visible');
  sideMenu.classList.remove('hidden');
  updateMenuHeight();
}
function closeMenu() {
  sideMenu.classList.remove('visible');
  sideMenu.classList.add('hidden');
}

hamburger.addEventListener('click', () => {
  if (sideMenu.classList.contains('visible')) closeMenu();
  else openMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === "Escape") closeMenu();
});

// Add Link
addLinkBtn.addEventListener('click', () => {
  addLinkPanel.classList.toggle('hidden');
  if (!addLinkPanel.classList.contains('hidden')) {
    newLinkName.focus();
  }
});
saveLink.addEventListener('click', () => {
  const name = newLinkName.value.trim();
  const url = newLinkUrl.value.trim();
  if (name && url) {
    customLinks.push({ name, url });
    LS.set(CUSTOM_LINKS_KEY, customLinks);
    renderCustomLinks();
    newLinkName.value = '';
    newLinkUrl.value = '';
    addLinkPanel.classList.add('hidden');
    setTimeout(() => {
      menuCustomLinks.lastChild?.scrollIntoView({behavior:"smooth"});
      updateMenuHeight();
    }, 0);
  }
});
[newLinkName, newLinkUrl].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === "Enter") saveLink.click();
  });
});

// Settings
settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});
toggleEditMenu.addEventListener('change', () => {
  editMode = toggleEditMenu.checked;
  if (editMode) {
    toggleEditSwitch.classList.add('checked');
  } else {
    toggleEditSwitch.classList.remove('checked');
  }
  renderCustomLinks();
});

// Logo & Background
chooseLogo.addEventListener('click', () => logoUpload.click());
logoUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      logo.src = ev.target.result;
      logo.style.display = 'inline-block';
      LS.set(LOGO_KEY, ev.target.result);
    };
    reader.readAsDataURL(file);
  }
});
chooseBg.addEventListener('click', () => bgUpload.click());
bgUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('main-wrapper').style.backgroundImage = `url(${ev.target.result})`;
      document.getElementById('main-wrapper').style.backgroundSize = 'cover';
      document.getElementById('main-wrapper').style.backgroundRepeat = 'no-repeat';
      LS.set(BG_KEY, ev.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// Drag from header back to menu
menuCustomLinks.ondragover = (e) => e.preventDefault();
menuCustomLinks.ondrop = (e) => {
  const qidx = e.dataTransfer.getData('quick-link-idx');
  if (qidx !== '') {
    quickLinks = quickLinks.filter(idx => idx !== Number(qidx));
    LS.set(QUICKLINKS_KEY, quickLinks);
    renderQuickLinks();
  }
};

// --- Viewports/Carousel ---
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function openViewport(name, url, isHome) {
  if (isHome) {
    let homeIdx = viewports.findIndex(v => v.isHome);
    if (homeIdx !== -1) {
      switchToViewport(homeIdx);
      return;
    }
    viewports.push({
      id: `vp-${Date.now()}-home`,
      name: 'Dashboard',
      url: '',
      isHome: true,
      maximized: false,
      pan: {x:0, y:0}, zoom: 1,
      x: 60 + Math.random()*40, y: 90 + Math.random()*30, w: 470, h: 330
    });
    switchToViewport(viewports.length - 1);
    renderViewports();
    return;
  }
  let existingIdx = viewports.findIndex(v => v.url === url);
  if (existingIdx !== -1) {
    switchToViewport(existingIdx);
    return;
  }
  let x = 60 + Math.random()*60, y = 90 + Math.random()*60, w = 470, h = 330;
  viewports.push({
    id: `vp-${Date.now()}`,
    name,
    url,
    isHome: false,
    maximized: false,
    pan: {x:0, y:0}, zoom: 1,
    x, y, w, h
  });
  switchToViewport(viewports.length - 1);
  renderViewports();
}

function switchToViewport(idx) {
  activeViewportIdx = idx;
  renderViewports();
}

function removeViewport(idx) {
  viewports.splice(idx, 1);
  activeViewportIdx = Math.max(0, activeViewportIdx - 1);
  renderViewports();
}

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
      // Make draggable by header
      let drag = {active: false, offsetX:0, offsetY:0};
      head.style.cursor = "move";
      head.addEventListener('mousedown', (ev) => {
        if (vp.maximized || ev.button !== 0) return;
        drag.active = true;
        drag.offsetX = ev.clientX - vpDiv.getBoundingClientRect().left;
        drag.offsetY = ev.clientY - vpDiv.getBoundingClientRect().top;
        document.body.style.userSelect = "none";
      });
      window.addEventListener('mousemove', (ev) => {
        if (drag.active) {
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
    } else {
      vpDiv.style.resize = "none";
    }
    viewportCarousel.appendChild(vpDiv);
  });
}

// --- Carousel Alt+Tab ---
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault();
    if (viewports.length > 1) {
      activeViewportIdx = (activeViewportIdx + 1) % viewports.length;
      renderViewports();
    }
  }
});

// On drag from menu to header for quicklinks
Array.from(document.getElementsByClassName('custom-link')).forEach(li => {
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('custom-link-idx', li.dataset.idx);
  });
});

// --- Persistent Logo/BG ---
function applyLogoAndBg() {
  const logoData = LS.get(LOGO_KEY, '');
  if (logoData) {
    logo.src = logoData;
    logo.style.display = 'inline-block';
  } else {
    logo.style.display = 'none';
  }
  const bgData = LS.get(BG_KEY, '');
  if (bgData) {
    document.getElementById('main-wrapper').style.backgroundImage = `url(${bgData})`;
    document.getElementById('main-wrapper').style.backgroundSize = 'cover';
    document.getElementById('main-wrapper').style.backgroundRepeat = 'no-repeat';
  } else {
    document.getElementById('main-wrapper').style.backgroundImage = '';
  }
}

// --- Init ---
function init() {
  customLinks = LS.get(CUSTOM_LINKS_KEY, []);
  quickLinks = LS.get(QUICKLINKS_KEY, []);
  renderCustomLinks();
  renderQuickLinks();
  applyLogoAndBg();
  openViewport('Dashboard', '', true);
}
init();

// --- Drag & Drop for quicklinks from menu to header ---
menuCustomLinks.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('custom-link')) {
    e.dataTransfer.setData('custom-link-idx', e.target.dataset.idx);
  }
});
quickLinksHeader.addEventListener('dragover', (e) => {
  e.preventDefault();
  quickLinksHeader.classList.add('quicklink-drag-over');
});
quickLinksHeader.addEventListener('dragleave', (e) => {
  quickLinksHeader.classList.remove('quicklink-drag-over');
});
quickLinksHeader.addEventListener('drop', (e) => {
  quickLinksHeader.classList.remove('quicklink-drag-over');
  const idx = e.dataTransfer.getData('custom-link-idx');
  if (idx !== '' && !quickLinks.includes(Number(idx))) {
    quickLinks.push(Number(idx));
    LS.set(QUICKLINKS_KEY, quickLinks);
    renderQuickLinks();
  }
});

// Drag back from header to menu
quickLinksHeader.addEventListener('dragstart', (e) => {
  const btnIdx = Array.from(quickLinksHeader.children).indexOf(e.target);
  if (btnIdx !== -1) {
    e.dataTransfer.setData('quick-link-idx', quickLinks[btnIdx]);
  }
});
menuCustomLinks.addEventListener('dragover', (e) => e.preventDefault());
menuCustomLinks.addEventListener('drop', (e) => {
  const qidx = e.dataTransfer.getData('quick-link-idx');
  if (qidx !== '') {
    quickLinks = quickLinks.filter(i => i !== Number(qidx));
    LS.set(QUICKLINKS_KEY, quickLinks);
    renderQuickLinks();
  }
});

// --- Close menu when clicking outside
document.addEventListener('mousedown', (e) => {
  if (sideMenu.classList.contains('visible') && !sideMenu.contains(e.target) && e.target !== hamburger) {
    closeMenu();
  }
});
