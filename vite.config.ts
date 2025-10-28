import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
type ImageExt = '.jpg' | '.png' | '.gif' | '.webp'

function fixUploadsExtensionsPlugin(): import('vite').Plugin {
  return {
    name: 'fix-uploads-extensions',
    apply: 'serve' as const,
    async configureServer() {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads')
        if (!fs.existsSync(uploadsDir)) return
        const files = fs.readdirSync(uploadsDir)
        const renameMap: Record<string, string> = {}

        function detectExt(buf: Buffer): ImageExt | null {
          // JPEG
          if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return '.jpg'
          // PNG
          if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return '.png'
          // GIF
          if (buf.length >= 6) {
            const sig = buf.subarray(0, 6).toString('ascii')
            if (sig === 'GIF87a' || sig === 'GIF89a') return '.gif'
          }
          // WEBP (RIFF....WEBP)
          if (buf.length >= 12) {
            const riff = buf.subarray(0, 4).toString('ascii')
            const webp = buf.subarray(8, 12).toString('ascii')
            if (riff === 'RIFF' && webp === 'WEBP') return '.webp'
          }
          return null
        }

        for (const name of files) {
          const ext = path.extname(name)
          if (!ext) {
            const full = path.join(uploadsDir, name)
            const buf = fs.readFileSync(full)
            const detected = detectExt(buf)
            if (detected) {
              const newName = `${name}${detected}`
              fs.renameSync(full, path.join(uploadsDir, newName))
              renameMap[name] = newName
            }
          }
        }

        const mapKeys = Object.keys(renameMap)
        if (mapKeys.length) {
          const dataFile = path.join(process.cwd(), 'data', 'trucks.json')
          if (fs.existsSync(dataFile)) {
            const content = fs.readFileSync(dataFile, 'utf8')
            const trucks: Array<{ photoUrl?: string; [key: string]: unknown }> = JSON.parse(content)
            let changed = false
            for (const t of trucks) {
              if (t.photoUrl && typeof t.photoUrl === 'string') {
                const base = t.photoUrl.replace('/uploads/', '')
                if (renameMap[base]) {
                  t.photoUrl = `/uploads/${renameMap[base]}`
                  changed = true
                }
              }
            }
            if (changed) {
              fs.writeFileSync(dataFile, JSON.stringify(trucks, null, 2))
              console.log(`[fix-uploads-extensions] Actualizadas ${mapKeys.length} fotos en data/trucks.json`)
            }
          }
        }
      } catch (err) {
        const e = err as { message?: string }
        console.warn('[fix-uploads-extensions] No se pudo normalizar uploads:', e?.message ?? err)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    fixUploadsExtensionsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Control de Transporte - Portería',
        short_name: 'Transporte',
        description: 'Registro y control en tiempo real de camiones en portería',
        theme_color: '#06b6d4',
        background_color: '#0b1220',
        display: 'standalone',
        lang: 'es',
        orientation: 'portrait',
        icons: [
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: false,
      }
    }
  }
})
