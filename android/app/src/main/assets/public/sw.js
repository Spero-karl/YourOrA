/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6ce984b7e2e7d347aa55512428573b39"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1af802b6b3230ef8b6201419d292a0dd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "afdaac7a5ee11a21951787858e497e9f"
  }, {
    "url": "index.html",
    "revision": "8a3ea294ed9ae5a68ac8f7c1a11b7d58"
  }, {
    "url": "icon.svg",
    "revision": "9744aabf09430b76e13449234532e2b0"
  }, {
    "url": "favicon-32x32.png",
    "revision": "a1fe37cefe6138bddc26fa8593aff503"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "49e4ae42dd5125cb77ada3ed9e314b9d"
  }, {
    "url": "assets/index-pVg-KbHe.js",
    "revision": null
  }, {
    "url": "assets/index-BlWXZ548.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "49e4ae42dd5125cb77ada3ed9e314b9d"
  }, {
    "url": "favicon-32x32.png",
    "revision": "a1fe37cefe6138bddc26fa8593aff503"
  }, {
    "url": "icon.svg",
    "revision": "9744aabf09430b76e13449234532e2b0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "afdaac7a5ee11a21951787858e497e9f"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1af802b6b3230ef8b6201419d292a0dd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6ce984b7e2e7d347aa55512428573b39"
  }, {
    "url": "manifest.webmanifest",
    "revision": "53506aee1a235387016802d818a94aec"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/i, new workbox.CacheFirst({
    "cacheName": "ora-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 5184000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
