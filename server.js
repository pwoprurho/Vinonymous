const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper functions
function readMessages() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeMessages(messages) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

// API Routes

// Submit a new anonymous message
app.post('/api/messages', (req, res) => {
    const { message, category } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const newMessage = {
        id: uuidv4(),
        message: message.trim(),
        category: category || 'General',
        timestamp: new Date().toISOString(),
        read: false
    };

    const messages = readMessages();
    messages.unshift(newMessage);
    writeMessages(messages);

    res.status(201).json({ success: true, message: 'Your anonymous message has been submitted!' });
});

// Get all messages (for admin view)
app.get('/api/messages', (req, res) => {
    const messages = readMessages();
    res.json(messages);
});

// Mark message as read
app.patch('/api/messages/:id/read', (req, res) => {
    const { id } = req.params;
    const messages = readMessages();
    const messageIndex = messages.findIndex(m => m.id === id);
    
    if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    messages[messageIndex].read = true;
    writeMessages(messages);
    res.json({ success: true });
});

// Delete a message
app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    let messages = readMessages();
    const initialLength = messages.length;
    messages = messages.filter(m => m.id !== id);
    
    if (messages.length === initialLength) {
        return res.status(404).json({ error: 'Message not found' });
    }

    writeMessages(messages);
    res.json({ success: true });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const messages = readMessages();
    const stats = {
        total: messages.length,
        unread: messages.filter(m => !m.read).length,
        byCategory: {}
    };

    messages.forEach(m => {
        stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
    });

    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`🎯 Anonymous Suggestion Box running at http://localhost:${PORT}`);
    console.log(`📝 Submit suggestions at http://localhost:${PORT}`);
    console.log(`👀 View submissions at http://localhost:${PORT}/admin.html`);
});
