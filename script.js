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
const PREVIOUS_LINKS_KEY = 'previousLinks';

// --- DOM Elements ---
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const addLinkBtn = document.getElementById('add-link-btn');
const addLinkPanel = document.getElementById('add-link-panel');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsExtra = document.getElementById('settings-extra');
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
const menuLinks = document.getElementById('menu-links');

// --- State ---
let customLinks = LS.get(CUSTOM_LINKS_KEY, []);
let quickLinks = LS.get(QUICKLINKS_KEY, []);
let editMode = false;
let viewports = []; // List of all open viewports, each an object with {id, name, url, ...}
let zCounter = 2; // Used to manage z-index for focus stacking

function getPreviousLinks() {
  return LS.get(PREVIOUS_LINKS_KEY, []);
}
function addToPreviousLinks(link) {
  const prev = getPreviousLinks();
  if (!prev.find(l => l.url === link.url)) {
    prev.push(link);
    LS.set(PREVIOUS_LINKS_KEY, prev);
  }
}
function removeFromPreviousLinks(url) {
  const prev = getPreviousLinks().filter(l => l.url !== url);
  LS.set(PREVIOUS_LINKS_KEY, prev);
}

// ... renderPreviousLinksList, updateMenuHeight, renderCustomLinks, renderMenuLinks, renderQuickLinks unchanged ...

// --- Menu Open/Close ---
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
  // Prevent Chrome from hijacking Alt+Tab if on this page
  if (e.key === "Tab" && e.altKey) {
    e.preventDefault();
    // Bring next viewport to front
    if (viewports.length > 1) {
      bringToFront((getTopViewportIdx() + 1) % viewports.length);
    }
  }
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
    updateMenuHeight();
    newLinkName.value = '';
    newLinkUrl.value = '';
    addLinkPanel.classList.add('hidden');
    setTimeout(() => {
      let last = document.querySelector('#menu-custom-links button:last-child');
      if (last) last.scrollIntoView({behavior:"smooth"});
      updateMenuHeight();
      renderPreviousLinksList();
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
  renderPreviousLinksList();
});

// Logo/BG
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

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// --- Viewports/Carousel ---

function openViewportAlwaysNew(name, url) {
  // Always add a new viewport instance regardless of URL/name
  let x = 60 + Math.random() * 60, y = 90 + Math.random() * 60, w = 470, h = 330;
  const id = `vp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${crypto.randomUUID()}`;
  viewports.push({
    id,
    name,
    url,
    isHome: false,
    maximized: false,
    pan: { x: 0, y: 0 }, zoom: 1,
    x, y, w, h,
    z: zCounter++
  });
  bringToFront(viewports.length - 1);
  renderViewports();
}

// Helper to bring a viewport to the top/front
function bringToFront(idx) {
  const maxZ = Math.max(2, ...viewports.map(vp => vp.z || 2));
  viewports[idx].z = maxZ + 1;
  // Sort viewports by z-order for rendering (lowest z first)
  viewports.sort((a, b) => (a.z || 2) - (b.z || 2));
  renderViewports();
}

// Which viewport has the highest z (topmost)
function getTopViewportIdx() {
  if (!viewports.length) return -1;
  let maxZ = -Infinity, idx = 0;
  viewports.forEach((vp, i) => {
    if ((vp.z || 2) > maxZ) {
      idx = i;
      maxZ = vp.z || 2;
    }
  });
  return idx;
}

function removeViewport(idx) {
  viewports.splice(idx, 1);
  renderViewports();
}

function renderViewports() {
  viewportCarousel.innerHTML = '';
  if (!viewports.length) return;
  viewports.forEach((vp, idx) => {
    const vpDiv = document.createElement('div');
    vpDiv.className = 'viewport' + (vp.maximized ? ' maximized' : '');
    vpDiv.dataset.idx = idx;
    vpDiv.style.zIndex = vp.z || 2;

    if (!vp.maximized) {
      vpDiv.style.left = `${vp.x || 64}px`;
      vpDiv.style.top = `${vp.y || 64}px`;
      vpDiv.style.width = `${vp.w || 470}px`;
      vpDiv.style.height = `${vp.h || 330}px`;
      vpDiv.style.position = "absolute";
      vpDiv.style.display = "flex";
    } else {
      vpDiv.style.left = "";
      vpDiv.style.top = "";
      vpDiv.style.width = "";
      vpDiv.style.height = "";
      vpDiv.style.position = "fixed";
      vpDiv.style.display = "flex";
    }

    // --- Header move (no jump) ---
    const head = document.createElement('div');
    head.className = 'viewport-header';
    head.textContent = vp.name;
    head.title = vp.url;

    // Drag logic
    let drag = { active: false, mouseX: 0, mouseY: 0, startX: 0, startY: 0 };
    head.style.cursor = "move";
    head.addEventListener('mousedown', (ev) => {
      // Focus this viewport (bring to front)
      bringToFront(idx);
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
      bringToFront(idx);
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
        bringToFront(idx);
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

    if (vp.url) {
      const iframe = document.createElement('iframe');
      iframe.className = 'viewport-iframe';
      iframe.src = vp.url;
      iframe.style.transform = `translate(${vp.pan.x}px,${vp.pan.y}px) scale(${vp.zoom})`;
      iframe.style.pointerEvents = "auto";
      contentWrapper.appendChild(iframe);

      let isPanning = false, startX = 0, startY = 0, startPan = { x: 0, y: 0 };
      contentWrapper.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target === head) return;
        // Focus this viewport (bring to front)
        bringToFront(idx);
        isPanning = true;
        panOverlay.style.display = "block";
        panOverlay.style.cursor = "grabbing";
        startX = e.clientX;
        startY = e.clientY;
        startPan = { ...vp.pan };
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
  renderPreviousLinksList();
}
init();

document.addEventListener('mousedown', (e) => {
  if (sideMenu.classList.contains('visible') && !sideMenu.contains(e.target) && e.target !== hamburger) {
    closeMenu();
  }
});

// --- REPLACE ALL MENU/QUICKLINK OPENERS WITH openViewportAlwaysNew ---
function patchMenuAndQuickLinksOpeners() {
  function patchCustomLinks() {
    document.querySelectorAll('#menu-custom-links > button.menu-link').forEach(btn => {
      btn.onclick = function (e) {
        if (editMode) return;
        e.preventDefault();
        const idx = parseInt(btn.dataset.idx, 10);
        const link = customLinks[idx];
        openViewportAlwaysNew(link.name, link.url);
      };
    });
  }
  function patchQuickLinks() {
    document.querySelectorAll('.quicklink-header-btn').forEach((btn, qidx) => {
      btn.onclick = function (e) {
        const idx = quickLinks[qidx];
        const link = customLinks[idx];
        openViewportAlwaysNew(link.name, link.url);
      };
    });
  }
  patchCustomLinks();
  patchQuickLinks();
}
const origRenderCustomLinks = renderCustomLinks;
renderCustomLinks = function () {
  origRenderCustomLinks.apply(this, arguments);
  setTimeout(patchMenuAndQuickLinksOpeners, 0);
};
const origRenderQuickLinks = renderQuickLinks;
renderQuickLinks = function () {
  origRenderQuickLinks.apply(this, arguments);
  setTimeout(patchMenuAndQuickLinksOpeners, 0);
};
