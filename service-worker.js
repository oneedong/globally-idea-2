// 캐시 이름 설정
const CACHE_NAME = 'kb-contract-system-v1';

// 캐시할 파일 목록
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/styles.css',
  '/script.js',
  '/dashboard.js',
  '/manifest.json',
  '/images/KB_logo_cut_trim.png',
  '/images/kb-logo.png',
  '/images/login-bg.svg',
  '/images/KB sec_hompage.jpg',
  '/images/KB sec_hompage_2.jpg'
];

// 서비스 워커 설치 시 캐시 파일 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 생성 완료');
        return cache.addAll(urlsToCache);
      })
  );
});

// 네트워크 요청 시 캐시된 파일 사용
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 찾으면 캐시된 응답 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then(response => {
            // 유효한 응답이 아니면 그냥 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// 서비스 워커 활성화 시 이전 캐시 정리
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 