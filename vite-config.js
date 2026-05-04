import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  base: '/', // Important for Vercel
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
    // Ensure assets are copied correctly
    assetsInlineLimit: 0,
    copyPublicDir: true
  },
  // Don't use publicDir - keep default 'public' folder instead
  // Move your Assets folder to 'public' or use proper imports
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, './Assets'),
      '@components': resolve(__dirname, './Assets/Admin_dashboard'),
      '@assets': resolve(__dirname, './Assets')
    }
  }
})