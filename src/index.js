const self = this;
const createServiceWorker = (cache = [], cacheName) => {
	if (!cacheName) cacheName = Math.random().toString(36).substr(2, 9);
    
	return new LazyWorker(cacheName, cache)
};

class LazyWorker {
    constructor(cacheName, filesToCache) {
			this.cacheName = cacheName;
			this.files = filesToCache;
			this.handleOfflinePage = false;
			this.debug = false;
			}

			handleInstall(event) {
				const self = this;
				event.waitUntil((async function installEvent() {
					const cache = await caches.open(self.cacheName);
					this.log(`Adding ${self.files} to cache.`);
					await cache.addAll(self.files);
				}()));
			}

			handleActivate() {

			}

			handleFetch(event) {
				const self = this;
				const { request } = event;
				// Prevent the default, and handle the request ourselves.
				event.respondWith(async function fetchEvent() {
					// Try to get the response from a cache.
					const cachedResponse = await caches.match(request, { cacheName: self.cacheName });
					if (cachedResponse) return cachedResponse;
					// if nothing's in the cache, return a fetch request
					// catch an error to serve offline pages
					return fetch(request).catch(err => {
						if (this.handleOfflinePage) {
							self.log('Fetch failed; returning offline page instead.', err);
							return caches.match(self.offlinePage);
						} else {
							self.log('Unable to fetch, and offline pages disabled. Dying...');
							throw err;
						}
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
			
			set debug() {
				this.debug = true;
				return this;
			}

			log(...messages) {
				if (this.debug) {
					console.log('[worker]', ...messages);
				}
			}
			
			maxAge(age) {
				// do max age stuff
				return this;
			}
			
			init() {
				self.addEventListener('install', this.handleInstall);
				self.addEventListener('activate', this.handleActivate);
				self.addEventListener('fetch', this.handleFetch);
				return this;
		}


}

export default createServiceWorker;
