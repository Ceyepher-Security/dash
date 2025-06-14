document.addEventListener('DOMContentLoaded', () => {
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
    a.onclick = (e) => {
      e.preventDefault();
      openViewport(link);
    };
    li.appendChild(a);

    if (editToggle.checked) {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '−';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
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

  hamburger.onclick = (e) => {
    e.preventDefault();
    sidebar.classList.toggle('show');
  };

  addLinkToggle.onclick = (e) => {
    e.preventDefault();
    addLinkForm.classList.toggle('hidden');
  };

  settingsToggle.onclick = (e) => {
    e.preventDefault();
    settingsMenu.classList.toggle('hidden');
  };

  createLinkBtn.onclick = (e) => {
    e.preventDefault();
    const name = document.getElementById('link-name').value;
    const url = document.getElementById('link-url').value;
    if (name && url) {
      const link = { name, url };
      customLinks.push(link);
      saveLinks();
      addCustomLink(link);
      document.getElementById('link-name').value = '';
      document.getElementById('link-url').value = '';
      addLinkForm.classList.add('hidden');
    }
  };

  logoUpload.onchange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        logoImg.src = reader.result;
        localStorage.setItem('dashboardLogo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  bgUpload.onchange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        document.body.style.backgroundImage = `url(${reader.result})`;
        localStorage.setItem('dashboardBG', reader.result);
      };
      reader.readAsDataURL(file);
    }
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
    wrapper.appendChild(iframe);

    let isDragging = false, startX, startY;
    header.onmousedown = e => {
      isDragging = true;
      startX = e.clientX - wrapper.offsetLeft;
      startY = e.clientY - wrapper.offsetTop;
      document.body.style.userSelect = 'none';
      document.onmousemove = e => {
        if (isDragging) {
          wrapper.style.left = `${e.clientX - startX}px`;
          wrapper.style.top = `${e.clientY - startY}px`;
        }
      };
      document.onmouseup = () => {
        isDragging = false;
        document.body.style.userSelect = '';
        document.onmousemove = null;
      };
    };

    header.ondblclick = () => {
      wrapper.classList.toggle('maximized');
      if (wrapper.classList.contains('maximized')) {
        wrapper.style.zIndex = 9999;
      } else {
        wrapper.style.zIndex = zIndex++;
      }
    };

    viewports.appendChild(wrapper);
  }

  document.onkeydown = e => {
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      const vp = Array.from(document.querySelectorAll('.viewport'));
      if (vp.length > 0) {
        let current = vp.findIndex(v => parseInt(v.style.zIndex) === zIndex - 1);
        let next = (current + 1) % vp.length;
        vp[next].style.zIndex = zIndex++;
      }
    }
  };

  editToggle.addEventListener('change', () => {
    menuLinks.querySelectorAll('li').forEach(li => {
      if (editToggle.checked) {
        if (!li.querySelector('button')) {
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '−';
          removeBtn.onclick = (e) => {
            e.stopPropagation();
            const link = li.querySelector('a');
            if (link) {
              customLinks = customLinks.filter(l => l.url !== link.dataset.link);
              saveLinks();
            }
            li.remove();
          };
          li.appendChild(removeBtn);
        }
      } else {
        const btn = li.querySelector('button');
        if (btn) btn.remove();
      }
    });
  });

  customLinks.forEach(addCustomLink);
  loadLogoAndBackground();
});
