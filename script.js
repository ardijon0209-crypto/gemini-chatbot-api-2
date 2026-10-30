// DOM element references
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = chatForm.querySelector('button[type="submit"]');

// Maintains conversation history in memory for multi-turn chats
const conversation = [];

/**
 * Appends a message element to the chat box and scrolls to bottom.
 * Uses textContent to safely prevent XSS attacks.
 * @param {'user' | 'model'} role
 * @param {string} text
 * @returns {HTMLDivElement}
 */
function appendMessage(role, text) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', `${role}-message`);
  messageEl.textContent = text;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
  return messageEl;
}

// Handle form submission
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // 1. Add user's message to chat box & conversation history
  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });

  // 2. Clear input & disable controls during the request
  userInput.value = '';
  userInput.disabled = true;
  submitButton.disabled = true;

  // 3. Show temporary "Thinking..." message
  const botMessageEl = appendMessage('model', 'Thinking...');

  try {
    // 4. Send POST request with conversation history to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Replace "Thinking..." with AI's reply or show fallback
    if (data && typeof data.result === 'string' && data.result.trim()) {
      botMessageEl.textContent = data.result;
      conversation.push({ role: 'model', text: data.result });
    } else {
      botMessageEl.textContent = 'Sorry, no response received.';
      // Revert user message from history so subsequent prompts don't desync
      conversation.pop();
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    botMessageEl.textContent = 'Failed to get response from server.';
    // Revert user message from history on failure
    conversation.pop();
  } finally {
    // 6. Re-enable controls, refocus input, and keep chat scrolled to bottom
    userInput.disabled = false;
    submitButton.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

