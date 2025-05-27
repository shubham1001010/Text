// Merge all datapot lines into one context paragraph
let context = datapot.join(' ');

// Load the QnA model
async function loadModel() {
  const askBtn = document.getElementById('askBtn');
  const chat = document.getElementById('chat');

  askBtn.disabled = true;
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'loading-message';
  loadingMsg.textContent = 'Loading model, please wait...';
  chat.appendChild(loadingMsg);

  model = await qna.load();

  askBtn.disabled = false;
  loadingMsg.remove();
}

// Smart Wikipedia search
async function fetchWikipediaSummary(query) {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`);
    const searchData = await searchRes.json();

    if (searchData.query.search.length === 0) return '';

    const firstTitle = searchData.query.search[0].title;

    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
    const summaryData = await summaryRes.json();

    return summaryData.extract || '';
  } catch (e) {
    console.error('Wikipedia fetch error:', e);
    return '';
  }
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

  // Fetch Wikipedia content and merge with existing context
  const wikiContent = await fetchWikipediaSummary(question);
  const fullContext = `${context} ${wikiContent}`;

  // Get answer from model
  const answers = await model.findAnswers(question, fullContext);
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
  bubble.className = `message-bubble ${sender === 'user' ? 'user' : 'bot'}`;
  bubble.textContent = text;

  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper';
  wrapper.appendChild(bubble);

  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;

  return bubble;
}

// Set up event listeners
document.getElementById('askBtn').addEventListener('click', answerQuestion);
document.getElementById('question').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') answerQuestion();
});

// Initialize
loadModel();
