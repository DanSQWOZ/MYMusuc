// 🛠️ УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

/**
 * 🕒 РАБОТА СО ВРЕМЕНЕМ
 */

// Форматирование времени из секунд в MM:SS
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Если меньше минуты назад
    if (diff < 60000) {
        return 'только что';
    }
    
    // Если меньше часа назад
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} мин. назад`;
    }
    
    // Если меньше дня назад
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ч. назад`;
    }
    
    // Если меньше недели назад
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} дн. назад`;
    }
    
    // Иначе показываем дату
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Получение относительного времени
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
    
    const diff = date - now;
    const diffInSeconds = Math.floor(diff / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (Math.abs(diffInDays) >= 1) {
        return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInHours) >= 1) {
        return rtf.format(diffInHours, 'hour');
    } else if (Math.abs(diffInMinutes) >= 1) {
        return rtf.format(diffInMinutes, 'minute');
    } else {
        return rtf.format(diffInSeconds, 'second');
    }
}

/**
 * 📁 РАБОТА С ФАЙЛАМИ
 */

// Проверка типа файла
function isAudioFile(file) {
    const audioTypes = CONFIG.AUDIO.SUPPORTED_FORMATS;
    const fileName = file.name.toLowerCase();
    return audioTypes.some(type => fileName.endsWith(type.replace('.', '')));
}

function isImageFile(file) {
    return file.type.startsWith('image/');
}

// Получение расширения файла
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Сжатие изображения
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Вычисляем новые размеры с сохранением пропорций
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            
            canvas.width = width;
            canvas.height = height;
            
            // Рисуем сжатое изображение
            ctx.drawImage(img, 0, 0, width, height);
            
            // Преобразуем в blob
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

/**
 * 🎨 РАБОТА С ЦВЕТАМИ И ГРАДИЕНТАМИ
 */

// Получение случайного градиента для обложки
function getRandomGradient() {
    const gradients = window.DEFAULT_GRADIENTS || [
        'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)'
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
}

// Создание градиента на основе строки (для консистентности)
function getGradientFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    const gradients = window.DEFAULT_GRADIENTS || [];
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

// Извлечение основного цвета из изображения
function getDominantColor(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0;
            let pixelCount = 0;
            
            // Анализируем каждый 10-й пиксель для производительности
            for (let i = 0; i < data.length; i += 40) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                pixelCount++;
            }
            
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            resolve(`rgb(${r}, ${g}, ${b})`);
        };
        
        img.onerror = () => resolve('#007bff'); // Fallback цвет
        img.src = imageUrl;
    });
}

/**
 * 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */

// Debounce функция для оптимизации производительности
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle функция
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Проверка на мобильное устройство
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Проверка поддержки touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Безопасное получение вложенных свойств объекта
function get(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result == null) return defaultValue;
        result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
}

// Глубокое клонирование объекта
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

/**
 * 🎵 РАБОТА С АУДИО
 */

// Получение длительности аудиофайла
function getAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        
        audio.addEventListener('error', reject);
        
        audio.src = URL.createObjectURL(file);
    });
}

// Извлечение метаданных из аудиофайла
function extractAudioMetadata(file) {
    return new Promise((resolve) => {
        const audio = new Audio();
        
        audio.addEventListener('loadedmetadata', () => {
            resolve({
                duration: audio.duration,
                // Можно добавить больше метаданных при необходимости
            });
        });
        
        audio.addEventListener('error', () => {
            resolve({ duration: 0 });
        });
        
        audio.src = URL.createObjectURL(file);
    });
}

/**
 * 🔤 РАБОТА СО СТРОКАМИ
 */

// Обрезка строки с многоточием
function truncate(str, length = 50) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
}

// Очистка строки от HTML тегов
function stripHtml(str) {
    return str.replace(/<[^>]*>/g, '');
}

// Валидация имени пользователя
function validateUsername(username) {
    if (!username) return 'Имя пользователя обязательно';
    if (username.length < CONFIG.SECURITY.MIN_USERNAME_LENGTH) return `Минимум ${CONFIG.SECURITY.MIN_USERNAME_LENGTH} символа`;
    if (username.length > CONFIG.SECURITY.MAX_USERNAME_LENGTH) return `Максимум ${CONFIG.SECURITY.MAX_USERNAME_LENGTH} символов`;
    if (CONFIG.SECURITY.FORBIDDEN_USERNAME_CHARS.test(username)) return 'Только буквы, цифры и подчеркивания';
    return null;
}

// Валидация пароля
function validatePassword(password) {
    if (!password) return 'Пароль обязателен';
    if (password.length < CONFIG.SECURITY.MIN_PASSWORD_LENGTH) return `Минимум ${CONFIG.SECURITY.MIN_PASSWORD_LENGTH} символа`;
    return null;
}

/**
 * 📱 РАБОТА С DOM
 */

// Безопасный поиск элемента
function $(selector) {
    return document.querySelector(selector);
}

function $(selector) {
    return document.querySelectorAll(selector);
}

// Добавление/удаление классов с проверкой
function toggleClass(element, className, force) {
    if (!element) return;
    if (force !== undefined) {
        element.classList.toggle(className, force);
    } else {
        element.classList.toggle(className);
    }
}

// Создание элемента с атрибутами
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'dataset') {
            Object.keys(attributes[key]).forEach(dataKey => {
                element.dataset[dataKey] = attributes[key][dataKey];
            });
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    if (content) {
        element.innerHTML = content;
    }
    
    return element;
}

/**
 * 🌐 РАБОТА С URL И API
 */

// Построение URL с параметрами
function buildUrl(base, params = {}) {
    const url = new URL(base, window.location.origin);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
}

// Безопасный fetch с обработкой ошибок
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Fetch error:', error);
        return { data: null, error: error.message };
    }
}

/**
 * 🎯 ЭКСПОРТ ВСЕХ ФУНКЦИЙ
 */
window.Utils = {
    // Время
    formatTime,
    formatDate,
    getRelativeTime,
    
    // Файлы
    isAudioFile,
    isImageFile,
    getFileExtension,
    formatFileSize,
    compressImage,
    getAudioDuration,
    extractAudioMetadata,
    
    // Цвета
    getRandomGradient,
    getGradientFromString,
    getDominantColor,
    
    // Утилиты
    debounce,
    throttle,
    isMobile,
    isTouchDevice,
    generateId,
    get,
    deepClone,
    
    // Строки
    truncate,
    stripHtml,
    validateUsername,
    validatePassword,
    
    // DOM
    $,
    $,
    toggleClass,
    createElement,
    
    // API
    buildUrl,
    safeFetch
};
