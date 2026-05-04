import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
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
    }
  },
  // Add this to handle assets correctly
  publicDir: 'Assets',
  resolve: {
    alias: {
      '@': resolve(__dirname, './Assets'),
      '@components': resolve(__dirname, './Assets/Admin_dashboard'),
    }
  }
})