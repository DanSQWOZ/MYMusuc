// 🎵 КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// Здесь вы можете изменить основные настройки вашего музыкального сайта

const CONFIG = {
    // 🎨 НАСТРОЙКИ ДИЗАЙНА
    THEME: {
        // Основные цвета (можете изменить на свои)
        PRIMARY_COLOR: '#007bff',
        SECONDARY_COLOR: '#6c757d',
        SUCCESS_COLOR: '#28a745',
        DANGER_COLOR: '#dc3545',
        WARNING_COLOR: '#ffc107',
        
        // Цвета фона
        BACKGROUND_DARK: '#111111',
        BACKGROUND_LIGHT: '#1a1a1a',
        BACKGROUND_CARD: '#222222',
        
        // Цвета текста
        TEXT_PRIMARY: '#ffffff',
        TEXT_SECONDARY: '#cccccc',
        TEXT_MUTED: '#666666',
        
        // Анимации
        TRANSITION_SPEED: '0.3s',
        ANIMATION_EASING: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },

    // 🔧 НАСТРОЙКИ ФУНКЦИЙ
    FEATURES: {
        // Максимальный размер загружаемого файла в МБ
        MAX_FILE_SIZE: 50,
        
        // Максимальная длина названия трека
        MAX_TRACK_TITLE_LENGTH: 100,
        
        // Максимальная длина описания
        MAX_DESCRIPTION_LENGTH: 500,
        
        // Количество треков на странице
        TRACKS_PER_PAGE: 20,
        
        // Время автосохранения (мс)
        AUTOSAVE_INTERVAL: 30000,
        
        // Включить уведомления
        ENABLE_NOTIFICATIONS: true,
        
        // Включить аналитику прослушиваний
        ENABLE_ANALYTICS: true
    },

    // 🎵 НАСТРОЙКИ ПЛЕЕРА
    PLAYER: {
        // Громкость по умолчанию (0-100)
        DEFAULT_VOLUME: 80,
        
        // Автовоспроизведение следующего трека
        AUTO_PLAY_NEXT: true,
        
        // Сохранять позицию воспроизведения
        REMEMBER_POSITION: true,
        
        // Время перемотки (секунды)
        SEEK_TIME: 10,
        
        // Показывать визуализацию
        SHOW_VISUALIZER: false,
        
        // Кроссфейд между треками (мс)
        CROSSFADE_DURATION: 1000
    },

    // 📱 МОБИЛЬНЫЕ НАСТРОЙКИ
    MOBILE: {
        // Поддержка жестов
        ENABLE_GESTURES: true,
        
        // Сила свайпа для закрытия плеера
        SWIPE_THRESHOLD: 100,
        
        // Включить вибрацию при нажатиях
        ENABLE_HAPTIC: true
    },

    // 🔐 НАСТРОЙКИ БЕЗОПАСНОСТИ
    SECURITY: {
        // Минимальная длина пароля
        MIN_PASSWORD_LENGTH: 4,
        
        // Минимальная длина имени пользователя
        MIN_USERNAME_LENGTH: 3,
        
        // Максимальная длина имени пользователя
        MAX_USERNAME_LENGTH: 20,
        
        // Запрещенные символы в имени пользователя
        FORBIDDEN_USERNAME_CHARS: /[^a-zA-Z0-9_]/g,
        
        // Автоматический выход через N дней бездействия
        AUTO_LOGOUT_DAYS: 30,
        
        // Блокировка после неудачных попыток входа
        MAX_LOGIN_ATTEMPTS: 5
    },

    // 🌐 СОЦИАЛЬНЫЕ ФУНКЦИИ
    SOCIAL: {
        // Включить систему подписок
        ENABLE_FOLLOWING: true,
        
        // Включить комментарии к трекам
        ENABLE_COMMENTS: false, // Пока отключено
        
        // Включить оценки треков
        ENABLE_RATINGS: true,
        
        // Включить публичные плейлисты
        ENABLE_PUBLIC_PLAYLISTS: true,
        
        // Максимальное количество подписок
        MAX_FOLLOWING: 1000
    },

    // 📊 НАСТРОЙКИ АНАЛИТИКИ
    ANALYTICS: {
        // Считать прослушиванием после N секунд
        MIN_LISTEN_TIME: 30,
        
        // Обновлять статистику каждые N секунд
        UPDATE_INTERVAL: 10,
        
        // Сохранять историю прослушиваний
        SAVE_LISTENING_HISTORY: true
    },

    // 🔍 НАСТРОЙКИ ПОИСКА
    SEARCH: {
        // Минимальная длина поискового запроса
        MIN_QUERY_LENGTH: 2,
        
        // Максимальное количество результатов
        MAX_RESULTS: 50,
        
        // Задержка поиска (мс)
        SEARCH_DELAY: 300,
        
        // Включить поиск по описанию
        SEARCH_IN_DESCRIPTIONS: true
    },

    // 📁 ПУТИ К ИКОНКАМ
    // Замените эти пути на свои иконки
    ICONS: {
        // Навигация (24x24px, PNG или SVG)
        HOME: 'icons/home.png',
        SEARCH: 'icons/search.png',
        LIBRARY: 'icons/library.png',
        UPLOAD: 'icons/upload.png',
        PROFILE: 'icons/profile.png',
        
        // Плеер (32x32px)
        PLAY: 'icons/play.png',
        PAUSE: 'icons/pause.png',
        PREV: 'icons/prev.png',
        NEXT: 'icons/next.png',
        SHUFFLE: 'icons/shuffle.png',
        REPEAT: 'icons/repeat.png',
        VOLUME: 'icons/volume.png',
        VOLUME_MUTE: 'icons/volume-mute.png',
        
        // Действия (20x20px)
        HEART: 'icons/heart.png',
        HEART_FILLED: 'icons/heart-filled.png',
        SHARE: 'icons/share.png',
        MORE: 'icons/more.png',
        DOWNLOAD: 'icons/download.png',
        
        // Интерфейс (16x16px)
        CLOSE: 'icons/close.png',
        ARROW_DOWN: 'icons/arrow-down.png',
        ARROW_UP: 'icons/arrow-up.png',
        ARROW_LEFT: 'icons/arrow-left.png',
        ARROW_RIGHT: 'icons/arrow-right.png',
        EYE: 'icons/eye.png',
        EYE_OFF: 'icons/eye-off.png',
        SETTINGS: 'icons/settings.png',
        NOTIFICATION: 'icons/notification.png',
        CAMERA: 'icons/camera.png'
    },

    // 🎨 НАСТРОЙКИ ОБЛОЖЕК
    COVERS: {
        // Размер обложек в пикселях
        SMALL_SIZE: 64,
        MEDIUM_SIZE: 256,
        LARGE_SIZE: 512,
        
        // Качество сжатия (0.1 - 1.0)
        QUALITY: 0.8,
        
        // Формат сжатия
        FORMAT: 'image/jpeg'
    },

    // 🔊 НАСТРОЙКИ АУДИО
    AUDIO: {
        // Поддерживаемые форматы
        SUPPORTED_FORMATS: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
        
        // Предварительная загрузка
        PRELOAD: 'metadata',
        
        // Буферизация
        BUFFER_SIZE: 4096
    },

    // 🚀 НАСТРОЙКИ ПРОИЗВОДИТЕЛЬНОСТИ
    PERFORMANCE: {
        // Виртуализация длинных списков
        VIRTUALIZE_LONG_LISTS: true,
        
        // Количество элементов для включения виртуализации
        VIRTUALIZATION_THRESHOLD: 100,
        
        // Ленивая загрузка изображений
        LAZY_LOAD_IMAGES: true,
        
        // Дебаунс для поиска и скролла
        DEBOUNCE_DELAY: 300
    },

    // 🌍 ЛОКАЛИЗАЦИЯ
    LOCALE: {
        // Язык по умолчанию
        DEFAULT_LANGUAGE: 'ru',
        
        // Формат времени
        TIME_FORMAT: '24h',
        
        // Формат даты
        DATE_FORMAT: 'dd.mm.yyyy'
    },

    // 💾 НАСТРОЙКИ ХРАНЕНИЯ
    STORAGE: {
        // Префикс для ключей localStorage
        PREFIX: 'soundwave_',
        
        // Максимальный размер данных в localStorage (MB)
        MAX_STORAGE_SIZE: 50,
        
        // Автоочистка старых данных
        AUTO_CLEANUP: true,
        
        // Период хранения истории (дни)
        HISTORY_RETENTION_DAYS: 90
    },

    // 📱 PWA НАСТРОЙКИ
    PWA: {
        // Включить Service Worker
        ENABLE_SERVICE_WORKER: false, // Пока отключено для GitHub Pages
        
        // Кэшировать аудиофайлы
        CACHE_AUDIO: false,
        
        // Работа оффлайн
        OFFLINE_MODE: false
    },

    // 🎯 НАСТРОЙКИ РЕКОМЕНДАЦИЙ
    RECOMMENDATIONS: {
        // Включить рекомендации
        ENABLE_RECOMMENDATIONS: true,
        
        // Количество рекомендуемых треков
        RECOMMENDATIONS_COUNT: 10,
        
        // Алгоритм рекомендаций
        ALGORITHM: 'collaborative', // 'collaborative', 'content-based', 'hybrid'
        
        // Учитывать жанры
        CONSIDER_GENRES: true,
        
        // Учитывать настроение
        CONSIDER_MOODS: true
    }
};

// 🎵 КОНСТАНТЫ ДЛЯ ЖАНРОВ
const GENRES = [
    { id: 'pop', name: 'Поп', emoji: '🎤' },
    { id: 'rock', name: 'Рок', emoji: '🎸' },
    { id: 'hip-hop', name: 'Хип-хоп', emoji: '🎤' },
    { id: 'electronic', name: 'Электронная', emoji: '🎛️' },
    { id: 'jazz', name: 'Джаз', emoji: '🎷' },
    { id: 'classical', name: 'Классическая', emoji: '🎼' },
    { id: 'r&b', name: 'R&B', emoji: '🎵' },
    { id: 'country', name: 'Кантри', emoji: '🤠' },
    { id: 'reggae', name: 'Регги', emoji: '🌴' },
    { id: 'blues', name: 'Блюз', emoji: '🎺' },
    { id: 'folk', name: 'Фолк', emoji: '🪕' },
    { id: 'metal', name: 'Метал', emoji: '🤘' },
    { id: 'punk', name: 'Панк', emoji: '💀' },
    { id: 'indie', name: 'Инди', emoji: '🎨' },
    { id: 'ambient', name: 'Эмбиент', emoji: '🌌' },
    { id: 'other', name: 'Другое', emoji: '🎵' }
];

// 🎭 КОНСТАНТЫ ДЛЯ НАСТРОЕНИЙ
const MOODS = [
    { id: 'happy', name: 'Веселое', emoji: '😊', color: '#ffd93d' },
    { id: 'sad', name: 'Грустное', emoji: '😢', color: '#6ba3d0' },
    { id: 'energetic', name: 'Энергичное', emoji: '⚡', color: '#ff6b6b' },
    { id: 'calm', name: 'Спокойное', emoji: '😌', color: '#95e1d3' },
    { id: 'romantic', name: 'Романтичное', emoji: '💕', color: '#ff8a8a' },
    { id: 'mysterious', name: 'Таинственное', emoji: '🌙', color: '#845ec2' },
    { id: 'aggressive', name: 'Агрессивное', emoji: '😡', color: '#ff4757' },
    { id: 'nostalgic', name: 'Ностальгическое', emoji: '💭', color: '#a8e6cf' }
];

// 🏷️ СИСТЕМНЫЕ СОБЫТИЯ
const EVENTS = {
    // Пользователь
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_REGISTER: 'user:register',
    
    // Треки
    TRACK_PLAY: 'track:play',
    TRACK_PAUSE: 'track:pause',
    TRACK_END: 'track:end',
    TRACK_LIKE: 'track:like',
    TRACK_UPLOAD: 'track:upload',
    
    // Плеер
    PLAYER_READY: 'player:ready',
    PLAYER_TIME_UPDATE: 'player:timeupdate',
    PLAYER_VOLUME_CHANGE: 'player:volume',
    
    // UI
    TAB_CHANGE: 'ui:tab-change',
    MODAL_OPEN: 'ui:modal-open',
    MODAL_CLOSE: 'ui:modal-close'
};

// 🌈 ГРАДИЕНТЫ ДЛЯ ОБЛОЖЕК ПО УМОЛЧАНИЮ
const DEFAULT_GRADIENTS = [
    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%)'
];

// Экспорт конфигурации для использования в других файлах
window.CONFIG = CONFIG;
window.GENRES = GENRES;
window.MOODS = MOODS;
window.EVENTS = EVENTS;
window.DEFAULT_GRADIENTS = DEFAULT_GRADIENTS;
