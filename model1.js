let model;


// Merge all datapot lines into one context paragraph


    
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

// Handle user question
async function answerQuestion() {
  const input = document.getElementById('question');
  const question = input.value.trim();
  if (!question) return;

  // Add user message to chat
  appendMessage(question, 'user');
  input.value = '';
  
  
  let wikipediaMainText = "";
  let summary = "";

    async function searchWikipedia() {
      const query = document.getElementById("question").value.trim();
      if (!query) return alert("Please enter a search term.");

      try {
        // Get the article title
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
        const searchData = await searchRes.json();
        const page = searchData.query.search[0];
        if (!page) return document.getElementById("result").textContent = "No results found.";
        const title = page.title;

        // Get summary
        const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        const summaryData = await summaryRes.json();
        summary = summaryData.extract;

        // Get full HTML content
        const htmlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&formatversion=2&format=json&origin=*`);
        const htmlData = await htmlRes.json();
        const rawHTML = htmlData.parse.text;

        // Parse and clean
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHTML, "text/html");

        // Remove unwanted elements
        ['style', 'script', '.infobox', '.reference', 'sup', '.mw-references-wrap', '.navbox', '.metadata', '.mw-editsection', '.hatnote', '.rellink', 'table'].forEach(selector => {
          doc.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Collect visible paragraph text
        const paragraphs = Array.from(doc.querySelectorAll("p"))
          .map(p => p.textContent.trim())
          .filter(p => p.length > 50); // filter out short junk

        wikipediaMainText = paragraphs.join("\n\n");

        // Show + log
        //document.getElementById("result").textContent = `TITLE: ${title}\n\nSUMMARY:\n${summary}\n\nFULL TEXT:\n${wikipediaMainText}`;
        console.log("Clean Article Text:", wikipediaMainText);

      } catch (err) {
        console.error("Error:", err);
        document.getElementById("result").textContent = "Error fetching data.";
      }
    }
    
    
    const context = `${datapot}\n\n${summary}\n\n${wikipediaMainText}`;

   // const context = datapot.join(summary);
    console.log(context);
  
  
  

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