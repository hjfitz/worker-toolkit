class LazyWorker {
  constructor(cacheName, filesToCache) {
    this.cacheName = cacheName;
    this.files = filesToCache;
    this.handleOfflinePage = false;
    this.debugLogging = false;
    this.handleInstall = this.handleInstall.bind(this);
    this.handleActivate = this.handleActivate.bind(this);
    this.handleFetch = this.handleFetch.bind(this);
  }

  /**
   *
   * @param {} event
   */
  handleInstall(event) {
    const thisWorker = this;
    event.waitUntil((async function installEvent() {
      const cache = await caches.open(thisWorker.cacheName);
      thisWorker.log(`Adding ${thisWorker.files} to cache.`);
      await cache.addAll(thisWorker.files);
      if (thisWorker.skip) self.skipWaiting();
    }()));
  }

  handleActivate(event) {
    const thisWorker = this;
    event.waitUntil((async function activateEvent() {
      const keys = await caches.keys();
      if (thisWorker.skip) {
        //
      }
      return Promise.all(
        keys
          .filter(key => key !== thisWorker.cacheName)
          .map(name => caches.delete(name)),
      );
    })());
  }

  handleFetch(event) {
    const thisWorker = this;
    const { request } = event;
    // Prevent the default, and handle the request ourselves.
    event.respondWith(async function fetchEvent() {
      // Try to get the response from a cache.
      const cachedResponse = await caches.match(request, { cacheName: thisWorker.cacheName });
      if (cachedResponse) return cachedResponse;
      // if nothing's in the cache, return a fetch request
      // catch an error to serve offline pages
      return fetch(request).catch((err) => {
        if (thisWorker.handleOfflinePage) {
          thisWorker.log('Fetch failed; returning offline page instead.', err);
          return caches.match(thisWorker.offlinePage);
        }
        self.log('Unable to fetch, and offline pages disabled. Dying...');
        throw err;
      });
    }());
  }


  offline(filename) {
    this.log('enabling offline page');
    this.offlinePage = filename;
    this.files.push(filename);
    this.handleOfflinePage = true;
    return this;
  }

  debug() {
    this.debugLogging = true;
    return this;
  }

  skipWaiting() {
    this.skip = true;
    return this;
  }

  log(...messages) {
    if (this.debugLogging) {
      console.log('[worker]', ...messages);
    }
  }

  /**
   * Only let the worker live for a number of days
   * @param {Number} age Age of the worker in *days*
   */
  maxAge(age) {
    // do max age stuff
    this.log('not implemented yet!');
    return this;
  }

  init() {
    self.addEventListener('install', this.handleInstall);
    self.addEventListener('activate', this.handleActivate);
    self.addEventListener('fetch', this.handleFetch);
    return this;
  }
}

const createServiceWorker = (cache = [], name) => {
  // default to a randomly generated name
  let cacheName = name;
  // radix 36 gives us a-z
  if (!name) cacheName = Math.random().toString(36).substr(2, 9);

  return new LazyWorker(cacheName, cache);
};

export default createServiceWorker;

// createServiceWorker(['/style.css']).debug().offline('/offline.html').init()
