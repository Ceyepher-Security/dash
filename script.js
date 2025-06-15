const menu = document.getElementById('menu');
const iframe = document.getElementById('iframe');
const links = document.querySelectorAll('.dropdown-menu a');

let historyStack = [];
let historyIndex = -1;

function toggleMenu() {
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const url = link.getAttribute('data-url');
    if (historyIndex === -1 || historyStack[historyIndex] !== url) {
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(url);
      historyIndex++;
    }
    iframe.src = url;
    menu.style.display = 'none';
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && historyIndex > 0) {
    historyIndex--;
    iframe.src = historyStack[historyIndex];
  } else if (e.key === 'ArrowRight' && historyIndex < historyStack.length - 1) {
    historyIndex++;
    iframe.src = historyStack[historyIndex];
  }
});

// Minimize / maximize logic for Mattermost chat
const mattermostContainer = document.getElementById('mattermostContainer');
const toggleMattermostBtn = document.getElementById('toggleMattermostBtn');

toggleMattermostBtn.addEventListener('click', () => {
  mattermostContainer.classList.toggle('minimized');
  if (mattermostContainer.classList.contains('minimized')) {
    toggleMattermostBtn.textContent = '+';
    toggleMattermostBtn.setAttribute('aria-label', 'Maximize chat');
  } else {
    toggleMattermostBtn.textContent = '−';
    toggleMattermostBtn.setAttribute('aria-label', 'Minimize chat');
  }
});
