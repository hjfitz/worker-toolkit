const self = this;
const createServiceWorker = (cache = [], cacheName) => {
	if (!cacheName) cacheName = Math.random().toString(36).substr(2, 9);
    
	return new LazyWorker(cacheName, cache);
};

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

			handleInstall(event) {
				const _this = this;
				event.waitUntil((async function installEvent() {
					const cache = await caches.open(_this.cacheName);
					_this.log(`Adding ${_this.files} to cache.`);
					await cache.addAll(_this.files);
					if (_this.skip) {
						return self.skipWaiting();
					}
				}()));
			}

			handleActivate() {

			}

			handleFetch(event) {
				const _this = this;
				const { request } = event;
				// Prevent the default, and handle the request ourselves.
				event.respondWith(async function fetchEvent() {
					// Try to get the response from a cache.
					const cachedResponse = await caches.match(request, { cacheName: _this.cacheName });
					if (cachedResponse) return cachedResponse;
					// if nothing's in the cache, return a fetch request
					// catch an error to serve offline pages
					return fetch(request).catch(err => {
						if (_this.handleOfflinePage) {
							_this.log('Fetch failed; returning offline page instead.', err);
							return caches.match(_this.offlinePage);
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
				console.log(this);
				return this;
			}
			
			debug() {
				this.debugLogging = true;
				return this;
			}

			skipWaiting() {
				this.skip = true;
			}

			log(...messages) {
				if (this.debugLogging) {
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

createServiceWorker(['/style.css']).debug().offline('/offline.html').init()
