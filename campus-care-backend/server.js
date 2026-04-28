const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (where Assets folder is)
app.use(express.static(path.join(__dirname, '..')));

console.log('Serving files from:', path.join(__dirname, '..'));

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📁 Student Dashboard: http://localhost:${PORT}/Assets/Student_dashboard/SDB.html`);
    console.log(`📁 Admin Dashboard: http://localhost:${PORT}/Assets/Admin_dashboard/Admin.html`);
});