import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'Assets',  // Force capital 'A' - THIS IS THE FIX
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'land.html'),
        admin: resolve(__dirname, 'Assets/Admin_dashboard/Admin.html'),
        incidents: resolve(__dirname, 'Assets/Admin_dashboard/incident/incident.html'),
        users: resolve(__dirname, 'Assets/Admin_dashboard/user_page/user.html'),
        settings: resolve(__dirname, 'Assets/Admin_dashboard/settings/setting.html'),
        login: resolve(__dirname, 'Assets/login/admin/admin.html'),
        report: resolve(__dirname, 'Assets/Student_reporting/report.html'),
        studentDashboard: resolve(__dirname, 'Assets/Student_dashboard/SDB.html'),
        studentSettings: resolve(__dirname, 'Assets/Student_dashboard/setting/setting.html')
      }
    }
  },
  publicDir: false,  // Don't copy public folder
  server: {
    port: 3000,
    open: true
  }
})