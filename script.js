// Collapsible sidebar by double-clicking the sidebar header
const sidebar = document.getElementById('sidebar');
const sidebarHeader = document.querySelector('.sidebar-header');
const links = Array.from(sidebar.querySelectorAll('a[data-url]'));
const iframeContainer = document.getElementById('iframe-container');
const mainHeader = document.getElementById('main-header');
const titleElem = document.querySelector('.title');

// Collapse/expand sidebar on double click of the header
function toggleSidebarCollapse() {
  sidebar.classList.toggle('collapsed');
  document.getElementById('iframe-container').style.left = sidebar.classList.contains('collapsed')
    ? (window.innerWidth < 800 ? "60px" : "90px")
    : (window.innerWidth < 800 ? (sidebar.offsetWidth + "px") : "240px");
}

// Page state
let historyStack = [];
let currentIdx = -1;

// Utility: Try embedding, fallback to new tab if refused
function tryEmbedOrOpen(url, idx) {
  // Create a temporary iframe for testing
  const testIframe = document.createElement('iframe');
  testIframe.style.display = "none";
  testIframe.src = url;

  // If loaded, show in main iframe, else open in new tab
  let didLoad = false;
  let didError = false;
  // Timeout after 2s in case of block (most browsers fire error instantly)
  const TIMEOUT = setTimeout(() => {
    if (!didLoad && !didError) {
      didError = true;
      window.open(url, '_blank');
      // Restore previous active state if needed
      links.forEach(link => link.classList.remove('active'));
      if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
    }
    testIframe.remove();
  }, 2000);

  testIframe.onload = () => {
    if (!didError) {
      didLoad = true;
      clearTimeout(TIMEOUT);
      iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
      // Set active link
      links.forEach(link => link.classList.remove('active'));
      links[idx].classList.add('active');
      // Change title based on link text
      titleElem.textContent = links[idx].textContent.trim();
    }
    testIframe.remove();
  };
  testIframe.onerror = () => {
    if (!didLoad) {
      didError = true;
      clearTimeout(TIMEOUT);
      window.open(url, '_blank');
      links.forEach(link => link.classList.remove('active'));
      if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
    }
    testIframe.remove();
  };

  document.body.appendChild(testIframe);
}

// Load a website into an iframe, manage history, update title
function openSite(idx) {
  if (idx < 0 || idx >= links.length) return;
  const url = links[idx].getAttribute('data-url');
  if (!url) return;
  // If not moving in history, push
  if (currentIdx !== idx) {
    if (currentIdx >= 0 && currentIdx < links.length)
      links[currentIdx].classList.remove('active');
    if (currentIdx !== -1 && historyStack[historyStack.length - 1] !== idx) {
      historyStack.push(idx);
    } else if (currentIdx === -1) {
      historyStack.push(idx);
    }
    currentIdx = idx;
  }
  // Try to embed, fallback to new tab if refused
  tryEmbedOrOpen(url, idx);
}
links.forEach((link, idx) => {
  link.onclick = (e) => {
    e.preventDefault();
    openSite(idx);
  }
});

// Arrow key navigation (UP/DOWN) always works
document.addEventListener('keydown', (e) => {
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA'
  ) return;
  if (links.length === 0) return;
  if (e.key === 'ArrowUp') {
    // Previous link (wrap)
    let idx = (currentIdx - 1 + links.length) % links.length;
    openSite(idx);
  } else if (e.key === 'ArrowDown') {
    // Next link (wrap)
    let idx = (currentIdx + 1) % links.length;
    openSite(idx);
  }
});

// Initial load
openSite(0);
