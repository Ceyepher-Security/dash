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

// Show a notification if the site can't be embedded
function showEmbedError(url, linkText) {
  iframeContainer.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #fff;
      font-size: 1.1em;
      text-align: center;
      padding: 40px;
    ">
      <div style="font-size:2em; margin-bottom: 16px;">🚫</div>
      <strong>Unable to display "${linkText}" here.</strong>
      <div style="margin-top: 10px;">
        This site does not allow embedding in dashboards for security reasons.<br>
        <button style="margin-top:18px;padding:10px 20px;font-size:1em;border-radius:7px;background:#68eaff;color:#181f2d;border:none;cursor:pointer;" onclick="window.open('${url}','_blank')">Open in New Tab</button>
      </div>
    </div>
  `;
  titleElem.textContent = linkText;
}

// Set active highlight (and load page)
function setActive(idx, scroll = true) {
  links.forEach((link, i) => link.classList.toggle('active', i === idx));
  currentIdx = idx;
  if (scroll) {
    // Ensure the active link is visible in the sidebar
    links[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  loadActive(idx); // Automatically load page on highlight
}

// Actually load the link (try iframe, show embed error if refused)
function loadActive(idx) {
  const url = links[idx].getAttribute('data-url');
  const linkText = links[idx].textContent.trim();
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
      showEmbedError(url, linkText);
    }
    testIframe.remove();
  }, 1200);

  testIframe.onload = () => {
    if (!didError) {
      didLoad = true;
      clearTimeout(TIMEOUT);
      iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
      titleElem.textContent = linkText;
    }
    testIframe.remove();
  };
  testIframe.onerror = () => {
    if (!didLoad) {
      didError = true;
      clearTimeout(TIMEOUT);
      showEmbedError(url, linkText);
    }
    testIframe.remove();
  };

  document.body.appendChild(testIframe);
}

// Mouse click handler: always loads
links.forEach((link, idx) => {
  link.onclick = (e) => {
    e.preventDefault();
    setActive(idx);
  };
  // Mouse hover to highlight and load
  link.onmouseenter = () => setActive(idx, false);
});

// Arrow key navigation: highlight and load
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
    setActive(currentIdx);
  }
});

// Initial highlight and load
setActive(0, false);
