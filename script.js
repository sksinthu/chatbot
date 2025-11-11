document.addEventListener("DOMContentLoaded", () => {
  const chatbotContainer = document.getElementById("chatbot-container");
  const sendBtn = document.getElementById("send-btn");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotBody = document.getElementById("chatbot-body");

  if (!chatbotContainer || !sendBtn || !chatbotInput || !chatbotBody) {
    console.warn("Missing chatbot elements");
    return;
  }

   const API_KEY = "AIzaSyCbwpJyMLK7J3btaApB7-5Szwqn-r9ZWcw"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  let isWaiting = false;

  function createLoadingNode() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";
    loadingDiv.innerHTML =
      `<div class="loader"></div>`;
    return loadingDiv;
  }
function cleanBotText(text) {
  if (!text) return "";
  
  // Remove stars or asterisks used for emphasis
  let cleaned = text.replace(/\*+/g, ""); 

  // Optional: trim extra spaces
  cleaned = cleaned.trim();

  return cleaned;
}

 function formatBotResponse(text) {
  const cleanText = cleanBotText(text);

  // Highlight important keywords and make them bigger/darker
  const formatted = cleanText.replace(
    /\b(Important|Note|Remember|Tip)\b/gi,
    '<span class="highlight">$1</span>'
  );

  // Preserve line breaks
  return formatted.replace(/\n/g, "<br>");
}


  async function getBotResponse(userMessage) {
    if (isWaiting) return;
    isWaiting = true;
    sendBtn.disabled = true;
    chatbotInput.disabled = true;

    const loadingDiv = createLoadingNode();
    chatbotBody.appendChild(loadingDiv);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const rawBotText =
        (data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n")) ||
        "Sorry, I couldn't understand that.";<div class="logo-circle">
        <div class="logo-core"></div>
      </div>

      const formattedMessage = formatBotResponse(rawBotText);

      if (loadingDiv.parentNode === chatbotBody) chatbotBody.removeChild(loadingDiv);
      addMessage(formattedMessage, "bot");
    } catch (err) {
      if (loadingDiv.parentNode === chatbotBody) chatbotBody.removeChild(loadingDiv);
      console.error(err);
      addMessage("Error connecting to server. Please try again.", "bot");
    } finally {
      isWaiting = false;
      sendBtn.disabled = false;
      chatbotInput.disabled = false;
      chatbotBody.scrollTop = chatbotBody.scrollHeight;
      chatbotInput.focus();
    }
  }

  function addMessage(htmlContent, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = htmlContent;
    chatbotBody.appendChild(msgDiv);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }

  function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message || isWaiting) return;
    addMessage(message, "user");
    chatbotInput.value = "";
    chatbotInput.focus();
    getBotResponse(message);
  }

  sendBtn.addEventListener("click", sendMessage);
  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
