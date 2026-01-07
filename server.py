from flask import Flask, request, jsonify, send_from_directory, session, redirect
import sqlite3
import uuid
import os
from datetime import datetime
from functools import wraps
import hashlib
import secrets

app = Flask(__name__, static_folder='public', static_url_path='')
app.secret_key = secrets.token_hex(32)  # Generate a secure secret key

# Admin credentials (in production, use environment variables and proper hashing)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD_HASH = hashlib.sha256('admin123'.encode()).hexdigest()  # Default password: admin123

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DB_FILE = os.path.join(DATA_DIR, 'messages.db')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with the messages table"""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            message TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            timestamp TEXT NOT NULL,
            read INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized', 'login_required': True}), 401
        return f(*args, **kwargs)
    return decorated_function

# Serve static files
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/admin.html')
def admin_page():
    return send_from_directory('public', 'admin.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    if username == ADMIN_USERNAME and password_hash == ADMIN_PASSWORD_HASH:
        session['admin_logged_in'] = True
        session['admin_username'] = username
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True, 'username': session.get('admin_username')})
    return jsonify({'authenticated': False})

# API Routes

@app.route('/api/messages', methods=['POST'])
def submit_message():
    data = request.get_json()
    message = data.get('message', '').strip()
    category = data.get('category', 'General')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    new_message = {
        'id': str(uuid.uuid4()),
        'message': message,
        'category': category,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'read': 0
    }
    
    conn = get_db()
    conn.execute(
        'INSERT INTO messages (id, message, category, timestamp, read) VALUES (?, ?, ?, ?, ?)',
        (new_message['id'], new_message['message'], new_message['category'], new_message['timestamp'], new_message['read'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Your anonymous message has been submitted!'}), 201

@app.route('/api/messages', methods=['GET'])
@admin_required
def get_messages():
    conn = get_db()
    cursor = conn.execute('SELECT * FROM messages ORDER BY timestamp DESC')
    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # Convert read from int to bool for frontend compatibility
    for msg in messages:
        msg['read'] = bool(msg['read'])
    
    return jsonify(messages)

@app.route('/api/messages/<message_id>/read', methods=['PATCH'])
@admin_required
def mark_read(message_id):
    conn = get_db()
    cursor = conn.execute('UPDATE messages SET read = 1 WHERE id = ?', (message_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Message not found'}), 404
    
    conn.close()
    return jsonify({'success': True})

@app.route('/api/messages/<message_id>', methods=['DELETE'])
@admin_required
def delete_message(message_id):
    conn = get_db()
    cursor = conn.execute('DELETE FROM messages WHERE id = ?', (message_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Message not found'}), 404
    
    conn.close()
    return jsonify({'success': True})

@app.route('/api/stats', methods=['GET'])
@admin_required
def get_stats():
    conn = get_db()
    
    total = conn.execute('SELECT COUNT(*) FROM messages').fetchone()[0]
    unread = conn.execute('SELECT COUNT(*) FROM messages WHERE read = 0').fetchone()[0]
    
    categories = conn.execute('SELECT category, COUNT(*) as count FROM messages GROUP BY category').fetchall()
    by_category = {row['category']: row['count'] for row in categories}
    
    conn.close()
    
    stats = {
        'total': total,
        'unread': unread,
        'byCategory': by_category
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    print('🎯 Anonymous Suggestion Box running at http://localhost:3000')
    print('📝 Submit suggestions at http://localhost:3000')
    print('👀 View submissions at http://localhost:3000/admin.html')
    app.run(host='0.0.0.0', port=3000, debug=True)
