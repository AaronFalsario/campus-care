import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'Assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'land.html'),
        studentDashboard: resolve(__dirname, 'Assets/Student_dashboard/SDB.html'),
        adminDashboard: resolve(__dirname, 'Assets/Admin_dashboard/Admin.html'),
        adminLogin: resolve(__dirname, 'Assets/login/admin/admin.html'),
        studentLogin: resolve(__dirname, 'Assets/login/log.html'),
        reportPage: resolve(__dirname, 'Assets/Student_reporting/report.html'),
        adminIncidents: resolve(__dirname, 'Assets/Admin_dashboard/incident/incident.html'),
        adminUsers: resolve(__dirname, 'Assets/Admin_dashboard/user_page/user.html'),
        adminSettings: resolve(__dirname, 'Assets/Admin_dashboard/settings/setting.html'),
        studentSettings: resolve(__dirname, 'Assets/Student_dashboard/setting/setting.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})