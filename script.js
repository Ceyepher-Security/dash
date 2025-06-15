const sidebar = document.getElementById('sidebar');
const sidebarHeader = document.querySelector('.sidebar-header');
const links = Array.from(sidebar.querySelectorAll('a[data-url]'));
const iframeContainer = document.getElementById('iframe-container');
const titleElem = document.querySelector('.title');

let currentIdx = 0;

// Collapse/expand sidebar on double click of the header
function toggleSidebarCollapse() {
  sidebar.classList.toggle('collapsed');
  iframeContainer.style.left = sidebar.classList.contains('collapsed')
    ? (window.innerWidth < 800 ? "60px" : "90px")
    : (window.innerWidth < 800 ? (sidebar.offsetWidth + "px") : "240px");
}

// Set active highlight (but don't load)
function setActive(idx, scroll = true) {
  links.forEach((link, i) => link.classList.toggle('active', i === idx));
  currentIdx = idx;
  if (scroll) {
    // Ensure the active link is visible in the sidebar
    links[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// Actually load the link (try iframe, fallback to new tab)
function loadActive(idx) {
  setActive(idx);
  const url = links[idx].getAttribute('data-url');
  if (!url) return;

  // Test iframe embedding
  const testIframe = document.createElement('iframe');
  testIframe.style.display = "none";
  testIframe.src = url;
  let didLoad = false, didError = false;

  // Clean up any old test iframes
  Array.from(document.body.querySelectorAll('.js-test-iframe')).forEach(el => el.remove());
  testIframe.className = 'js-test-iframe';

  const TIMEOUT = setTimeout(() => {
    if (!didLoad && !didError) {
      didError = true;
      window.open(url, '_blank');
    }
    testIframe.remove();
  }, 1500);

  testIframe.onload = () => {
    if (!didError) {
      didLoad = true;
      clearTimeout(TIMEOUT);
      iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
      titleElem.textContent = links[idx].textContent.trim();
    }
    testIframe.remove();
  };
  testIframe.onerror = () => {
    if (!didLoad) {
      didError = true;
      clearTimeout(TIMEOUT);
      window.open(url, '_blank');
    }
    testIframe.remove();
  };

  document.body.appendChild(testIframe);
}

// Mouse click handler: always loads
links.forEach((link, idx) => {
  link.onclick = (e) => {
    e.preventDefault();
    loadActive(idx);
  };
  // Allow mouse hover to highlight, but don't load
  link.onmouseenter = () => setActive(idx, false);
});

// Arrow key navigation: just highlight until Enter
document.addEventListener('keydown', (e) => {
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA'
  ) return;
  if (links.length === 0) return;

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    let idx = (currentIdx - 1 + links.length) % links.length;
    setActive(idx);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    let idx = (currentIdx + 1) % links.length;
    setActive(idx);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    loadActive(currentIdx);
  }
});

// Initial highlight and load
setActive(0, false);
loadActive(0);
