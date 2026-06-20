(function () {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let deferredPrompt = null;

  function createInstallButton() {
    if (document.getElementById('pwaInstallButton')) return document.getElementById('pwaInstallButton');

    const button = document.createElement('button');
    button.id = 'pwaInstallButton';
    button.type = 'button';
    button.className = 'pwa-install-button';
    button.innerHTML = '<span>Install App</span>';
    button.hidden = true;
    document.body.appendChild(button);

    button.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      button.hidden = true;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
      }
    });

    return button;
  }

  function showInstallButton() {
    if (isStandalone) return;
    const button = createInstallButton();
    button.hidden = false;
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Khumbuka PWA service worker registration failed:', error);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const button = document.getElementById('pwaInstallButton');
    if (button) button.hidden = true;
  });

  registerServiceWorker();
})();
