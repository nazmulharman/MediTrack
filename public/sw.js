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
    "revision": "d7ea9777d4e6cada93b422ee386de65e"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d029580e1671a708b251aabfb2b7bde3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "dc7be7eeb5767d89df0f239066c981ac"
  }, {
    "url": "pwa-192x192.png",
    "revision": "837685070e23b4d03df2bc7f7e2674a3"
  }, {
    "url": "index.html",
    "revision": "00aef8b8dea1646e686577b331d77202"
  }, {
    "url": "icon.svg",
    "revision": "4f2f7b9c93042c6ed377239858d6d44d"
  }, {
    "url": "favicon.ico",
    "revision": "ca52235953141882ce950c5c4a9006f4"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0268dfc1212818dd75f87c86ccf0e28f"
  }, {
    "url": "assets/rolldown-runtime-hePW80VL.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-51wk-8wU.js",
    "revision": null
  }, {
    "url": "assets/index-DUfri9dx.css",
    "revision": null
  }, {
    "url": "assets/index-BOxQ6jpQ.js",
    "revision": null
  }, {
    "url": "assets/firebase-vendor-Dew-75XW.js",
    "revision": null
  }, {
    "url": "assets/chart-vendor-BZ8UfOfg.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0268dfc1212818dd75f87c86ccf0e28f"
  }, {
    "url": "favicon.ico",
    "revision": "ca52235953141882ce950c5c4a9006f4"
  }, {
    "url": "icon.svg",
    "revision": "4f2f7b9c93042c6ed377239858d6d44d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "837685070e23b4d03df2bc7f7e2674a3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "dc7be7eeb5767d89df0f239066c981ac"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d029580e1671a708b251aabfb2b7bde3"
  }, {
    "url": "manifest.json",
    "revision": "8ed0917aa9ba1d0dd0f765602a055d52"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
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
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
