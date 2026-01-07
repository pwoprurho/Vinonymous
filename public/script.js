// DOM Elements
const form = document.getElementById('suggestionForm');
const messageInput = document.getElementById('message');
const charCount = document.getElementById('charCount');
const successMessage = document.getElementById('successMessage');

// Character counter
messageInput.addEventListener('input', () => {
    const count = messageInput.value.length;
    charCount.textContent = count;
    
    if (count > 1000) {
        charCount.style.color = '#ef4444';
    } else {
        charCount.style.color = '#94a3b8';
    }
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    const category = document.getElementById('category').value;
    
    if (!message) {
        shakeForm();
        return;
    }
    
    if (message.length > 1000) {
        alert('Message is too long. Please keep it under 1000 characters.');
        return;
    }
    
    // Disable submit button
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Sending...';
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, category })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Trigger 3D mailbox animation
            if (window.triggerMailAnimation) {
                window.triggerMailAnimation();
            }
            // Delay showing success to let animation play
            setTimeout(() => {
                showSuccess();
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to submit message');
        }
    } catch (error) {
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Submit Anonymously';
    }
});

function showSuccess() {
    form.classList.add('hidden');
    successMessage.classList.remove('hidden');
}

function resetForm() {
    form.reset();
    charCount.textContent = '0';
    form.classList.remove('hidden');
    successMessage.classList.add('hidden');
    
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'Submit Anonymously';
}

function shakeForm() {
    form.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        form.style.animation = '';
    }, 500);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
