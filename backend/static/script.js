document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const recommendedMaterials = document.getElementById('recommended-materials');

    // Функция показа/скрытия индикатора
    function showTypingIndicator(show) {
        typingIndicator.style.display = show ? 'flex' : 'none';
        if (show) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Добавление сообщения в чат
    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        
        // Обрабатываем переносы строк
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedText;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Отображение рекомендованных материалов
    async function updateRecommendedMaterials(userText) {
        try {
            // Определяем тему
            const topicResponse = await fetch('/api/detect-topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userText, user_id: 'guest' })
            });
            
            if (!topicResponse.ok) throw new Error('Ошибка определения темы');
            
            const { topic } = await topicResponse.json();

            // Получаем материалы по теме
            const materialsResponse = await fetch(`/api/materials/${topic}`);
            if (!materialsResponse.ok) throw new Error('Ошибка загрузки материалов');
            
            const materials = await materialsResponse.json();
            
            // Отображаем материалы
            displayRecommendedMaterials(materials);
            
        } catch (error) {
            console.error('Ошибка при обновлении материалов:', error);
            recommendedMaterials.innerHTML = `
                <div class="error-message">
                    Не удалось загрузить материалы. Попробуйте позже.
                </div>
            `;
        }
    }

    // Функция отображения материалов
    function displayRecommendedMaterials(materials) {
        if (!materials || materials.length === 0) {
            recommendedMaterials.innerHTML = `
                <div class="placeholder">
                    <img src="/static/icons/book-icon.svg" alt="Книга">
                    <p>Материалы не найдены</p>
                </div>
            `;
            return;
        }

        recommendedMaterials.innerHTML = materials.map(material => `
            <div class="material-card">
                <div class="material-header">
                    <span class="material-icon ${getFileIconClass(material.file)}"></span>
                    <h3>${material.name}</h3>
                </div>
                <div class="material-footer">
                    <span class="file-type">${getFileExtension(material.file)}</span>
                    <a href="/static/materials/${material.file}" target="_blank" class="download-btn">
                        Открыть
                    </a>
                </div>
            </div>
        `).join('');
    }

    // Получение класса иконки для файла
    function getFileIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch(ext) {
            case 'pdf': return 'icon-pdf';
            case 'mp4': case 'mov': return 'icon-video';
            case 'jpg': case 'jpeg': case 'png': return 'icon-image';
            case 'doc': case 'docx': return 'icon-doc';
            default: return 'icon-file';
        }
    }

    // Получение расширения файла
    function getFileExtension(filename) {
        return filename.split('.').pop().toUpperCase();
    }

    // Отправка сообщения
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        // Добавляем сообщение пользователя
        addMessage(messageText, 'user-message');
        userInput.value = '';
        
        // Показываем индикатор
        showTypingIndicator(true);
        
        try {
            // Обновляем рекомендации (параллельно)
            updateRecommendedMaterials(messageText);
            
            // Отправляем запрос к API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: messageText, user_id: 'guest' })
            });
            
            if (!response.ok) throw new Error('Ошибка сервера');
            
            const data = await response.json();
            
            // Скрываем индикатор и показываем ответ
            showTypingIndicator(false);
            addMessage(data.response, 'bot-message');
            
        } catch (error) {
            showTypingIndicator(false);
            addMessage("Произошла ошибка при обработке запроса", 'bot-message error');
            console.error('Ошибка:', error);
        }
    }

    // Обработчики событий
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Инициализация - примеры вопросов
    const exampleQuestions = [
        "Какие средства защиты нужно использовать при работе с высоким напряжением?",
        "Как оказать первую помощь при ударе током?",
        "Какие основные правила пожарной безопасности на энергообъектах?"
    ];

    // Добавляем примеры вопросов в интерфейс
    function initExampleQuestions() {
        const examplesContainer = document.createElement('div');    
        examplesContainer.className = 'examples-container';
        
        exampleQuestions.forEach(question => {
            const exampleBtn = document.createElement('button');
            exampleBtn.className = 'example-question';
            exampleBtn.textContent = question;
            exampleBtn.addEventListener('click', () => {
                userInput.value = question;
                userInput.focus();
            });
            examplesContainer.appendChild(exampleBtn);
        });
        
        chatMessages.appendChild(examplesContainer);
    }

    // Инициализируем при загрузке
    initExampleQuestions();
});