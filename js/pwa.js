(function () {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let deferredPrompt = null;
  let waitingWorker = null;
  let refreshing = false;
  let updateCheckTimer = null;

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

  function createUpdateBanner() {
    let banner = document.getElementById('pwaUpdateBanner');
    if (banner) return banner;

    banner = document.createElement('div');
    banner.id = 'pwaUpdateBanner';
    banner.className = 'pwa-update-banner';
    banner.hidden = true;
    banner.innerHTML = `
      <div class="pwa-update-copy">
        <strong>New Khumbuka update available</strong>
        <span>Update now to load the latest app changes.</span>
      </div>
      <div class="pwa-update-actions">
        <button type="button" class="pwa-update-dismiss" id="pwaUpdateDismiss">Later</button>
        <button type="button" class="pwa-update-now" id="pwaUpdateNow">Update now</button>
      </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector('#pwaUpdateDismiss').addEventListener('click', () => {
      banner.hidden = true;
    });

    banner.querySelector('#pwaUpdateNow').addEventListener('click', () => {
      if (!waitingWorker) {
        window.location.reload();
        return;
      }
      banner.classList.add('is-updating');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    return banner;
  }

  function showUpdateBanner(worker) {
    waitingWorker = worker;
    const banner = createUpdateBanner();
    banner.hidden = false;
  }

  function createConnectionBanner() {
    let banner = document.getElementById('pwaConnectionBanner');
    if (banner) return banner;

    banner = document.createElement('div');
    banner.id = 'pwaConnectionBanner';
    banner.className = 'pwa-connection-banner';
    banner.hidden = true;
    document.body.appendChild(banner);
    return banner;
  }

  function showConnectionMessage(message, state) {
    const banner = createConnectionBanner();
    banner.textContent = message;
    banner.className = `pwa-connection-banner ${state || ''}`.trim();
    banner.hidden = false;

    if (state !== 'offline') {
      window.clearTimeout(banner._timer);
      banner._timer = window.setTimeout(() => {
        banner.hidden = true;
      }, 3500);
    }
  }

  function setupConnectionStatus() {
    if (!navigator.onLine) {
      showConnectionMessage('You are offline. Some live Supabase data may not refresh.', 'offline');
    }

    window.addEventListener('offline', () => {
      showConnectionMessage('You are offline. Some live Supabase data may not refresh.', 'offline');
    });

    window.addEventListener('online', () => {
      showConnectionMessage('Back online. Refreshing latest data...', 'online');

      // Use existing app refresh if available, otherwise reload safely.
      setTimeout(() => {
        if (typeof window.refreshAppData === 'function') {
          window.refreshAppData();
        } else if (typeof window.loadAppData === 'function') {
          window.loadAppData();
        }
      }, 600);
    });
  }

  function watchForWaitingWorker(registration) {
    if (!registration) return;

    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdateBanner(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(newWorker);
        }
      });
    });
  }

  async function checkForUpdates(registration) {
    if (!registration) return;
    try {
      await registration.update();
    } catch (error) {
      console.warn('Khumbuka PWA update check failed:', error);
    }
  }

  function setupUpdateChecks(registration) {
    // Check once after page load.
    setTimeout(() => checkForUpdates(registration), 5000);

    // Check when user returns to the app.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdates(registration);
    });

    window.addEventListener('focus', () => checkForUpdates(registration));

    // Periodic check while app is open. Avoid being too aggressive.
    updateCheckTimer = window.setInterval(() => checkForUpdates(registration), 30 * 60 * 1000);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none'
        });

        watchForWaitingWorker(registration);
        setupUpdateChecks(registration);
      } catch (error) {
        console.warn('Khumbuka PWA service worker registration failed:', error);
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
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

  setupConnectionStatus();
  registerServiceWorker();
})();
