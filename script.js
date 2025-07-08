document.getElementById("folder-input").addEventListener("change", async (event) => {
  const files = [...event.target.files];
  const chatFile = files.find(file => file.name.endsWith(".txt"));

  if (!chatFile) {
    alert("Arquivo .txt da conversa não encontrado!");
    return;
  }

  const chatText = await chatFile.text();
  const lines = chatText.split('\n');
  const container = document.getElementById("chat-container");
  container.innerHTML = "";

  const mediaMap = {};
  const participants = new Set();
  const messages = [];

  for (const file of files) {
    mediaMap[file.name] = URL.createObjectURL(file);
  }

  // Primeiro passo: detectar os dois participantes
  for (const line of lines) {
    const match = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}:\d{2}) - (.*?): (.*)$/);
    if (match) {
      const sender = match[5].trim();
      if (sender.toLowerCase() !== "mensagem apagada" && sender.toLowerCase() !== "null") {
        participants.add(sender);
        if (participants.size >= 2) break;
      }
    }
  }

  const [leftUser, rightUser] = [...participants];

  // Agora renderiza e armazena todas as mensagens
  for (const line of lines) {
    const match = line.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}:\d{2}) - (.*?): (.*)$/);
    if (!match) continue;

    const [_, day, month, year, time, sender, messageRaw] = match;
    const fullDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (messageRaw.trim().toLowerCase() === "null") continue;

    const cleanMessage = messageRaw.replace(/\u200e/g, "").replace(/\(arquivo anexado\)/i, "").trim();

    messages.push({ fullDate, sender, messageRaw, cleanMessage });
  }

  const renderMessages = (startDate = null, endDate = null) => {
    container.innerHTML = "";

    messages.forEach(({ fullDate, sender, messageRaw, cleanMessage }) => {
      if (startDate && fullDate < startDate) return;
      if (endDate && fullDate > endDate) return;

      const div = document.createElement("div");
      div.classList.add("message");

      if (sender === rightUser) {
        div.classList.add("user"); // direita
      } else {
        div.classList.add("other"); // esquerda
      }

      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(cleanMessage) && mediaMap[cleanMessage]) {
        const img = document.createElement("img");
        img.src = mediaMap[cleanMessage];
        div.appendChild(img);
      } else if (/\.opus$/i.test(cleanMessage) && mediaMap[cleanMessage]) {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = mediaMap[cleanMessage];
        div.appendChild(audio);
      } else {
        div.innerText = `${sender}: ${messageRaw}`;
      }

      container.appendChild(div);
    });
  };

  // Exibe tudo inicialmente
  renderMessages();

  const input = document.getElementById("folder-input");
  const fileCount = document.getElementById("file-count");

  input.addEventListener("change", () => {
    const total = input.files.length;
    fileCount.style.display = "block"; // mostra
    fileCount.textContent = total === 0
      ? "Nenhum arquivo selecionado"
      : `${total} arquivo${total > 1 ? "s" : ""} selecionado`;
  });

  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = document.querySelector(".close");

  document.addEventListener("click", function (e) {
    if (e.target.tagName === "IMG" && e.target.closest(".message")) {
      modal.style.display = "block";
      modalImg.src = e.target.src;
    }
  });

  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      modal.style.display = "none";
    }
  });

  // FILTRO POR DATA
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const filterBtn = document.getElementById("apply-filter");

  filterBtn.addEventListener("click", () => {
    const start = startInput.value || null;
    const end = endInput.value || null;
    renderMessages(start, end);
  });
});
