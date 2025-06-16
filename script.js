const sidebar = document.getElementById('sidebar');
const links = Array.from(sidebar.querySelectorAll('a[data-url]'));
const iframeContainer = document.getElementById('iframe-container');
const titleElem = document.querySelector('.title');

let tabs = [];
let currentTabIdx = -1;

function toggleSidebarCollapse() {
  sidebar.classList.toggle('collapsed');
  iframeContainer.style.left = sidebar.classList.contains('collapsed')
    ? (window.innerWidth < 800 ? "60px" : "90px")
    : (window.innerWidth < 800 ? (sidebar.offsetWidth + "px") : "240px");
}

function createTab(url, label) {
  // Check if a tab for this url exists
  let existingIdx = tabs.findIndex(tab => tab.url === url);
  if (existingIdx !== -1) {
    switchTab(existingIdx);
    return;
  }

  const tabId = "tab-" + Date.now() + "-" + Math.random().toString(36).slice(2,8);
  const tab = { id: tabId, url, label };
  tabs.push(tab);

  renderTabs();
  switchTab(tabs.length - 1);
}

function switchTab(idx) {
  if (idx < 0 || idx >= tabs.length) return;
  currentTabIdx = idx;
  renderTabs();
  showBrowser(tabs[idx].url, tabs[idx].label);
}

function closeTab(idx) {
  if (idx < 0 || idx >= tabs.length) return;
  tabs.splice(idx, 1);
  if (tabs.length === 0) {
    iframeContainer.innerHTML = "";
    titleElem.textContent = "Ceyepher Security Dashboard";
    currentTabIdx = -1;
    renderTabs();
    return;
  }
  if (currentTabIdx >= tabs.length) currentTabIdx = tabs.length - 1;
  renderTabs();
  switchTab(currentTabIdx);
}

function renderTabs() {
  // Remove any old tab bar
  let tabBar = document.getElementById('tab-bar');
  if (tabBar) tabBar.remove();

  tabBar = document.createElement('div');
  tabBar.id = 'tab-bar';
  tabBar.style.display = 'flex';
  tabBar.style.background = '#181f2d';
  tabBar.style.borderBottom = '1px solid #30395b';
  tabBar.style.height = '44px';
  tabBar.style.alignItems = 'center';
  tabBar.style.overflowX = 'auto';

  tabs.forEach((tab, i) => {
    const tabBtn = document.createElement('div');
    tabBtn.className = 'tab-btn' + (i === currentTabIdx ? ' active' : '');
    tabBtn.style.display = 'flex';
    tabBtn.style.alignItems = 'center';
    tabBtn.style.padding = '0 18px';
    tabBtn.style.cursor = 'pointer';
    tabBtn.style.height = '100%';
    tabBtn.style.fontSize = '1em';
    tabBtn.style.background = i === currentTabIdx ? '#232c3d' : 'none';
    tabBtn.style.color = i === currentTabIdx ? '#68eaff' : '#e3e8ef';
    tabBtn.style.borderRight = '1px solid #222a3b';

    tabBtn.textContent = tab.label.length > 20 ? tab.label.slice(0, 18) + "…" : tab.label;
    tabBtn.onclick = () => switchTab(i);

    // Close (x) button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = ' ×';
    closeBtn.style.marginLeft = '8px';
    closeBtn.style.color = '#da5b5b';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(i);
    };
    tabBtn.appendChild(closeBtn);

    tabBar.appendChild(tabBtn);
  });

  // Add tab bar above the browser area
  iframeContainer.parentNode.insertBefore(tabBar, iframeContainer);
}

function showBrowser(url, label) {
  iframeContainer.innerHTML = `
  <webview id="web-browser" src="${url}" style="width:100%;height:100vh;min-height:400px;border:none;background:#fff;display:block;" allowfullscreen></webview>
  `;
  // For fallback in browsers that don't support <webview>, use iframe:
  setTimeout(() => {
    const webview = document.getElementById('web-browser');
    if (!webview || webview.nodeName !== 'WEBVIEW') {
      iframeContainer.innerHTML = `<iframe src="${url}" style="width:100%;height:100vh;min-height:400px;border:none;background:#fff;display:block;" allowfullscreen></iframe>`;
    }
  }, 100);
  titleElem.textContent = label;
}

// Sidebar link click
links.forEach((link, idx) => {
  link.onclick = (e) => {
    e.preventDefault();
    const url = link.getAttribute('data-url');
    const label = link.textContent.trim();
    createTab(url, label);
    setActiveLink(idx);
  };
  link.onmouseenter = () => setActiveLink(idx, false);
});

function setActiveLink(idx, scroll = true) {
  links.forEach((link, i) => link.classList.toggle('active', i === idx));
  if (scroll) {
    links[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// Keyboard navigation for sidebar
let sidebarIdx = 0;
document.addEventListener('keydown', (e) => {
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA'
  ) return;
  if (links.length === 0) return;

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    sidebarIdx = (sidebarIdx - 1 + links.length) % links.length;
    setActiveLink(sidebarIdx);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    sidebarIdx = (sidebarIdx + 1) % links.length;
    setActiveLink(sidebarIdx);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    links[sidebarIdx].click();
  }
});

// Initial highlight
setActiveLink(0, false);
