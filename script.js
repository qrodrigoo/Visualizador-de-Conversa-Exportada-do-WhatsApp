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

  for (const file of files) {
    mediaMap[file.name] = URL.createObjectURL(file);
  }

  // Primeiro passo: detectar os dois participantes
  for (const line of lines) {
    const match = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4}) (\d{1,2}:\d{2}) - (.*?): (.*)$/);
    if (match) {
      const sender = match[3].trim();
      if (sender.toLowerCase() !== "mensagem apagada" && sender.toLowerCase() !== "null") {
        participants.add(sender);
        if (participants.size >= 2) break;
      }
    }
  }

  const [leftUser, rightUser] = [...participants];

  // Agora renderiza a conversa
  for (const line of lines) {
    const match = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4}) (\d{1,2}:\d{2}) - (.*?): (.*)$/);
    if (!match) continue;

    const [, , , sender, messageRaw] = match;
    if (messageRaw.trim().toLowerCase() === "null") continue;

    const div = document.createElement("div");
    div.classList.add("message");

    if (sender === rightUser) {
      div.classList.add("user"); // direita
    } else {
      div.classList.add("other"); // esquerda
    }

    const cleanMessage = messageRaw.replace(/\u200e/g, "").replace(/\(arquivo anexado\)/i, "").trim();

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
  }

  const input = document.getElementById("folder-input");
  const fileCount = document.getElementById("file-count");

  input.addEventListener("change", () => {
    const total = input.files.length;
    fileCount.style.display = "block"; // mostra
    fileCount.textContent = total === 0
      ? "Nenhum arquivo selecionado"
      : `${total} arquivo${total > 1 ? "s" : ""} selecionado`;
  });
});

