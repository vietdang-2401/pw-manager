const VERSION = '0.0.0';

self.addEventListener('install', (event) =>
    event.waitUntil(
        caches.open('v1').then((cache) =>
            fetch('.?v=' + VERSION).then((response) => {
                if (response.ok) {
                    return cache.put('.', response);
                }
            })
        )
    )
);

self.addEventListener('fetch', (event) => {
    console.log('service-worker fetch');
    event.respondWith(
        caches.match(event.request.url).then((response) => response || fetch(event.request))
    );
});
