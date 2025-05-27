// model.js

let model;

// Merge all datapot lines into one context paragraph
const context = datapot.join(' ');

// Load the QnA model
async function loadModel() {
  const askBtn = document.getElementById('askBtn');
  const chat = document.getElementById('chat');

  askBtn.disabled = true;
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'text-gray-500 italic';
  loadingMsg.textContent = 'Loading model, please wait...';
  chat.appendChild(loadingMsg);

  model = await qna.load();

  askBtn.disabled = false;
  loadingMsg.remove();
}

// Handle user question
async function answerQuestion() {
  const input = document.getElementById('question');
  const question = input.value.trim();
  if (!question) return;

  // Add user message to chat
  appendMessage(question, 'user');
  input.value = '';

  // AI is thinking...
  const thinking = appendMessage('Thinking...', 'bot');

  // Get answer from model
  const answers = await model.findAnswers(question, context);
  thinking.remove();

  if (answers.length > 0) {
    appendMessage(answers[0].text, 'bot');
  } else {
    appendMessage('No answer found.', 'bot');
  }
}

// Add message to chat window
function appendMessage(text, sender = 'bot') {
  const chat = document.getElementById('chat');

  const bubble = document.createElement('div');
  bubble.className = `
    max-w-full px-4 py-3 rounded-xl whitespace-pre-wrap
    ${sender === 'user' ? 'bg-black text-white self-end ml-auto' : 'bg-gray-100 text-black self-start mr-auto'}
  `;

  bubble.textContent = text;

  const wrapper = document.createElement('div');
  wrapper.className = 'flex w-full';
  wrapper.appendChild(bubble);

  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;

  return bubble;
}

// Set up event
document.getElementById('askBtn').addEventListener('click', answerQuestion);
document.getElementById('question').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') answerQuestion();
});

// Initialize
loadModel();
