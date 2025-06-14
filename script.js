// --- Persistent Data Helpers ---
const LS = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const CUSTOM_LINKS_KEY = 'customLinks';

// --- DOM Elements ---
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const addLinkBtn = document.getElementById('add-link-btn');
const addLinkPanel = document.getElementById('add-link-panel');
const menuLinks = document.getElementById('menu-links');
const newLinkName = document.getElementById('new-link-name');
const newLinkUrl = document.getElementById('new-link-url');
const saveLink = document.getElementById('save-link');
const viewportCarousel = document.getElementById('viewport-carousel');

// --- State ---
let customLinks = LS.get(CUSTOM_LINKS_KEY, []);
let viewports = [];
let zCounter = 2;

// --- Menu Handlers ---
hamburger.addEventListener('click', e => {
  e.stopPropagation();
  if (sideMenu.classList.contains('visible')) {
    sideMenu.classList.remove('visible');
  } else {
    sideMenu.classList.add('visible');
  }
});
document.addEventListener('mousedown', e => {
  if (
    sideMenu.classList.contains('visible') &&
    !sideMenu.contains(e.target) &&
    e.target !== hamburger
  ) {
    sideMenu.classList.remove('visible');
  }
});

// --- Add Link Handler ---
addLinkBtn.addEventListener('click', () => {
  addLinkPanel.classList.toggle('hidden');
  if (!addLinkPanel.classList.contains('hidden')) newLinkName.focus();
});
saveLink.addEventListener('click', () => {
  const name = newLinkName.value.trim();
  const url = newLinkUrl.value.trim();
  if (name && url) {
    customLinks.push({ name, url });
    LS.set(CUSTOM_LINKS_KEY, customLinks);
    renderMenuLinks();
    newLinkName.value = '';
    newLinkUrl.value = '';
    addLinkPanel.classList.add('hidden');
  }
});
[newLinkName, newLinkUrl].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === "Enter") saveLink.click();
  });
});

// --- Viewport Open: Only one viewport per unique link (by URL) ---
function openViewportOnce(name, url) {
  // Do not open if a viewport for this url already exists!
  if (viewports.some(vp => vp.url === url)) {
    // Optionally bring it to front:
    const idx = viewports.findIndex(vp => vp.url === url);
    viewports[idx].z = ++zCounter;
    renderViewports();
    return;
  }
  let x = 60 + Math.random() * 60, y = 90 + Math.random() * 60, w = 470, h = 330;
  viewports.push({
    id: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    name,
    url,
    maximized: false,
    pan: { x: 0, y: 0 }, zoom: 1,
    x, y, w, h,
    z: zCounter++
  });
  renderViewports();
}

// --- Render Menu ---
function renderMenuLinks() {
  menuLinks.innerHTML = '';

  // Dashboard link (always at top)
  const dashBtn = document.createElement('button');
  dashBtn.type = "button";
  dashBtn.className = "menu-link";
  dashBtn.innerText = "Dashboard";
  dashBtn.onclick = () => {
    viewports = [];
    renderViewports();
    sideMenu.classList.remove('visible');
  };
  menuLinks.appendChild(dashBtn);

  // Custom links
  customLinks.forEach((link, idx) => {
    const btn = document.createElement('button');
    btn.type = "button";
    btn.className = "menu-link";
    btn.innerText = link.name;
    btn.dataset.idx = idx;
    btn.onclick = () => {
      openViewportOnce(link.name, link.url);
      sideMenu.classList.remove('visible');
    };
    menuLinks.appendChild(btn);
  });
}

// --- Render Viewports ---
function renderViewports() {
  viewportCarousel.innerHTML = '';
  viewports
    .sort((a, b) => (a.z || 2) - (b.z || 2))
    .forEach((vp, idx) => {
      const vpDiv = document.createElement('div');
      vpDiv.className = 'viewport';
      vpDiv.style.position = "absolute";
      vpDiv.style.left = `${vp.x}px`;
      vpDiv.style.top = `${vp.y}px`;
      vpDiv.style.width = `${vp.w}px`;
      vpDiv.style.height = `${vp.h}px`;
      vpDiv.style.zIndex = vp.z || 2;

      // --- Header ---
      const head = document.createElement('div');
      head.className = 'viewport-header';
      head.textContent = vp.name;
      head.style.cursor = "move";

      // Bring to front on mouse down
      head.addEventListener('mousedown', (ev) => {
        vp.z = ++zCounter;
        renderViewports();
        // Drag logic
        if (ev.button !== 0) return;
        let drag = { x: ev.clientX, y: ev.clientY, vx: vp.x, vy: vp.y };
        function moveHandler(e) {
          vp.x = drag.vx + (e.clientX - drag.x);
          vp.y = drag.vy + (e.clientY - drag.y);
          vpDiv.style.left = `${vp.x}px`;
          vpDiv.style.top = `${vp.y}px`;
        }
        function upHandler() {
          window.removeEventListener('mousemove', moveHandler);
          window.removeEventListener('mouseup', upHandler);
        }
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        ev.preventDefault();
      });

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'minimize-btn';
      closeBtn.textContent = '✖';
      closeBtn.title = 'Close';
      closeBtn.onclick = (e) => {
        viewports.splice(idx, 1);
        renderViewports();
      };
      head.appendChild(closeBtn);

      vpDiv.appendChild(head);

      // --- Content ---
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'viewport-content-wrapper';
      contentWrapper.style.overflow = 'hidden';
      contentWrapper.style.height = 'calc(100% - 32px)';
      if (vp.url) {
        const iframe = document.createElement('iframe');
        iframe.className = 'viewport-iframe';
        iframe.src = vp.url;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        contentWrapper.appendChild(iframe);
      }
      vpDiv.appendChild(contentWrapper);

      // Resize support (bottom right corner resize)
      vpDiv.style.resize = "both";
      vpDiv.style.overflow = "auto";
      vpDiv.addEventListener('mouseup', () => {
        const rect = vpDiv.getBoundingClientRect();
        vp.w = rect.width;
        vp.h = rect.height;
      });

      viewportCarousel.appendChild(vpDiv);
    });
}

// --- Initialize ---
function init() {
  customLinks = LS.get(CUSTOM_LINKS_KEY, []);
  renderMenuLinks();
  renderViewports();
}
init();
