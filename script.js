const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendBtn = document.querySelector("#send-text");
const fileInput = document.querySelector("#file-input");
const fileWrapper = document.querySelector(".file-wrapper");
const fileCancelBtn = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeBtn = document.querySelector("#close-btn");

const API_KEY = "YOUR_API_KEY_HERE";
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;
const contentParent = (childDiv, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = childDiv;
  return div;
};

const getBotResponse = async (incominggoingMsgDiv) => {
  const botMsg = incominggoingMsgDiv.querySelector(".message-text");
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data ? [{ inline_data: userData.file }] : []),
    ],
  });
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [chatHistory],
    }),
  };
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, requestOptions);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error.message);
    const apiResponse = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    botMsg.innerText = apiResponse;
    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponse }],
    });
  } catch (error) {
    botMsg.innerText = error.message;
    botMsg.style.color = "#ff0000";
  } finally {
    userData.file = {};
    incominggoingMsgDiv.classList.remove("dot-thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

const handleOutgoingMessage = () => {
  userData.message = messageInput.value.trim();
  fileWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));

  if (userData.message.length === 0) return;

  const divContent = `<div class="message-text"></div>
    ${
      userData.file.data
        ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}"   class="attachment" />`
        : ""
    }`;
  const outgoingMsgDiv = contentParent(divContent, "user-message");
  outgoingMsgDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMsgDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  messageInput.value = "";

  setTimeout(() => {
    const divContent = `<i  id="bot-avatar"  class="fa-solid fa-robot"></i>
          <div class="message-text">
            <div class="bot-thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;
    const incominggoingMsgDiv = contentParent(
      divContent,
      "bot-message",
      "dot-thinking"
    );

    chatBody.appendChild(incominggoingMsgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    getBotResponse(incominggoingMsgDiv);
  }, 600);
};
messageInput.addEventListener("keydown", (e) => {
  const userMsg = e.target.value.trim();
  if (
    e.key === "Enter" &&
    userMsg.length > 0 &&
    !e.shiftKey &&
    window.innerWidth > 768
  ) {
    e.preventDefault(); // stop newline

    handleOutgoingMessage();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32";
});

sendBtn.addEventListener("click", (e) => {
  e.preventDefault(); // stop newline

  handleOutgoingMessage();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileWrapper.querySelector("img").src = e.target.result;
    fileWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
    fileInput.value = "";
  };

  reader.readAsDataURL(file);
});

fileCancelBtn.addEventListener("click", () => {
  userData.file = {};
  fileWrapper.classList.remove("file-uploaded");
});

const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);
document.querySelector("#file-upload").addEventListener("click", () => {
  fileInput.click();
});

chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chat-popup");
});
closeBtn.addEventListener("click", () => {
  document.body.classList.remove("show-chat-popup");
});
