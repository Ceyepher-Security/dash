// Initialization and persistence

const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const addLinkToggle = document.getElementById('add-link-toggle');
const addLinkForm = document.getElementById('add-link-form');
const createLinkBtn = document.getElementById('create-link');
const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const logoUpload = document.getElementById('logo-upload');
const bgUpload = document.getElementById('bg-upload');
const editToggle = document.getElementById('edit-toggle');
const menuLinks = document.getElementById('menu-links');
const quickAccess = document.getElementById('quick-access');
const viewports = document.getElementById('viewports');
const logoImg = document.getElementById('logo');

let customLinks = JSON.parse(localStorage.getItem('customLinks')) || [];
let zIndex = 1;

function saveLinks() {
  localStorage.setItem('customLinks', JSON.stringify(customLinks));
}

function addCustomLink(link) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = link.name;
  a.dataset.link = link.url;
  a.onclick = () => openViewport(link);
  li.appendChild(a);

  if (editToggle.checked) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.onclick = () => {
      li.remove();
      customLinks = customLinks.filter(l => l.url !== link.url);
      saveLinks();
    };
    li.appendChild(removeBtn);
  }

  menuLinks.appendChild(li);
}

function loadLogoAndBackground() {
  const savedLogo = localStorage.getItem('dashboardLogo');
  const savedBG = localStorage.getItem('dashboardBG');
  if (savedLogo) logoImg.src = savedLogo;
  if (savedBG) document.body.style.backgroundImage = `url(${savedBG})`;
}

hamburger.onclick = () => sidebar.classList.toggle('show');
addLinkToggle.onclick = () => addLinkForm.classList.toggle('hidden');
settingsToggle.onclick = () => settingsMenu.classList.toggle('hidden');

createLinkBtn.onclick = () => {
  const name = document.getElementById('link-name').value;
  const url = document.getElementById('link-url').value;
  if (name && url) {
    const link = { name, url };
    customLinks.push(link);
    saveLinks();
    addCustomLink(link);
  }
};

logoUpload.onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    logoImg.src = reader.result;
    localStorage.setItem('dashboardLogo', reader.result);
  };
  reader.readAsDataURL(file);
};

bgUpload.onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    document.body.style.backgroundImage = `url(${reader.result})`;
    localStorage.setItem('dashboardBG', reader.result);
  };
  reader.readAsDataURL(file);
};

function openViewport(link) {
  const wrapper = document.createElement('div');
  wrapper.className = 'viewport';
  wrapper.style.zIndex = zIndex++;
  wrapper.style.top = '100px';
  wrapper.style.left = '100px';

  const header = document.createElement('div');
  header.className = 'viewport-header';
  header.textContent = link.name;
  wrapper.appendChild(header);

  const iframe = document.createElement('iframe');
  iframe.src = link.url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  wrapper.appendChild(iframe);

  let isDragging = false, startX, startY;
  header.onmousedown = e => {
    isDragging = true;
    startX = e.clientX - wrapper.offsetLeft;
    startY = e.clientY - wrapper.offsetTop;
    document.onmousemove = e => {
      if (isDragging) {
        wrapper.style.left = `${e.clientX - startX}px`;
        wrapper.style.top = `${e.clientY - startY}px`;
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
    };
  };

  header.ondblclick = () => wrapper.classList.toggle('maximized');
  viewports.appendChild(wrapper);
}

document.onkeydown = e => {
  if (e.altKey && e.key === 'Tab') {
    const vp = Array.from(document.querySelectorAll('.viewport'));
    if (vp.length > 0) {
      let current = vp.findIndex(v => v.style.zIndex == zIndex - 1);
      let next = (current + 1) % vp.length;
      vp[next].style.zIndex = zIndex++;
    }
  }
};

customLinks.forEach(addCustomLink);
loadLogoAndBackground();

