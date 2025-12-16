document.addEventListener("DOMContentLoaded", () => {
  const chatbotContainer = document.getElementById("chatbot-container");
  const sendBtn = document.getElementById("send-btn");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotBody = document.getElementById("chatbot-body");

  if (!chatbotContainer || !sendBtn || !chatbotInput || !chatbotBody) {
    console.warn("Missing chatbot elements");
    return;
  }

  // Replace with your valid API Key
  const API_KEY = "AIzaSyDYik07pd8MahX1NnowbU4ED5_U6Hssi9s";
  // using the newest gemini-2.5-flash which might have a fresh quota
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  let isWaiting = false;

  function createLoadingNode() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";
    loadingDiv.innerHTML = `<div class="loader"></div>`;
    return loadingDiv;
  }

  function cleanBotText(text) {
    if (!text) return "";
    return text.replace(/\*/g, "").trim();
  }

  function formatBotResponse(text) {
    const cleanText = cleanBotText(text);
    const formatted = cleanText.replace(
      /\b(Important|Note|Remember|Tip)\b/gi,
      '<span class="highlight">$1</span>'
    );
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

    // const loadingText = loadingDiv.querySelector("#loading-text"); 

    const maxRetries = 2; // Reduced retries for speed
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            const waitTime = 1000; // Only wait 1s first time
            console.warn(`Rate limit (429). Fast retry in 1s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            attempt++;
            continue;
          }
          if (response.status === 403) {
            throw new Error("API Key Invalid or API not enabled (403 Forbidden)");
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const rawBotText =
          (data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n")) ||
          "Sorry, I couldn't understand that.";

        const formattedMessage = formatBotResponse(rawBotText);
        chatbotBody.removeChild(loadingDiv);
        addMessage(formattedMessage, "bot");
        success = true;

      } catch (err) {
        // If it's a 429 that ran out of retries, or another error
        if (attempt >= maxRetries || !err.message.includes("429")) {
          chatbotBody.removeChild(loadingDiv);
          console.error(err);
          let errorMessage = "Error connecting to server.";
          if (err.message.includes("403")) {
            errorMessage = "Error: Invalid API Key or Permissions. Please check your Google AI Studio key.";
          } else if (err.message.includes("429") || attempt >= maxRetries) {
            errorMessage = "⚠️ Server is busy (Rate Limit). Please try again in a minute.";
          }
          addMessage(errorMessage, "bot");
          success = true; // Exit loop
        }
      }
    }

    isWaiting = false;
    sendBtn.disabled = false;
    chatbotInput.disabled = false;
    chatbotInput.focus();
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
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
