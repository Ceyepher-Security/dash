document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const sidebarHeader = document.querySelector('.sidebar-header');
  const links = Array.from(sidebar.querySelectorAll('a[data-url]'));
  const iframeContainer = document.getElementById('iframe-container');
  const titleElem = document.querySelector('.title');

  // Collapse/expand sidebar on double click of the header
  function toggleSidebarCollapse() {
    sidebar.classList.toggle('collapsed');
    iframeContainer.style.left = sidebar.classList.contains('collapsed')
      ? (window.innerWidth < 800 ? "60px" : "90px")
      : (window.innerWidth < 800 ? (sidebar.offsetWidth + "px") : "240px");
  }
  sidebarHeader.ondblclick = toggleSidebarCollapse;

  // Page state
  let historyStack = [];
  let currentIdx = -1;

  // Embeddability cache
  const embedCache = new Map();

  function showUrlInIframe(url, idx) {
    iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
    links.forEach(link => link.classList.remove('active'));
    links[idx].classList.add('active');
    titleElem.textContent = links[idx].textContent.trim();
  }

  function tryEmbedOrOpen(url, idx) {
    // Instant if cache hit
    if (embedCache.has(url)) {
      if (embedCache.get(url) === true) {
        showUrlInIframe(url, idx);
      } else {
        window.open(url, '_blank');
        links.forEach(link => link.classList.remove('active'));
        if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
      }
      return;
    }

    // Otherwise, first time: test embeddability
    const testIframe = document.createElement('iframe');
    testIframe.style.display = "none";
    testIframe.src = url;

    let didLoad = false;
    let didError = false;
    const TIMEOUT = setTimeout(() => {
      if (!didLoad && !didError) {
        didError = true;
        embedCache.set(url, false);
        window.open(url, '_blank');
        links.forEach(link => link.classList.remove('active'));
        if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
      }
      testIframe.remove();
    }, 2000);

    testIframe.onload = () => {
      if (!didError) {
        didLoad = true;
        clearTimeout(TIMEOUT);
        embedCache.set(url, true);
        showUrlInIframe(url, idx);
      }
      testIframe.remove();
    };
    testIframe.onerror = () => {
      if (!didLoad) {
        didError = true;
        clearTimeout(TIMEOUT);
        embedCache.set(url, false);
        window.open(url, '_blank');
        links.forEach(link => link.classList.remove('active'));
        if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
      }
      testIframe.remove();
    };

    document.body.appendChild(testIframe);
  }

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
    tryEmbedOrOpen(url, idx);
  }

  links.forEach((link, idx) => {
    link.onclick = (e) => {
      e.preventDefault();
      openSite(idx);
    }
  });

  // Arrow key navigation (UP/DOWN) always works, and is INSTANT after first check
  document.addEventListener('keydown', (e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    ) return;
    if (links.length === 0) return;
    if (e.key === 'ArrowUp') {
      let idx = (currentIdx - 1 + links.length) % links.length;
      openSite(idx);
    } else if (e.key === 'ArrowDown') {
      let idx = (currentIdx + 1) % links.length;
      openSite(idx);
    }
  });

  // Initial load
  openSite(0);
});
