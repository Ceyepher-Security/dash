const sidebar = document.getElementById('sidebar');
const sidebarHeader = document.querySelector('.sidebar-header');
const links = Array.from(sidebar.querySelectorAll('a[data-url]'));
const iframeContainer = document.getElementById('iframe-container');
const titleElem = document.querySelector('.title');
let currentIdx = 0;

function toggleSidebarCollapse() {
  sidebar.classList.toggle('collapsed');
  iframeContainer.style.left = sidebar.classList.contains('collapsed')
    ? (window.innerWidth < 800 ? "60px" : "90px")
    : (window.innerWidth < 800 ? (sidebar.offsetWidth + "px") : "240px");
}

function setActive(idx, scroll = true) {
  links.forEach((link, i) => link.classList.toggle('active', i === idx));
  currentIdx = idx;
  if (scroll) {
    links[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  loadActive(idx);
}

// Try to embed, but if blocked, redirect the user to the URL in the current tab
function loadActive(idx) {
  const url = links[idx].getAttribute('data-url');
  const linkText = links[idx].textContent.trim();
  if (!url) return;

  // Test iframe embedding
  const testIframe = document.createElement('iframe');
  testIframe.style.display = "none";
  testIframe.src = url;
  let didLoad = false, didError = false;

  Array.from(document.body.querySelectorAll('.js-test-iframe')).forEach(el => el.remove());
  testIframe.className = 'js-test-iframe';

  const TIMEOUT = setTimeout(() => {
    if (!didLoad && !didError) {
      didError = true;
      window.location.href = url;
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
      window.location.href = url; // Redirect in current tab
    }
    testIframe.remove();
  };

  document.body.appendChild(testIframe);
}

links.forEach((link, idx) => {
  link.onclick = (e) => {
    e.preventDefault();
    setActive(idx);
  };
  link.onmouseenter = () => setActive(idx, false);
});

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

setActive(0, false);
