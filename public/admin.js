// State
let messages = [];
let currentFilter = 'all';
let lastMessageCount = 0;
let notificationsEnabled = false;
let isAuthenticated = false;

// DOM Elements
const messagesList = document.getElementById('messagesList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const totalCount = document.getElementById('totalCount');
const unreadCount = document.getElementById('unreadCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const loginModal = document.getElementById('loginModal');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Notification sound (base64 encoded short beep)
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+al4yCc2hufIqVnp+ZkYR2aGh0hJOcoJyThXdpZW9+jZieoJqNfnBnbHuKl5+gnpOEd2tqc4KQnJ6emot/c2xwfYqYnp+alIZ5b2x0gI+anp6Xin14cHF4hZKbnpyUiHt0cXR7hpKanJmShn13c3V6g4+YmpaRhH14dXh+hY+Wl5SOgn15d3l+hI2UlZKNgX56eHp/hIySkpGMgH97eXt/g4qQkI+KgH98enx/goiNjo2JgH99e3x/goeKjIuIgH9+fH1/gYaJiomHgH9+fX5/gYWHiIeGgH9/fn5/gYSGhoWFgIB/f39/gYOEhYSEgICAf4CAgYKDhIODgICAgICAgIGCgoKCgoCAf3+AgICBgYGBgIB/f3+Af4CBgYGAgH9/f39/gICAgICAf39/f39/f4CAgIB/f39/f39/f3+AgIB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38=');

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationsEnabled = permission === 'granted';
        updateNotificationButton();
    }
}

// Show browser notification
function showNotification(title, body) {
    if (notificationsEnabled && document.hidden) {
        new Notification(title, {
            body: body,
            icon: '📬',
            badge: '📬',
            tag: 'new-message',
            requireInteraction: false
        });
    }
    
    // Play sound
    notificationSound.play().catch(() => {});
    
    // Flash the title
    flashTitle('📬 New Message!');
}

// Flash browser tab title
let originalTitle = document.title;
let flashInterval = null;

function flashTitle(newTitle) {
    if (flashInterval) clearInterval(flashInterval);
    
    let isOriginal = true;
    flashInterval = setInterval(() => {
        document.title = isOriginal ? newTitle : originalTitle;
        isOriginal = !isOriginal;
    }, 1000);
    
    // Stop flashing when tab becomes visible
    setTimeout(() => {
        if (flashInterval) {
            clearInterval(flashInterval);
            document.title = originalTitle;
        }
    }, 10000);
}

// Stop flashing when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && flashInterval) {
        clearInterval(flashInterval);
        flashInterval = null;
        document.title = originalTitle;
    }
});

// Update notification button state
function updateNotificationButton() {
    const btn = document.getElementById('notificationBtn');
    if (btn) {
        if (notificationsEnabled) {
            btn.classList.add('enabled');
            btn.innerHTML = '🔔 Notifications On';
        } else {
            btn.classList.remove('enabled');
            btn.innerHTML = '🔕 Enable Notifications';
        }
    }
}

// Create notification toggle button
function createNotificationButton() {
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft && !document.getElementById('notificationBtn')) {
        const btn = document.createElement('button');
        btn.id = 'notificationBtn';
        btn.className = 'notification-btn';
        btn.innerHTML = '🔕 Enable Notifications';
        btn.onclick = requestNotificationPermission;
        headerLeft.appendChild(btn);
        
        // Check if already granted
        if ('Notification' in window && Notification.permission === 'granted') {
            notificationsEnabled = true;
            updateNotificationButton();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupLoginForm();
    setupLogout();
});

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.authenticated) {
            showAdminPanel();
        } else {
            showLoginModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLoginModal();
    }
}

// Show login modal
function showLoginModal() {
    isAuthenticated = false;
    loginModal.classList.remove('hidden');
    adminContent.classList.add('hidden');
}

// Show admin panel
function showAdminPanel() {
    isAuthenticated = true;
    loginModal.classList.add('hidden');
    adminContent.classList.remove('hidden');
    
    createNotificationButton();
    loadMessages();
    setupFilters();
    
    // Auto-refresh every 10 seconds
    setInterval(checkForNewMessages, 10000);
}

// Setup login form
function setupLoginForm() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                loginError.classList.add('hidden');
                showAdminPanel();
            } else {
                loginError.textContent = data.error || 'Login failed';
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            loginError.textContent = 'Connection error. Please try again.';
            loginError.classList.remove('hidden');
        }
    });
}

// Setup logout
function setupLogout() {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            showLoginModal();
            // Clear form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

async function checkForNewMessages() {
    if (!isAuthenticated) return;
    
    try {
        const response = await fetch('/api/messages');
        
        if (response.status === 401) {
            showLoginModal();
            return;
        }
        
        const newMessages = await response.json();
        
        const newUnreadCount = newMessages.filter(m => !m.read).length;
        const oldUnreadCount = messages.filter(m => !m.read).length;
        
        // Check if there are new messages
        if (newMessages.length > messages.length) {
            const diff = newMessages.length - messages.length;
            showNotification(
                'New Anonymous Message!', 
                `You have ${diff} new message${diff > 1 ? 's' : ''} in your suggestion box.`
            );
        }
        
        messages = newMessages;
        updateStats();
        renderMessages();
    } catch (error) {
        console.error('Error checking for messages:', error);
    }
}

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        
        if (response.status === 401) {
            showLoginModal();
            return;
        }
        
        messages = await response.json();
        
        loadingState.classList.add('hidden');
        updateStats();
        renderMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
        loadingState.innerHTML = '<p>Error loading messages. Please refresh the page.</p>';
    }
}

function updateStats() {
    totalCount.textContent = messages.length;
    unreadCount.textContent = messages.filter(m => !m.read).length;
}

function renderMessages() {
    const filtered = filterMessages(messages);
    
    if (filtered.length === 0) {
        messagesList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    messagesList.innerHTML = filtered.map(message => `
        <div class="message-card ${message.read ? '' : 'unread'}" data-id="${message.id}">
            <div class="message-header">
                <span class="category-badge">${escapeHtml(message.category)}</span>
                <span class="message-time">${formatDate(message.timestamp)}</span>
            </div>
            <div class="message-content">${escapeHtml(message.message)}</div>
            <div class="message-actions">
                ${!message.read ? `
                    <button class="action-btn mark-read-btn" onclick="markAsRead('${message.id}')">
                        ✓ Mark as Read
                    </button>
                ` : ''}
                <button class="action-btn delete-btn" onclick="deleteMessage('${message.id}')">
                    🗑 Delete
                </button>
            </div>
        </div>
    `).join('');
}

function filterMessages(messages) {
    if (currentFilter === 'all') {
        return messages;
    }
    if (currentFilter === 'unread') {
        return messages.filter(m => !m.read);
    }
    return messages.filter(m => m.category === currentFilter);
}

function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderMessages();
        });
    });
}

async function markAsRead(id) {
    try {
        const response = await fetch(`/api/messages/${id}/read`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            const message = messages.find(m => m.id === id);
            if (message) {
                message.read = true;
                updateStats();
                renderMessages();
            }
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            messages = messages.filter(m => m.id !== id);
            updateStats();
            renderMessages();
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
