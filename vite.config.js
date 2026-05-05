import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  server: {
    port: 3000,
    open: true
  },
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
        landing: resolve(__dirname, 'Assets/Landing_page/land.html'),
        report: resolve(__dirname, 'Assets/Student_reporting/report.html'),
        studentDashboard: resolve(__dirname, 'Assets/Student_dashboard/SDB.html'),
        studentSettings: resolve(__dirname, 'Assets/Student_dashboard/setting/setting.html')
      }
    },
    assetsInlineLimit: 0
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './Assets'),
      '@components': resolve(__dirname, './Assets/Admin_dashboard'),
      '@assets': resolve(__dirname, './Assets')
    }
  }
})