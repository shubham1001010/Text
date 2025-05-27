let encoderModel;
let bestMatch = null;

async function loadEncoder() {
  const use = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder');
  encoderModel = await use.load();
  console.log("Universal Encoder loaded");
}

async function fetchData() {
  const res = await fetch('res/data.json');
  const json = await res.json();
  return json;
}

async function getBestSemanticMatch(input, dataArray) {
  const sentences = dataArray.map(d => d.text || d); // handle objects or strings
  const inputEmbeddings = await encoderModel.embed([input]);
  const dataEmbeddings = await encoderModel.embed(sentences);

  const inputVec = inputEmbeddings.arraySync()[0];
  const dataVecs = dataEmbeddings.arraySync();

  let maxScore = -Infinity;
  let bestIndex = -1;

  for (let i = 0; i < dataVecs.length; i++) {
    const score = cosineSimilarity(inputVec, dataVecs[i]);
    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
    }
  }

  bestMatch = sentences[bestIndex];
  console.log("Best match:", bestMatch);
  console.log("Score:", maxScore.toFixed(4));
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

function appendChat(message, from = 'user') {
  const chat = document.getElementById("chat");
  const bubble = document.createElement("div");
  bubble.className = from === 'user' ? "chat-bubble user" : "chat-bubble ai";
  bubble.innerText = message;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

document.getElementById("sendBtn").addEventListener("click", async () => {
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  appendChat(input, 'user');
  document.getElementById("userInput").value = "";

  const data = await fetchData();
  await getBestSemanticMatch(input, data);

  // You can now use 'bestMatch' elsewhere
  appendChat("Best related topic: " + bestMatch, 'ai');
});

// Load encoder on page load
loadEncoder();
