document.addEventListener('DOMContentLoaded', () => {
   const chatMessages = document.getElementById('chat-messages');
   const userInput = document.getElementById('user-input');
   const sendBtn = document.getElementById('send-btn');

   async function updateRecommendedMaterials(userText) {
    // Определяем тему
    const topicResponse = await fetch('/api/detect-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, user_id: 'guest' })
    });
    const { topic } = await topicResponse.json();

    // Получаем материалы по теме
    const materialsResponse = await fetch(`/api/materials/${topic}`);
    const materials = await materialsResponse.json();
    
    // Отображаем
    const container = document.getElementById('recommended-materials');
    container.innerHTML = materials.map(m => `
        <div class="material-card">
            <a href="/static/materials/${m.file}" target="_blank">
                📄 ${m.name}
            </a>
        </div>
    `).join('');
}
   // Отправка сообщения
   async function sendMessage() {
       const text = userInput.value.trim();
       if (!text) return;

       // Добавляем сообщение пользователя
       addMessage(text, 'user-message');
       userInput.value = '';
      // Обновляем рекомендации

    await updateRecommendedMaterials(text);  // <-- Добавили эту строку!

       // Отправляем на сервер
       try {
           const response = await fetch('/api/chat', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ text, user_id: 'guest' })
           });
           const data = await response.json();
           addMessage(data.response, 'bot-message');
       } catch (error) {
           addMessage("Ошибка соединения с сервером", 'bot-message error');
       }
   }

   // Добавление сообщения в чат
   function addMessage(text, className) {
       const msgDiv = document.createElement('div');
       msgDiv.className = `message ${className}`;
       msgDiv.textContent = text;
       chatMessages.appendChild(msgDiv);
       chatMessages.scrollTop = chatMessages.scrollHeight;
   }

   function displayRecommendedMaterials(materials) {
      const container = document.getElementById("recommended-materials");
      container.innerHTML = "";  // Очистим старые материалы
  
      materials.forEach(material => {
          const div = document.createElement("div");
  
          const title = document.createElement("p");
          title.textContent = material.name;
  
          // Определяем тип файла
          if (material.file.endsWith(".jpg") || material.file.endsWith(".jpeg") || material.file.endsWith(".png") || material.file.endsWith(".webp")) {
              const img = document.createElement("img");
              img.src = material.file;
              img.alt = material.name;
              img.style.maxWidth = "100%";
              div.appendChild(title);
              div.appendChild(img);
          } else if (material.file.endsWith(".mp4")) {
              const video = document.createElement("video");
              video.src = material.file;
              video.controls = true;
              video.style.maxWidth = "100%";
              div.appendChild(title);
              div.appendChild(video);
          } else {
              const link = document.createElement("a");
              link.href = material.file;
              link.textContent = "Открыть материал";
              link.target = "_blank";
              div.appendChild(title);
              div.appendChild(link);
          }
  
          container.appendChild(div);
      });
  }
  

   // Обработчики событий
   sendBtn.addEventListener('click', sendMessage);
   userInput.addEventListener('keypress', (e) => {
       if (e.key === 'Enter') sendMessage();
   });
});