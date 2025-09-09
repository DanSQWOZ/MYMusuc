// =============================================================================
// 📄 ФАЙЛ: js/app.js - Главный файл приложения
// =============================================================================

class SoundWaveApp {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Проверяем поддержку браузером
            this.checkBrowserSupport();
            
            // Инициализируем менеджеры
            window.Storage = new StorageManager();
            window.Auth = new AuthManager();
            window.Player = new AudioPlayer();
            window.UI = new UIManager();
            window.Tracks = new TracksManager();
            window.Social = new SocialManager();

            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Определяем начальное состояние
            this.determineInitialState();

            // Настраиваем PWA если поддерживается
            this.setupPWA();

            this.isInitialized = true;
            console.log(`🎵 SoundWave App v${this.version} initialized`);

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorScreen(error.message);
        }
    }

    checkBrowserSupport() {
        const required = {
            'Audio API': 'Audio' in window,
            'Local Storage': 'localStorage' in window,
            'Fetch API': 'fetch' in window,
            'File API': 'File' in window && 'FileReader' in window
        };

        const unsupported = Object.entries(required)
            .filter(([name, supported]) => !supported)
            .map(([name]) => name);

        if (unsupported.length > 0) {
            throw new Error(`Браузер не поддерживает: ${unsupported.join(', ')}`);
        }
    }

    setupEventListeners() {
        // Кнопки экрана приветствия
        Utils.$('#showLogin')?.addEventListener('click', () => {
            window.UI.showAuthScreen('login');
        });

        Utils.$('#showRegister')?.addEventListener('click', () => {
            window.UI.showAuthScreen('register');
        });

        Utils.$('#continueAsGuest')?.addEventListener('click', () => {
            this.continueAsGuest();
        });

        // Форма авторизации
        Utils.$('#authForm')?.addEventListener('submit', (e) => {
            this.handleAuthSubmit(e);
        });

        // Показать/скрыть пароль
        Utils.$('#passwordToggle')?.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Форма загрузки трека
        Utils.$('#uploadForm')?.addEventListener('submit', (e) => {
            this.handleUploadSubmit(e);
        });

        // Отмена загрузки
        Utils.$('#cancelUpload')?.addEventListener('click', () => {
            this.resetUploadForm();
        });

        // Кнопки в заголовке
        Utils.$('#viewProfile')?.addEventListener('click', () => {
            this.showUserInfo();
            Utils.$('#userDropdown')?.classList.add('hidden');
        });

        Utils.$('#logoutBtn')?.addEventListener('click', () => {
            window.Auth.logout();
            Utils.$('#userDropdown')?.classList.add('hidden');
        });

        Utils.$('#settingsBtn')?.addEventListener('click', () => {
            this.showSettings();
            Utils.$('#userDropdown')?.classList.add('hidden');
        });

        // Управление выпадающим меню пользователя
        Utils.$('#headerAvatar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = Utils.$('#userDropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
        });

        // Закрытие выпадающего меню при клике вне его
        document.addEventListener('click', () => {
            Utils.$('#userDropdown')?.classList.add('hidden');
        });

        // Кнопка авторизации для гостей в загрузке
        Utils.$('#uploadLoginBtn')?.addEventListener('click', () => {
            window.UI.showAuthScreen('login');
        });

        // Загрузка обложки трека
        Utils.$('#trackCover')?.addEventListener('change', (e) => {
            this.handleCoverUpload(e);
        });

        // Глобальные горячие клавиши
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // Обработка ошибок
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            window.UI?.showToast('Произошла ошибка', 'error');
        });

        // Обработка потери соединения
        window.addEventListener('online', () => {
            window.UI?.showToast('Соединение восстановлено', 'success');
        });

        window.addEventListener('offline', () => {
            window.UI?.showToast('Нет соединения с интернетом', 'warning');
        });

        // События приложения
        window.addEventListener('auth:login', (e) => {
            this.onUserLogin(e.detail);
        });

        window.addEventListener('auth:logout', () => {
            this.onUserLogout();
        });

        window.addEventListener('track:liked', (e) => {
            this.onTrackLiked(e.detail);
        });
    }

    determineInitialState() {
        if (window.Auth.isLoggedIn()) {
            window.UI.showMainApp();
            window.Tracks.loadTracks(true);
        } else {
            window.UI.showWelcomeScreen();
        }
    }

    continueAsGuest() {
        window.UI.showMainApp();
        window.Tracks.loadTracks(true);
        window.UI.showToast('Вы вошли как гость. Для загрузки треков требуется регистрация.', 'info');
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        
        // Очищаем предыдущие ошибки
        Utils.$$('.error-message').forEach(el => {
            el.classList.remove('visible');
            el.textContent = '';
        });

        // Валидация
        const usernameError = Utils.validateUsername(username);
        if (usernameError) {
            this.showFieldError('username', usernameError);
            return;
        }

        const passwordError = Utils.validatePassword(password);
        if (passwordError) {
            this.showFieldError('password', passwordError);
            return;
        }

        const submitBtn = Utils.$('#authSubmit');
        const loading = Utils.$('#authLoading');
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
        }
        if (loading) loading.classList.remove('hidden');

        try {
            const isRegister = Utils.$('#authTitle')?.textContent === 'Регистрация';
            
            if (isRegister) {
                await window.Auth.register(username, password);
            } else {
                await window.Auth.login(username, password);
            }

            // Переходим в приложение
            window.UI.showMainApp();
            window.Tracks.loadTracks(true);

        } catch (error) {
            console.error('Auth error:', error);
            window.UI.showToast(error.message, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
            if (loading) loading.classList.add('hidden');
        }
    }

    showFieldError(fieldName, message) {
        const errorEl = Utils.$(`#${fieldName}Error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }

        // Подсвечиваем поле
        const fieldEl = Utils.$(`#${fieldName}`);
        if (fieldEl) {
            fieldEl.classList.add('error');
            setTimeout(() => fieldEl.classList.remove('error'), 3000);
        }
    }

    togglePasswordVisibility() {
        const passwordInput = Utils.$('#password');
        const toggleBtn = Utils.$('#passwordToggle .icon');
        
        if (!passwordInput || !toggleBtn) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    async handleUploadSubmit(e) {
        e.preventDefault();

        if (!window.Auth.isLoggedIn()) {
            window.UI.showToast('Требуется авторизация', 'warning');
            window.UI.showAuthScreen('login');
            return;
        }

        if (!window.UI.uploadFile) {
            window.UI.showToast('Выберите аудиофайл', 'warning');
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        
        // Валидация обязательных полей
        const title = formData.get('trackTitle')?.trim();
        const artist = formData.get('trackArtist')?.trim();
        
        if (!title || !artist) {
            window.UI.showToast('Название и исполнитель обязательны', 'warning');
            return;
        }

        // Добавляем аудиофайл
        formData.append('audio', window.UI.uploadFile);

        // Добавляем обложку если есть
        const coverInput = Utils.$('#trackCover');
        if (coverInput?.files[0]) {
            formData.append('cover', coverInput.files[0]);
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const progressFill = Utils.$('#uploadProgressFill');
        const progressText = Utils.$('#uploadProgressText');
        const progressContainer = Utils.$('#uploadProgress');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Загружается...';
        progressContainer?.classList.remove('hidden');

        try {
            // Имитируем прогресс загрузки
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${Math.round(progress)}%`;
            }, 200);

            const response = await window.Storage.uploadTrack(formData);

            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '100%';

            window.UI.showToast('Трек успешно загружен!', 'success');
            
            // Сбрасываем форму
            this.resetUploadForm();
            
            // Обновляем ленту
            window.Tracks.loadTracks(true);
            
            // Переходим на профиль через 1.5 секунды
            setTimeout(() => {
                window.UI.switchTab('profile');
            }, 1500);

        } catch (error) {
            console.error('Upload error:', error);
            window.UI.showToast(error.message || 'Ошибка загрузки трека', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Загрузить';
            progressContainer?.classList.add('hidden');
        }
    }

    handleCoverUpload(e) {
        const file = e.target.files[0];
        const preview = Utils.$('#coverPreview');
        
        if (!file || !preview) return;

        if (!Utils.isImageFile(file)) {
            window.UI.showToast('Выберите изображение', 'warning');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Cover preview" />`;
        };
        reader.readAsDataURL(file);
    }

    resetUploadForm() {
        const form = Utils.$('#uploadForm');
        const uploadZone = Utils.$('#uploadZone');
        const uploadFormWrapper = Utils.$('#uploadFormWrapper');
        const coverPreview = Utils.$('#coverPreview');
        
        if (form) form.reset();
        if (uploadZone) uploadZone.style.display = '';
        if (uploadFormWrapper) uploadFormWrapper.classList.add('hidden');
        
        // Сбрасываем превью обложки
        if (coverPreview) {
            coverPreview.innerHTML = '<div class="cover-placeholder">🎵</div>';
        }
        
        // Сбрасываем файл
        window.UI.uploadFile = null;
        window.UI.uploadMetadata = null;
        
        // Сбрасываем прогресс
        const progressFill = Utils.$('#uploadProgressFill');
        const progressText = Utils.$('#uploadProgressText');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
    }

    showUserInfo() {
        if (!window.Auth.isLoggedIn()) return;

        const user = window.Auth.getUser();
        const modal = Utils.$('#userInfoModal');
        
        if (!modal || !user) return;

        // Заполняем данные
        const usernameEl = Utils.$('#modalUsername');
        const passwordEl = Utils.$('#modalPassword');
        const regDateEl = Utils.$('#modalRegDate');
        
        if (usernameEl) usernameEl.textContent = user.username;
        if (regDateEl) regDateEl.textContent = Utils.formatDate(user.createdAt);
        if (passwordEl) passwordEl.textContent = '••••••••';
        
        // Показываем модальное окно
        window.UI.showModal('userInfoModal');
        
        // Кнопка показа пароля (только для демонстрации)
        const revealBtn = Utils.$('#revealPassword');
        if (revealBtn) {
            revealBtn.replaceWith(revealBtn.cloneNode(true)); // Убираем старые обработчики
            const newRevealBtn = Utils.$('#revealPassword');
            
            newRevealBtn?.addEventListener('click', (e) => {
                if (passwordEl) {
                    if (passwordEl.textContent === '••••••••') {
                        passwordEl.textContent = 'Скрыт из соображений безопасности';
                        e.target.textContent = '🙈';
                    } else {
                        passwordEl.textContent = '••••••••';
                        e.target.textContent = '👁️';
                    }
                }
            });
        }
    }

    showSettings() {
        // Пока что простое уведомление
        window.UI.showToast('Настройки пока не реализованы', 'info');
    }

    handleGlobalKeydown(e) {
        // Игнорируем если фокус на input/textarea
        if (e.target.matches('input, textarea, [contenteditable]')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                window.Player?.togglePlayPause();
                break;
            
            case 'ArrowLeft':
                if (e.shiftKey && window.Player?.audio) {
                    window.Player.audio.currentTime = Math.max(0, window.Player.audio.currentTime - 10);
                }
                break;
            
            case 'ArrowRight':
                if (e.shiftKey && window.Player?.audio) {
                    window.Player.audio.currentTime = Math.min(
                        window.Player.audio.duration || 0, 
                        window.Player.audio.currentTime + 10
                    );
                }
                break;
                
            case 'KeyN':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.Player?.nextTrack();
                }
                break;
                
            case 'KeyP':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.Player?.previousTrack();
                }
                break;

            case 'Escape':
                if (window.UI?.isFullPlayerVisible) {
                    window.UI.hideFullPlayer();
                }
                break;
        }
    }

    setupPWA() {
        // Service Worker регистрация (если включена)
        if (CONFIG.PWA.ENABLE_SERVICE_WORKER && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }

        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            // Можно показать кнопку "Установить приложение"
        });
    }

    onUserLogin(detail) {
        // Дополнительная логика при входе пользователя
        console.log('User logged in:', detail.user.username);
        
        // Загружаем данные пользователя
        this.loadUserData(detail.user);
        
        // Обновляем статистику
        this.updateUserStats();
    }

    onUserLogout() {
        // Очищаем данные при выходе
        window.Social?.clearAllData();
        
        // Останавливаем плеер
        if (window.Player?.isPlaying) {
            window.Player.pause();
        }
        
        // Скрываем плеер
        window.UI?.hideMiniPlayer();
        
        console.log('User logged out');
    }

    onTrackLiked(detail) {
        // Обновляем статистику лайков
        const stats = window.Social?.getStats();
        if (stats) {
            const libraryStats = Utils.$('#libraryStats');
            if (libraryStats) {
                libraryStats.innerHTML = `
                    <span>Треков: ${stats.likedTracks}</span>
                    <span>Понравившихся: ${stats.likedTracks}</span>
                `;
            }
        }
    }

    async loadUserData(user) {
        try {
            // Загружаем треки пользователя для профиля
            const userTracks = await window.Tracks.getUserTracks(user.id);
            
            // Обновляем счетчик треков
            const tracksCountEl = Utils.$('#profileTracksCount');
            if (tracksCountEl) {
                tracksCountEl.textContent = userTracks.length;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserStats() {
        const stats = window.Social?.getStats();
        const user = window.Auth?.getUser();
        
        if (!stats || !user) return;

        // Обновляем статистику в медиатеке
        const libraryStats = Utils.$('#libraryStats');
        if (libraryStats) {
            libraryStats.innerHTML = `
                <span>Треков: ${user.tracksCount || 0}</span>
                <span>Понравившихся: ${stats.likedTracks}</span>
            `;
        }
    }

    showErrorScreen(message = 'Произошла неизвестная ошибка') {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: var(--bg-primary, #111);
                color: var(--text-primary, #fff);
                padding: 2rem;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">😵</div>
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">Ошибка загрузки</h1>
                <p style="color: #ccc; margin-bottom: 2rem; max-width: 500px;">
                    ${message}
                </p>
                <button onclick="location.reload()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.3s ease;
                " onmouseover="this.style.background='#0056b3'" 
                   onmouseout="this.style.background='#007bff'">
                    Перезагрузить страницу
                </button>
            </div>
        `;
    }

    // Методы для отладки и разработки
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            managers: {
                storage: !!window.Storage,
                auth: !!window.Auth,
                player: !!window.Player,
                ui: !!window.UI,
                tracks: !!window.Tracks,
                social: !!window.Social
            },
            user: window.Auth?.getUser(),
            stats: window.Social?.getStats()
        };
    }

    // Метод для экспорта данных пользователя
    async exportData() {
        if (!window.Auth?.isLoggedIn()) {
            window.UI?.showToast('Требуется авторизация', 'warning');
            return null;
        }

        try {
            const data = {
                app: {
                    name: 'SoundWave',
                    version: this.version,
                    exportedAt: new Date().toISOString()
                },
                user: window.Auth.getUser(),
                social: window.Social?.exportUserData(),
                settings: {
                    volume: window.Player?.volume,
                    shuffle: window.Player?.shuffle,
                    repeat: window.Player?.repeat
                }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `soundwave-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            window.UI?.showToast('Данные экспортированы', 'success');
            return data;
        } catch (error) {
            console.error('Export error:', error);
            window.UI?.showToast('Ошибка экспорта', 'error');
            return null;
        }
    }

    // Деструктор для очистки ресурсов
    destroy() {
        // Останавливаем все медиа
        if (window.Player?.audio) {
            window.Player.audio.pause();
            window.Player.audio.src = '';
        }

        // Очищаем интервалы и таймеры
        // (здесь можно добавить очистку всех setInterval/setTimeout)

        // Удаляем event listeners
        // (в реальном приложении стоит отслеживать все listeners для корректной очистки)

        this.isInitialized = false;
        console.log('SoundWave App destroyed');
    }
}

// =============================================================================
// 🚀 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// =============================================================================

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, не запущено ли уже приложение
    if (window.SoundWaveApp) {
        console.warn('SoundWave App already initialized');
        return;
    }

    // Создаем и запускаем приложение
    window.SoundWaveApp = new SoundWaveApp();
    
    // Для отладки - делаем доступным в консоли
    window.getAppInfo = () => window.SoundWaveApp.getAppInfo();
    window.exportAppData = () => window.SoundWaveApp.exportData();
});

// Экспортируем классы для глобального доступа
window.Utils = window.Utils || {};
window.CONFIG = window.CONFIG || {};
window.EVENTS = window.EVENTS || {};
window.GENRES = window.GENRES || [];
window.MOODS = window.MOODS || [];
window.DEFAULT_GRADIENTS = window.DEFAULT_GRADIENTS || [];

// Обработчик для hot reload в разработке
if (module && module.hot) {
    module.hot.accept();
}

// Показываем информацию о загрузке
console.log('%c🎵 SoundWave', 'font-size: 24px; color: #007bff; font-weight: bold;');
console.log('%cMusic Platform - Ready to rock! 🚀', 'font-size: 14px; color: #666;');
console.log('%cДля отладки используйте: getAppInfo() или exportAppData()', 'font-size: 12px; color: #999;');

// Предотвращаем случайное закрытие вкладки при наличии загружаемых данных
window.addEventListener('beforeunload', (e) => {
    if (window.UI?.uploadFile || window.Player?.isPlaying) {
        e.preventDefault();
        e.returnValue = 'У вас есть незавершенные действия. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
    }
});

// Обработка видимости страницы для оптимизации
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Страница скрыта - можно приостановить некоторые операции
        console.log('App hidden');
    } else {
        // Страница видима - возобновляем операации
        console.log('App visible');
        // Можно обновить данные, если страница была скрыта долго
    }
});
