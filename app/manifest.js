// Web app manifest, served by Next at /manifest.webmanifest. Makes the app installable.
export default function manifest(){
  return {
    name: 'Sala School Management',
    short_name: 'Sala SMS',
    description: 'Students, attendance, grades and more for Sala Secondary School.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#EEF2F8',
    theme_color: '#071A33',
    icons: [
      { src:'/icons/icon-192.png', sizes:'192x192', type:'image/png', purpose:'any' },
      { src:'/icons/icon-512.png', sizes:'512x512', type:'image/png', purpose:'any' },
      { src:'/icons/maskable-512.png', sizes:'512x512', type:'image/png', purpose:'maskable' },
    ],
    shortcuts: [
      { name:'Take attendance', url:'/attendance', icons:[{ src:'/icons/icon-192.png', sizes:'192x192' }] },
      { name:'Students', url:'/students', icons:[{ src:'/icons/icon-192.png', sizes:'192x192' }] },
    ],
  };
}
