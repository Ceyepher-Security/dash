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
let activeViewportIdx = -1;
let viewports = []; // {name, url, id, maximized, pan/zoom state, x, y, w, h}

// --- Menu Logic ---

function updateMenuHeight() {
  const menuLinks = document.getElementById('menu-links');
  const menuBottom = document.getElementById('menu-bottom');
  const numLinks = customLinks.length + 1; // +1 for Dashboard
  let linkHeight = 0;
  if (numLinks > 0) {
    const dummy = document.createElement('button');
    dummy.className = "menu-link";
    dummy.style.visibility = "hidden";
    dummy.textContent = "dummy";
    menuLinks.appendChild(dummy);
    linkHeight = dummy.offsetHeight;
    menuLinks.removeChild(dummy);
  }
  const total = (linkHeight * numLinks) + menuBottom.offsetHeight + 10;
  sideMenu.style.height = total + "px";
}

function renderCustomLinks() {
  menuCustomLinks.innerHTML = '';
  customLinks.forEach((link, idx) => {
    const btn = document.createElement('button');
    btn.type = "button";
    btn.className = 'menu-link' + (editMode ? ' edit-mode' : '');
    btn.dataset.idx = idx;
    btn.tabIndex = 0;
    btn.innerText = link.name;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openViewport(link.name, link.url, false);
      closeMenu();
    });

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

    btn.addEventListener('mousedown', (e) => {
      if (!editMode && e.button === 0) {
        btn.draggable = true;
      }
    });

    menuCustomLinks.appendChild(btn);
  });
  updateMenuHeight();
}

function renderMenuLinks() {
  // Clear and render Dashboard and custom links
  const menuLinks = document.getElementById('menu-links');
  menuLinks.innerHTML = '';
  // Dashboard link
  const dashBtn = document.createElement('button');
  dashBtn.type = "button";
  dashBtn.className = "menu-link";
  dashBtn.innerText = "Dashboard";
  dashBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openViewport("Dashboard", "", true);
    closeMenu();
  });
  menuLinks.appendChild(dashBtn);

  // Custom links container
  const customLi = document.createElement('li');
  customLi.id = "menu-custom-links";
  menuLinks.appendChild(customLi);

  // Now render custom links into that container
  renderCustomLinks();
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
        openViewport(customLinks[idx].name, customLinks[idx].url, false);
      });

      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('quick-link-idx', idx);
      });
      quickLinksHeader.appendChild(btn);
    }
  });

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

function openMenu() {
  sideMenu.classList.add('visible');
  sideMenu.classList.remove('hidden');
  updateMenuHeight();
}
function closeMenu() {
  sideMenu.classList.remove('visible');
  sideMenu.classList.add('hidden');
}

hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (sideMenu.classList.contains('visible')) closeMenu();
  else openMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === "Escape") closeMenu();
});

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
    renderMenuLinks();
    renderQuickLinks();
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
  renderMenuLinks();
});

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

menuCustomLinks.ondragover = (e) => e.preventDefault();
menuCustomLinks.ondrop = (e) => {
  const qidx = e.dataTransfer.getData('quick-link-idx');
  if (qidx !== '') {
    quickLinks = quickLinks.filter(idx => idx !== Number(qidx));
    LS.set(QUICKLINKS_KEY, quickLinks);
    renderQuickLinks();
  }
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// --- Viewports/Carousel ---

/**
 * Opens a module (viewport).
 * - If isHome is true, opens the "Dashboard".
 * - If already open, focuses it.
 * - Modules start with pan enabled.
 */
function openViewport(name, url, isHome) {
  // If Dashboard requested, remove all modules and show a blank state (no Dashboard module)
  if (isHome) {
    viewports = [];
    activeViewportIdx = -1;
    renderViewports();
    return;
  }
  let existingIdx = viewports.findIndex(v => v.url === url);
  if (existingIdx !== -1) {
    activeViewportIdx = existingIdx;
    renderViewports();
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
  activeViewportIdx = viewports.length - 1;
  renderViewports();
}

function switchToViewport(idx) {
  activeViewportIdx = idx;
  renderViewports();
}

function removeViewport(idx) {
  viewports.splice(idx, 1);
  if (activeViewportIdx >= idx) activeViewportIdx--;
  if (activeViewportIdx < 0) activeViewportIdx = viewports.length - 1;
  renderViewports();
}

function renderViewports() {
  viewportCarousel.innerHTML = '';
  if (!viewports.length) return;
  viewports.forEach((vp, idx) => {
    const vpDiv = document.createElement('div');
    vpDiv.className = 'viewport' + (vp.maximized ? ' maximized' : '') + (idx !== activeViewportIdx ? ' inactive' : '');
    vpDiv.dataset.idx = idx;

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

    // --- Header move (no jump) ---
    const head = document.createElement('div');
    head.className = 'viewport-header';
    head.textContent = vp.name;
    head.title = vp.url;

    // Drag logic
    let drag = {active: false, mouseX: 0, mouseY: 0, startX: 0, startY: 0};
    head.style.cursor = "move";
    head.addEventListener('mousedown', (ev) => {
      if (vp.maximized || ev.button !== 0) return;
      drag.active = true;
      drag.mouseX = ev.clientX;
      drag.mouseY = ev.clientY;
      drag.startX = vp.x;
      drag.startY = vp.y;
      document.body.style.userSelect = "none";
      ev.preventDefault();
    });
    window.addEventListener('mousemove', (ev) => {
      if (drag.active) {
        vp.x = clamp(drag.startX + (ev.clientX - drag.mouseX), 0, window.innerWidth - (vpDiv.offsetWidth || 470));
        vp.y = clamp(drag.startY + (ev.clientY - drag.mouseY), 0, window.innerHeight - (vpDiv.offsetHeight || 330));
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

    head.addEventListener('dblclick', () => {
      vp.maximized = !vp.maximized;
      renderViewports();
    });
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
    const closeBtn = document.createElement('button');
    closeBtn.className = 'minimize-btn';
    closeBtn.textContent = '✖';
    closeBtn.title = 'Close';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeViewport(idx);
    };
    head.appendChild(closeBtn);
    vpDiv.appendChild(head);

    // --- Content wrapper with pan for all modules ---
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'viewport-content-wrapper';
    contentWrapper.style.overflow = 'hidden';
    contentWrapper.style.position = 'relative';

    // Pan overlay (covers iframe for drag)
    const panOverlay = document.createElement('div');
    panOverlay.style.position = 'absolute';
    panOverlay.style.left = 0;
    panOverlay.style.top = 0;
    panOverlay.style.width = '100%';
    panOverlay.style.height = '100%';
    panOverlay.style.zIndex = 99;
    panOverlay.style.cursor = 'grab';
    panOverlay.style.display = 'none';
    contentWrapper.appendChild(panOverlay);

    // Always show iframe/content, but use overlay for pan
    if (vp.url) {
      const iframe = document.createElement('iframe');
      iframe.className = 'viewport-iframe';
      iframe.src = vp.url;
      iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
      iframe.style.pointerEvents = "auto";
      iframe.onload = () => {
        // No-op: pan is handled by overlay regardless of iframe content
      };
      contentWrapper.appendChild(iframe);

      // --- Pan logic for all modules using overlay ---
      let isPanning = false, startX = 0, startY = 0, startPan = {x:0, y:0};
      contentWrapper.addEventListener('mousedown', (e) => {
        // Only left button and not header
        if (e.button !== 0 || e.target === head) return;
        isPanning = true;
        panOverlay.style.display = "block";
        panOverlay.style.cursor = "grabbing";
        startX = e.clientX;
        startY = e.clientY;
        startPan = {...vp.pan};
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (isPanning) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          vp.pan.x = startPan.x + dx;
          vp.pan.y = startPan.y + dy;
          iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
        }
      });
      window.addEventListener('mouseup', () => {
        if (isPanning) {
          isPanning = false;
          panOverlay.style.display = "none";
          panOverlay.style.cursor = "grab";
        }
      });

      // Zoom (unchanged)
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

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault();
    if (viewports.length > 1) {
      activeViewportIdx = (activeViewportIdx + 1) % viewports.length;
      renderViewports();
    }
  }
});

Array.from(document.getElementsByClassName('custom-link')).forEach(btn => {
  btn.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('custom-link-idx', btn.dataset.idx);
  });
});

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

function init() {
  customLinks = LS.get(CUSTOM_LINKS_KEY, []);
  quickLinks = LS.get(QUICKLINKS_KEY, []);
  renderMenuLinks();
  renderQuickLinks();
  applyLogoAndBg();
  // Do NOT open dashboard module on load (blank state)
}
init();

menuCustomLinks.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('menu-link')) {
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

document.addEventListener('mousedown', (e) => {
  if (sideMenu.classList.contains('visible') && !sideMenu.contains(e.target) && e.target !== hamburger) {
    closeMenu();
  }
});
