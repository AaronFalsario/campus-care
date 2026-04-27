const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock data
let penalties = [
    { id: 1, studentId: 'STU-2024-1001', violation: 'Littering', hours: 4, status: 'pending', deadline: '2024-05-15' },
    { id: 2, studentId: 'STU-2024-1001', violation: 'Uniform Violation', hours: 2, status: 'completed', deadline: '2024-04-20' },
];

let students = [
    { id: 'STU-2024-1001', name: 'Juan Dela Cruz', course: 'BSIT', year: 3, email: 'juan@campus.edu' },
];

let announcements = [
    { id: 1, title: 'Campus Clean-up Day', content: 'Join us this Saturday at 8am', date: '2024-05-01' },
];

// API Routes
app.get('/api/penalties', (req, res) => {
    const studentId = req.query.studentId;
    let result = penalties;
    if (studentId) {
        result = penalties.filter(p => p.studentId === studentId);
    }
    res.json({ success: true, data: result });
});

app.get('/api/stats', (req, res) => {
    const stats = {
        totalStudents: students.length,
        totalPenalties: penalties.length,
        pendingPenalties: penalties.filter(p => p.status === 'pending').length,
        completedHours: penalties.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.hours, 0),
    };
    res.json({ success: true, data: stats });
});

app.get('/api/students', (req, res) => {
    res.json({ success: true, data: students });
});

app.get('/api/announcements', (req, res) => {
    res.json({ success: true, data: announcements });
});

// For Vercel - export the app
module.exports = app;

// Only listen if not on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}