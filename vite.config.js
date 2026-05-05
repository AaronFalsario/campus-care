import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// Plugin to copy land.html to dist
function copyLandingPage() {
  return {
    name: 'copy-landing',
    closeBundle() {
      const src = 'land.html'
      const dest = 'dist/land.html'
      if (existsSync(src)) {
        if (!existsSync('dist')) mkdirSync('dist')
        copyFileSync(src, dest)
        console.log('✅ land.html copied to dist')
      }
    }
  }
}

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
  },
  plugins: [copyLandingPage()]
})