import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FriendsFest — Organize · Connect · Celebrate',
    short_name: 'FriendsFest',
    description: 'Organizza eventi di gruppo con i tuoi amici e condividi su WhatsApp',
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone'],
    orientation: 'portrait',
    categories: ['social', 'entertainment'],
    background_color: '#140727',
    theme_color: '#140727',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
