require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
};

// Protect admin routes
app.use('/admin', basicAuth);
app.use('/api/admin', basicAuth);

// Serve static files from the current directory
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'codes.json');

// Initialize Database if not exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Generate new 4-digit code (Admin)
app.post('/api/admin/generate', (req, res) => {
    const codes = JSON.parse(fs.readFileSync(DB_FILE));
    let newCode;
    do {
        newCode = Math.floor(1000 + Math.random() * 9000).toString();
    } while (codes[newCode]);

    codes[newCode] = { used: false, generatedAt: new Date().toISOString() };
    fs.writeFileSync(DB_FILE, JSON.stringify(codes, null, 2));
    
    res.json({ success: true, code: newCode });
});

// Get all codes for admin dashboard
app.get('/api/admin/codes', (req, res) => {
    const codes = JSON.parse(fs.readFileSync(DB_FILE));
    res.json({ success: true, codes });
});

// Revoke a code (Admin)
app.post('/api/admin/revoke', (req, res) => {
    const { code } = req.body;
    const codes = JSON.parse(fs.readFileSync(DB_FILE));
    
    if (codes[code]) {
        codes[code].used = true;
        codes[code].revoked = true;
        fs.writeFileSync(DB_FILE, JSON.stringify(codes, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Code not found' });
    }
});

// Unlock endpoint
app.post('/api/unlock', (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid code format' });
    }

    const codes = JSON.parse(fs.readFileSync(DB_FILE));

    if (!codes[code]) {
        return res.status(404).json({ success: false, message: 'Code not found' });
    }

    if (codes[code].revoked) {
        return res.status(403).json({ success: false, message: 'This code has been revoked' });
    }

    if (codes[code].used) {
        return res.status(403).json({ success: false, message: 'Code has already been used' });
    }

    // Mark code as used
    codes[code].used = true;
    codes[code].usedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(codes, null, 2));

    res.json({ success: true, message: 'Chapters unlocked successfully!' });
});

// Verify endpoint (to check if a previously used code is revoked)
app.post('/api/verify', (req, res) => {
    const { code } = req.body;
    const codes = JSON.parse(fs.readFileSync(DB_FILE));

    if (!codes[code]) {
        return res.json({ success: false, revoked: true });
    }

    if (codes[code].revoked) {
        return res.json({ success: false, revoked: true });
    }

    res.json({ success: true, revoked: false });
});

// Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback to index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
