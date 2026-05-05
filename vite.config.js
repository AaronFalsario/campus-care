import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Custom plugin to copy Assets folder
function copyAssets() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const srcDir = join(__dirname, 'Assets')
      const destDir = join(__dirname, 'dist', 'Assets')
      
      function copyFolder(src, dest) {
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
        const items = readdirSync(src)
        for (const item of items) {
          const srcPath = join(src, item)
          const destPath = join(dest, item)
          if (statSync(srcPath).isDirectory()) {
            copyFolder(srcPath, destPath)
          } else {
            copyFileSync(srcPath, destPath)
          }
        }
      }
      
      if (existsSync(srcDir)) {
        copyFolder(srcDir, destDir)
        console.log('✅ Assets folder copied to dist')
      }
    }
  }
}

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'Assets/Admin_dashboard/Admin.html'),
        incidents: resolve(__dirname, 'Assets/Admin_dashboard/incident/incident.html'),
        users: resolve(__dirname, 'Assets/Admin_dashboard/user_page/user.html'),
        settings: resolve(__dirname, 'Assets/Admin_dashboard/settings/setting.html'),
        login: resolve(__dirname, 'Assets/login/admin/admin.html'),
        landing: resolve(__dirname, 'Assets/Landing_page/land.html')
      }
    },
    assetsInlineLimit: 0,
    copyPublicDir: true
  },
  publicDir: false,
  plugins: [copyAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './Assets'),
      '@components': resolve(__dirname, './Assets/Admin_dashboard'),
      '@assets': resolve(__dirname, './Assets')
    }
  }
})