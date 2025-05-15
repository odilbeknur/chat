document.addEventListener('DOMContentLoaded', () => {
    // Инициализация GLightbox
    const lightbox = GLightbox({
        selector: '.glightbox',
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
        closeOnOutsideClick: true
    });

    // Элементы DOM
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const recommendedMaterials = document.getElementById('recommended-materials');

    // Показать/скрыть индикатор набора
    function showTypingIndicator(show) {
        typingIndicator.style.display = show ? 'flex' : 'none';
        if (show) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Добавить сообщение в чат
    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Определить тип файла
    function getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx'].includes(ext)) return 'doc';
        return 'other';
    }

    // Отобразить рекомендуемые материалы
    async function updateRecommendedMaterials(userText) {
        try {
            showTypingIndicator(true);
            
            // Определить тему
            const topicResponse = await fetch('/api/detect-topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userText, user_id: 'guest' })
            });
            
            const { topic } = await topicResponse.json();
            
            // Получить материалы
            const materialsResponse = await fetch(`/api/materials/${topic}`);
            const materials = await materialsResponse.json();
            
            // Отобразить
            displayMaterials(materials);
            
        } catch (error) {
            console.error('Ошибка:', error);
            recommendedMaterials.innerHTML = `
                <div class="error-message">
                    <i class="icon-error"></i>
                    <p>Не удалось загрузить материалы</p>
                </div>
            `;
        } finally {
            showTypingIndicator(false);
        }
    }

    // Отображение материалов с GLightbox
    function displayMaterials(materials) {
        if (!materials || materials.length === 0) {
            recommendedMaterials.innerHTML = `
                <div class="placeholder">
                    <i class="icon-info"></i>
                    <p>Материалы не найдены</p>
                </div>
            `;
            return;
        }

        recommendedMaterials.innerHTML = materials.map(material => {
            const fileUrl = `/static/materials/${material.file}`;
            const fileType = getFileType(material.file);
            const fileExt = material.file.split('.').pop().toUpperCase();

            // Для изображений
            if (fileType === 'image') {
                return `
                <div class="material-card">
                    <a href="${fileUrl}" class="glightbox" data-gallery="gallery1" data-type="image">
                        <img src="${fileUrl}" alt="${material.name}" class="material-preview">
                        <div class="material-overlay">
                            <h3>${material.name}</h3>
                            <span class="file-badge">${fileExt}</span>
                        </div>
                    </a>
                </div>
                `;
            }
            
            // Для видео
            else if (fileType === 'video') {
                return `
                <div class="material-card">
                    <a href="${fileUrl}" class="glightbox" data-gallery="gallery1" data-type="video">
                        <video class="material-preview" muted loop>
                            <source src="${fileUrl}" type="video/${fileType}">
                        </video>
                        <div class="material-overlay">
                            <h3>${material.name}</h3>
                            <span class="file-badge">${fileExt}</span>
                            <i class="play-icon"></i>
                        </div>
                    </a>
                </div>
                `;
            }
            
            // Для PDF и других файлов
            else {
                return `
                <div class="material-card">
                    <a href="${fileUrl}" target="_blank" class="material-link">
                        <div class="file-icon ${fileType}-icon"></div>
                        <div class="material-info">
                            <h3>${material.name}</h3>
                            <span class="file-badge">${fileExt}</span>
                        </div>
                    </a>
                </div>
                `;
            }
        }).join('');

        // Обновить GLightbox
        setTimeout(() => lightbox.reload(), 100);
    }

    // Отправить сообщение
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        // Добавить сообщение пользователя
        addMessage(messageText, 'user-message');
        userInput.value = '';
        
        // Показать индикатор
        showTypingIndicator(true);
        
        try {
            // Получить ответ бота
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: messageText, user_id: 'guest' })
            });
            
            const data = await response.json();
            
            // Добавить ответ бота
            addMessage(data.response, 'bot-message');
            
            // Обновить рекомендации
            await updateRecommendedMaterials(messageText);
            
        } catch (error) {
            addMessage("Произошла ошибка при обработке запроса", 'bot-message error');
            console.error('Ошибка:', error);
        } finally {
            showTypingIndicator(false);
        }
    }

    // Инициализация примеров вопросов
    function initExampleQuestions() {
        const examples = [
            "Какие средства защиты использовать при работе с высоким напряжением?",
            "Как оказать первую помощь при ударе током?",
            "Каковы правила пожарной безопасности на подстанции?"
        ];

        const container = document.createElement('div');
        container.className = 'examples-container';
        
        examples.forEach(question => {
            const example = document.createElement('button');
            example.className = 'example-question';
            example.textContent = question;
            example.addEventListener('click', () => {
                userInput.value = question;
                userInput.focus();
            });
            container.appendChild(example);
        });
        
        chatMessages.appendChild(container);
    }

    // Обработчики событий
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Инициализация
    initExampleQuestions();
});