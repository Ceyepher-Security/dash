// ...existing code above...

// Add a cache to store embeddability results: true (iframe works), false (blocks)
const embedCache = new Map();

function tryEmbedOrOpen(url, idx) {
  // Check cache first
  if (embedCache.has(url)) {
    if (embedCache.get(url) === true) {
      iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
      links.forEach(link => link.classList.remove('active'));
      links[idx].classList.add('active');
      titleElem.textContent = links[idx].textContent.trim();
    } else {
      window.open(url, '_blank');
      links.forEach(link => link.classList.remove('active'));
      if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
    }
    return;
  }

  // Otherwise, proceed with the test iframe (first time only)
  const testIframe = document.createElement('iframe');
  testIframe.style.display = "none";
  testIframe.src = url;

  let didLoad = false;
  let didError = false;
  const TIMEOUT = setTimeout(() => {
    if (!didLoad && !didError) {
      didError = true;
      embedCache.set(url, false); // Not embeddable
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
      embedCache.set(url, true); // Embeddable!
      iframeContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
      links.forEach(link => link.classList.remove('active'));
      links[idx].classList.add('active');
      titleElem.textContent = links[idx].textContent.trim();
    }
    testIframe.remove();
  };
  testIframe.onerror = () => {
    if (!didLoad) {
      didError = true;
      clearTimeout(TIMEOUT);
      embedCache.set(url, false); // Not embeddable
      window.open(url, '_blank');
      links.forEach(link => link.classList.remove('active'));
      if (typeof currentIdx === "number" && currentIdx >= 0) links[currentIdx].classList.add('active');
    }
    testIframe.remove();
  };

  document.body.appendChild(testIframe);
}

// ...rest of your code below...
