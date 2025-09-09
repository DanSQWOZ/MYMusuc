// =============================================================================
// 📄 ФАЙЛ: js/ui.js - Управление интерфейсом
// =============================================================================

class UIManager {
    constructor() {
        this.currentTab = 'home';
        this.isFullPlayerVisible = false;
        this.isMiniPlayerVisible = false;
        this.contextMenu = null;
        this.toasts = [];
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupPlayerUI();
        this.setupUpload();
        this.setupSearch();
        this.setupContextMenu();
        this.setupTouch();
    }

    // === НАВИГАЦИЯ ===

    setupNavigation() {
        // Нижняя навигация
        Utils.$('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Кнопки возврата
        Utils.$('#backToWelcome')?.addEventListener('click', () => {
            this.showWelcomeScreen();
        });
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // Проверяем авторизацию для некоторых вкладок
        if (['upload', 'profile'].includes(tabName) && !window.Auth?.isLoggedIn()) {
            if (tabName === 'upload') {
                // Показываем сообщение об авторизации в самой вкладке
                this.switchTab('upload');
                return;
            } else {
                this.showToast('Требуется авторизация', 'warning');
                return;
            }
        }

        this.currentTab = tabName;

        // Обновляем активную навигацию
        Utils.$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Показываем нужную вкладку
        Utils.$('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        const activeTab = Utils.$(`#${tabName}Tab`);
        if (activeTab) {
            activeTab.classList.remove('hidden');
            
            // Загружаем содержимое если нужно
            this.loadTabContent(tabName);
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.TAB_CHANGE, {
            detail: { tab: tabName }
        }));
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'home':
                this.loadHomeFeed();
                break;
            case 'search':
                this.loadTrendingTracks();
                break;
            case 'library':
                this.loadLibrary();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    // === ЭКРАНЫ АВТОРИЗАЦИИ ===

    showWelcomeScreen() {
        Utils.$('#welcomeScreen')?.classList.remove('hidden');
        Utils.$('#authScreen')?.classList.add('hidden');
        Utils.$('#mainApp')?.classList.add('hidden');
    }

    showAuthScreen(mode = 'login') {
        Utils.$('#welcomeScreen')?.classList.add('hidden');
        Utils.$('#authScreen')?.classList.remove('hidden');
        Utils.$('#mainApp')?.classList.add('hidden');

        const authTitle = Utils.$('#authTitle');
        const authSubmit = Utils.$('#authSubmit');
        const registerWarning = Utils.$('#registerWarning');

        if (mode === 'register') {
            if (authTitle) authTitle.textContent = 'Регистрация';
            if (authSubmit) authSubmit.textContent = 'Зарегистрироваться';
            registerWarning?.classList.remove('hidden');
        } else {
            if (authTitle) authTitle.textContent = 'Вход';
            if (authSubmit) authSubmit.textContent = 'Войти';
            registerWarning?.classList.add('hidden');
        }

        // Очищаем форму
        const authForm = Utils.$('#authForm');
        if (authForm) {
            authForm.reset();
            Utils.$('.error-message').forEach(el => {
                el.classList.remove('visible');
                el.textContent = '';
            });
        }
    }

    showMainApp() {
        Utils.$('#welcomeScreen')?.classList.add('hidden');
        Utils.$('#authScreen')?.classList.add('hidden');
        Utils.$('#mainApp')?.classList.remove('hidden');
    }

    // === ПЛЕЕР ===

    setupPlayerUI() {
        // Кнопка закрытия полноэкранного плеера
        Utils.$('#minimizePlayer')?.addEventListener('click', () => {
            this.hideFullPlayer();
        });

        // Свайп вниз на мобильных для закрытия плеера
        if (Utils.isTouchDevice()) {
            this.setupPlayerSwipe();
        }
    }

    setupPlayerSwipe() {
        const fullPlayer = Utils.$('#fullPlayer');
        const miniPlayer = Utils.$('#miniPlayer');
        
        if (!fullPlayer || !miniPlayer) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const onTouchStart = (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            fullPlayer.classList.add('swiping');
        };

        const onTouchMove = (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0) { // Свайп вниз
                const progress = Math.min(deltaY / 200, 1);
                fullPlayer.style.transform = `translateY(${deltaY}px)`;
                fullPlayer.style.opacity = 1 - (progress * 0.3);
            }
        };

        const onTouchEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            fullPlayer.classList.remove('swiping');
            
            const deltaY = currentY - startY;
            
            if (deltaY > CONFIG.MOBILE.SWIPE_THRESHOLD) {
                this.hideFullPlayer();
            } else {
                // Возвращаем на место
                fullPlayer.style.transform = '';
                fullPlayer.style.opacity = '';
            }
        };

        fullPlayer.addEventListener('touchstart', onTouchStart);
        fullPlayer.addEventListener('touchmove', onTouchMove);
        fullPlayer.addEventListener('touchend', onTouchEnd);
    }

    showMiniPlayer() {
        const miniPlayer = Utils.$('#miniPlayer');
        if (!miniPlayer) return;

        miniPlayer.classList.remove('hidden');
        this.isMiniPlayerVisible = true;
        
        // Добавляем отступ для основного контента
        const mainContent = Utils.$('#mainContent');
        if (mainContent) {
            mainContent.style.paddingBottom = `calc(var(--bottom-nav-height) + var(--mini-player-height) + 1rem)`;
        }
    }

    hideMiniPlayer() {
        const miniPlayer = Utils.$('#miniPlayer');
        if (!miniPlayer) return;

        miniPlayer.classList.add('hidden');
        this.isMiniPlayerVisible = false;
        
        // Убираем отступ
        const mainContent = Utils.$('#mainContent');
        if (mainContent) {
            mainContent.style.paddingBottom = `calc(var(--bottom-nav-height) + 1rem)`;
        }
    }

    showFullPlayer() {
        const fullPlayer = Utils.$('#fullPlayer');
        if (!fullPlayer) return;

        fullPlayer.classList.add('active');
        this.isFullPlayerVisible = true;
        
        // Скрываем мини плеер
        const miniPlayer = Utils.$('#miniPlayer');
        if (miniPlayer) {
            miniPlayer.style.opacity = '0';
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.MODAL_OPEN, {
            detail: { modal: 'fullPlayer' }
        }));
    }

    hideFullPlayer() {
        const fullPlayer = Utils.$('#fullPlayer');
        if (!fullPlayer) return;

        fullPlayer.classList.remove('active');
        this.isFullPlayerVisible = false;
        
        // Показываем мини плеер
        const miniPlayer = Utils.$('#miniPlayer');
        if (miniPlayer && this.isMiniPlayerVisible) {
            miniPlayer.style.opacity = '';
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.MODAL_CLOSE, {
            detail: { modal: 'fullPlayer' }
        }));
    }

    // === МОДАЛЬНЫЕ ОКНА ===

    setupModals() {
        // Закрытие модальных окон
        Utils.$('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Закрытие по клику на фон
        Utils.$('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModal = Utils.$('.modal-overlay:not(.hidden)');
                if (visibleModal) {
                    this.hideModal(visibleModal);
                }
                
                if (this.isFullPlayerVisible) {
                    this.hideFullPlayer();
                }
            }
        });
    }

    showModal(modalId) {
        const modal = Utils.$(`#${modalId}`);
        if (!modal) return;

        modal.classList.remove('hidden');
        
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.MODAL_OPEN, {
            detail: { modal: modalId }
        }));
    }

    hideModal(modal) {
        if (typeof modal === 'string') {
            modal = Utils.$(`#${modal}`);
        }
        
        if (!modal) return;

        modal.classList.add('hidden');
        
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.MODAL_CLOSE, {
            detail: { modal: modal.id }
        }));
    }

    // === УВЕДОМЛЕНИЯ (TOASTS) ===

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = Utils.$('#toastContainer');
        if (!toastContainer) return;

        const toastId = Utils.generateId();
        const toast = Utils.createElement('div', {
            className: `toast ${type}`,
            dataset: { toastId }
        });

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-message">
                    <div class="toast-text">${message}</div>
                </div>
                <button class="toast-close" onclick="window.UI.hideToast('${toastId}')">×</button>
            </div>
        `;

        toastContainer.appendChild(toast);
        this.toasts.push(toastId);

        // Автоматическое скрытие
        setTimeout(() => {
            this.hideToast(toastId);
        }, duration);

        return toastId;
    }

    hideToast(toastId) {
        const toast = Utils.$(`[data-toast-id="${toastId}"]`);
        if (!toast) return;

        toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(id => id !== toastId);
        }, 300);
    }

    // === КОНТЕКСТНОЕ МЕНЮ ===

    setupContextMenu() {
        // Закрытие контекстного меню
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        document.addEventListener('contextmenu', (e) => {
            // Предотвращаем стандартное контекстное меню на треках
            if (e.target.closest('.track-item')) {
                e.preventDefault();
            }
        });
    }

    showContextMenu(x, y, items) {
        this.hideContextMenu();

        const menu = Utils.createElement('div', {
            className: 'context-menu',
            style: `position: fixed; left: ${x}px; top: ${y}px; z-index: var(--z-modal);`
        });

        items.forEach(item => {
            if (item.type === 'divider') {
                menu.appendChild(Utils.createElement('div', {
                    className: 'context-divider'
                }));
            } else {
                const menuItem = Utils.createElement('button', {
                    className: `context-item ${item.dangerous ? 'dangerous' : ''}`,
                    type: 'button'
                }, `
                    <span class="context-icon">${item.icon || ''}</span>
                    <span>${item.label}</span>
                `);

                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (item.onClick) item.onClick();
                    this.hideContextMenu();
                });

                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);
        this.contextMenu = menu;

        // Проверяем, не выходит ли меню за границы экрана
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${y - rect.height}px`;
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    // === ЗАГРУЗКА ===

    setupUpload() {
        const uploadZone = Utils.$('#uploadZone');
        const fileInput = Utils.$('#audioFiles');
        const selectFilesBtn = Utils.$('#selectFilesBtn');

        if (!uploadZone || !fileInput) return;

        // Drag & Drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        });

        // Клик для выбора файлов
        selectFilesBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileUpload(files);
        });
    }

    async handleFileUpload(files) {
        const audioFiles = files.filter(file => Utils.isAudioFile(file));
        
        if (audioFiles.length === 0) {
            this.showToast('Выберите аудиофайлы', 'warning');
            return;
        }

        if (audioFiles.length > 1) {
            this.showToast('Пока поддерживается загрузка только одного файла', 'warning');
            return;
        }

        const audioFile = audioFiles[0];
        
        // Проверяем размер файла
        if (audioFile.size > CONFIG.FEATURES.MAX_FILE_SIZE * 1024 * 1024) {
            this.showToast(`Файл слишком большой (максимум ${CONFIG.FEATURES.MAX_FILE_SIZE}MB)`, 'error');
            return;
        }

        try {
            // Извлекаем метаданные
            const metadata = await Utils.extractAudioMetadata(audioFile);
            
            // Показываем форму загрузки
            this.showUploadForm(audioFile, metadata);
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.showToast('Ошибка обработки файла', 'error');
        }
    }

    showUploadForm(audioFile, metadata) {
        const uploadZone = Utils.$('#uploadZone');
        const uploadFormWrapper = Utils.$('#uploadFormWrapper');
        
        if (uploadZone) uploadZone.style.display = 'none';
        if (uploadFormWrapper) uploadFormWrapper.classList.remove('hidden');

        // Заполняем данные из имени файла
        const fileName = audioFile.name.replace(/\.[^/.]+$/, ""); // убираем расширение
        const parts = fileName.split(' - ');
        
        const titleInput = Utils.$('#trackTitle');
        const artistInput = Utils.$('#trackArtist');
        
        if (parts.length >= 2) {
            if (titleInput) titleInput.value = parts[1];
            if (artistInput) artistInput.value = parts[0];
        } else {
            if (titleInput) titleInput.value = fileName;
        }

        // Сохраняем файл для отправки
        this.uploadFile = audioFile;
        this.uploadMetadata = metadata;
    }

    // === ПОИСК ===

    setupSearch() {
        const searchInput = Utils.$('#searchInput');
        const searchBtn = Utils.$('#searchBtn');

        if (!searchInput) return;

        const performSearch = Utils.debounce(async (query) => {
            if (query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
                this.showTrendingTracks();
                return;
            }

            try {
                this.showSearchResults(query);
            } catch (error) {
                console.error('Search error:', error);
                this.showToast('Ошибка поиска', 'error');
            }
        }, CONFIG.SEARCH.SEARCH_DELAY);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value.trim());
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(searchInput.value.trim());
            }
        });

        searchBtn?.addEventListener('click', () => {
            performSearch(searchInput.value.trim());
        });
    }

    async showSearchResults(query) {
        const searchResults = Utils.$('#searchResults');
        const trendingSection = Utils.$('#trendingSection');
        
        if (searchResults) searchResults.classList.remove('hidden');
        if (trendingSection) trendingSection.classList.add('hidden');

        // Показываем индикатор загрузки
        const searchTracks = Utils.$('#searchTracks');
        if (searchTracks) {
            searchTracks.innerHTML = '<div class="loading-more"><div class="spinner"></div><span>Поиск...</span></div>';
        }

        try {
            const response = await window.Storage.getTracks({ search: query, limit: 50 });
            this.displayTracks(response.tracks, '#searchTracks');
            
            // Обновляем заголовок результатов
            const resultsTitle = Utils.$('#searchResultsTitle');
            if (resultsTitle) {
                resultsTitle.textContent = `Результаты поиска "${query}" (${response.tracks.length})`;
            }
            
        } catch (error) {
            if (searchTracks) {
                searchTracks.innerHTML = '<div class="no-results"><div class="no-results-icon">😔</div><p>Ошибка поиска</p></div>';
            }
        }
    }

    async showTrendingTracks() {
        const searchResults = Utils.$('#searchResults');
        const trendingSection = Utils.$('#trendingSection');
        
        if (searchResults) searchResults.classList.add('hidden');
        if (trendingSection) trendingSection.classList.remove('hidden');

        try {
            const response = await window.Storage.getTracks({ filter: 'popular', limit: 20 });
            this.displayTracks(response.tracks, '#trendingTracks');
        } catch (error) {
            console.error('Error loading trending tracks:', error);
        }
    }

    // === СОДЕРЖИМОЕ ВКЛАДОК ===

    async loadHomeFeed() {
        const feedTracks = Utils.$('#feedTracks');
        if (!feedTracks) return;

        feedTracks.innerHTML = '<div class="loading-more"><div class="spinner"></div><span>Загружаем треки...</span></div>';

        try {
            const response = await window.Storage.getTracks({ filter: 'recent', limit: 20 });
            this.displayTracks(response.tracks, '#feedTracks');
        } catch (error) {
            feedTracks.innerHTML = '<div class="no-results"><div class="no-results-icon">😔</div><p>Ошибка загрузки</p></div>';
        }
    }

    async loadLibrary() {
        // Загрузка медиатеки пользователя
        // Пока заглушка
        const libraryTracks = Utils.$('#libraryTracks');
        if (libraryTracks) {
            libraryTracks.innerHTML = '<div class="no-results"><div class="no-results-icon">📚</div><p>Ваша медиатека пока пуста</p></div>';
        }
    }

    async loadProfile() {
        if (!window.Auth?.isLoggedIn()) return;

        const user = window.Auth.getUser();
        if (!user) return;

        try {
            const response = await window.Storage.getTracks({ userId: user.id });
            this.displayTracks(response.tracks, '#profileTracks');
            
            // Обновляем статистику
            const statsEl = Utils.$('#profileTracksCount');
            if (statsEl) {
                statsEl.textContent = response.tracks.length;
            }
        } catch (error) {
            console.error('Error loading profile tracks:', error);
        }
    }

    // === ОТОБРАЖЕНИЕ ТРЕКОВ ===

    displayTracks(tracks, containerSelector) {
        const container = Utils.$(containerSelector);
        if (!container) return;

        if (!tracks || tracks.length === 0) {
            container.innerHTML = '<div class="no-results"><div class="no-results-icon">🎵</div><p>Треков не найдено</p></div>';
            return;
        }

        container.innerHTML = '';

        tracks.forEach((track, index) => {
            const trackElement = this.createTrackElement(track, tracks, index);
            container.appendChild(trackElement);
        });
    }

    createTrackElement(track, playlist = null, index = 0) {
        const trackElement = Utils.createElement('div', {
            className: 'track-item',
            dataset: { trackId: track.id }
        });

        const coverUrl = track.coverUrl || '';
        const uploaderInfo = track.uploader ? `<span class="uploader">by ${track.uploader.username}</span>` : '';
        const stats = `
            ${track.plays || 0} прослушиваний
            ${track.likes || 0} лайков
        `;

        trackElement.innerHTML = `
            <div class="track-cover">
                ${coverUrl ? `<img src="${coverUrl}" alt="Cover" />` : ''}
                <div class="play-indicator">
                    <div class="play-icon">▶️</div>
                </div>
            </div>
            <div class="track-info">
                <div class="track-title">${Utils.stripHtml(track.title)}</div>
                <div class="track-artist">${Utils.stripHtml(track.artist)}</div>
                <div class="track-meta">
                    ${Utils.formatDate(track.uploadedAt)}
                    ${uploaderInfo}
                    <div class="track-stats">
                        <span class="track-plays">▶️ ${track.plays || 0}</span>
                        <span class="track-likes">❤️ ${track.likes || 0}</span>
                    </div>
                </div>
            </div>
            <div class="track-actions">
                <button class="track-btn like-btn" title="Нравится">
                    <span class="icon">❤️</span>
                </button>
                <button class="track-btn more-btn" title="Еще">
                    <span class="icon">⋯</span>
                </button>
            </div>
        `;

        // События для трека
        this.setupTrackEvents(trackElement, track, playlist, index);

        return trackElement;
    }

    setupTrackEvents(trackElement, track, playlist, index) {
        // Воспроизведение трека
        trackElement.addEventListener('click', (e) => {
            // Игнорируем клики по кнопкам действий
            if (e.target.closest('.track-actions')) return;
            
            this.playTrack(track, playlist, index);
        });

        // Кнопка лайка
        const likeBtn = trackElement.querySelector('.like-btn');
        likeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLike(track, likeBtn);
        });

        // Кнопка "Еще"
        const moreBtn = trackElement.querySelector('.more-btn');
        moreBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTrackContextMenu(e, track);
        });

        // Контекстное меню
        trackElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showTrackContextMenu(e, track);
        });
    }

    async playTrack(track, playlist = null, index = 0) {
        if (!window.Player) return;

        try {
            await window.Player.loadTrack(track, playlist, index);
            this.showMiniPlayer();
            
            // Обновляем UI для показа играющего трека
            this.updatePlayingTrackUI(track);
            
        } catch (error) {
            console.error('Error playing track:', error);
            this.showToast('Ошибка воспроизведения', 'error');
        }
    }

    updatePlayingTrackUI(track) {
        // Убираем выделение с предыдущего трека
        Utils.$('.track-item.playing').forEach(item => {
            item.classList.remove('playing');
        });

        // Выделяем текущий трек
        const currentTrackItem = Utils.$(`[data-track-id="${track.id}"]`);
        if (currentTrackItem) {
            currentTrackItem.classList.add('playing');
        }
    }

    async toggleLike(track, button) {
        if (!window.Auth?.isLoggedIn()) {
            this.showToast('Войдите, чтобы добавлять треки в медиатеку', 'warning');
            return;
        }

        try {
            const isLiked = await window.Storage.toggleLike(track.id);
            
            // Обновляем UI кнопки
            button.classList.toggle('liked', isLiked);
            
            // Показываем уведомление
            if (isLiked) {
                this.showToast('Трек добавлен в медиатеку', 'success');
            } else {
                this.showToast('Трек удален из медиатеки', 'info');
            }

            // Обновляем счетчик лайков в треке
            const likesSpan = button.closest('.track-item').querySelector('.track-likes');
            if (likesSpan) {
                const currentLikes = parseInt(likesSpan.textContent.replace(/\D/g, '')) || 0;
                likesSpan.textContent = `❤️ ${currentLikes + (isLiked ? 1 : -1)}`;
            }

        } catch (error) {
            console.error('Error toggling like:', error);
            this.showToast('Ошибка при добавлении в медиатеку', 'error');
        }
    }

    showTrackContextMenu(event, track) {
        const x = event.clientX;
        const y = event.clientY;

        const isLoggedIn = window.Auth?.isLoggedIn();
        const isOwnTrack = isLoggedIn && window.Auth.getUser().id === track.uploaderId;

        const menuItems = [
            {
                icon: '▶️',
                label: 'Воспроизвести',
                onClick: () => this.playTrack(track)
            },
            {
                icon: '⏭️',
                label: 'Играть следующим',
                onClick: () => window.Player?.addToQueue(track, 'next')
            },
            {
                icon: '📋',
                label: 'Добавить в очередь',
                onClick: () => window.Player?.addToQueue(track, 'end')
            }
        ];

        if (isLoggedIn) {
            menuItems.push(
                { type: 'divider' },
                {
                    icon: '❤️',
                    label: 'Добавить в медиатеку',
                    onClick: () => this.toggleLike(track, event.target)
                },
                {
                    icon: '➕',
                    label: 'Добавить в плейлист',
                    onClick: () => this.showAddToPlaylistModal(track)
                }
            );
        }

        menuItems.push(
            { type: 'divider' },
            {
                icon: '📤',
                label: 'Поделиться',
                onClick: () => this.shareTrack(track)
            },
            {
                icon: '👤',
                label: 'Перейти к автору',
                onClick: () => this.goToUser(track.uploaderId)
            }
        );

        // Если это свой трек, добавляем опции редактирования
        if (isOwnTrack) {
            menuItems.push(
                { type: 'divider' },
                {
                    icon: '✏️',
                    label: 'Редактировать',
                    onClick: () => this.editTrack(track)
                },
                {
                    icon: '🗑️',
                    label: 'Удалить',
                    dangerous: true,
                    onClick: () => this.deleteTrack(track)
                }
            );
        }

        this.showContextMenu(x, y, menuItems);
    }

    async shareTrack(track) {
        const shareUrl = `${window.location.origin}?track=${track.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: track.title,
                    text: `Послушайте "${track.title}" от ${track.artist}`,
                    url: shareUrl
                });
            } catch (error) {
                // Пользователь отменил шаринг
            }
        } else {
            // Fallback - копируем в буфер обмена
            try {
                await navigator.clipboard.writeText(shareUrl);
                this.showToast('Ссылка скопирована в буфер обмена', 'success');
            } catch (error) {
                this.showToast('Не удалось скопировать ссылку', 'error');
            }
        }
    }

    goToUser(userId) {
        // Переходим к профилю пользователя
        this.switchTab('profile');
        // TODO: загрузить профиль конкретного пользователя
    }

    async editTrack(track) {
        // TODO: показать модальное окно редактирования трека
        this.showToast('Редактирование треков будет добавлено в следующем обновлении', 'info');
    }

    async deleteTrack(track) {
        const confirmed = confirm(`Вы уверены, что хотите удалить трек "${track.title}"?`);
        if (!confirmed) return;

        try {
            await window.Storage.deleteTrack(track.id);
            this.showToast('Трек удален', 'success');
            
            // Удаляем элемент из DOM
            const trackElement = Utils.$(`[data-track-id="${track.id}"]`);
            if (trackElement) {
                trackElement.remove();
            }
            
            // Если удаленный трек сейчас играет, останавливаем
            if (window.Player?.getCurrentTrack()?.id === track.id) {
                window.Player.stop();
                this.hideMiniPlayer();
            }
            
        } catch (error) {
            console.error('Error deleting track:', error);
            this.showToast('Ошибка при удалении трека', 'error');
        }
    }

    showAddToPlaylistModal(track) {
        // TODO: показать модальное окно выбора плейлиста
        this.showToast('Плейлисты будут добавлены в следующем обновлении', 'info');
    }

    // === СЕНСОРНЫЕ ЖЕСТЫ ===

    setupTouch() {
        if (!Utils.isTouchDevice()) return;

        // Поддержка жестов для мини-плеера
        this.setupMiniPlayerGestures();
    }

    setupMiniPlayerGestures() {
        const miniPlayer = Utils.$('#miniPlayer');
        if (!miniPlayer) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;

        const onTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        };

        const onTouchMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
            // Если движение больше по вертикали, игнорируем
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;
            
            // Свайп для смены трека
            if (Math.abs(deltaX) > 50) {
                e.preventDefault();
                
                if (deltaX > 0) {
                    // Свайп вправо - предыдущий трек
                    window.Player?.previousTrack();
                } else {
                    // Свайп влево - следующий трек
                    window.Player?.nextTrack();
                }
                
                isDragging = false;
            }
        };

        const onTouchEnd = () => {
            isDragging = false;
        };

        miniPlayer.addEventListener('touchstart', onTouchStart);
        miniPlayer.addEventListener('touchmove', onTouchMove);
        miniPlayer.addEventListener('touchend', onTouchEnd);

        // Tap для открытия полноэкранного плеера
        let tapCount = 0;
        miniPlayer.addEventListener('click', (e) => {
            // Игнорируем клики по кнопкам
            if (e.target.closest('button')) return;
            
            tapCount++;
            setTimeout(() => {
                if (tapCount === 1) {
                    this.showFullPlayer();
                }
                tapCount = 0;
            }, 300);
        });
    }

    // === ОБНОВЛЕНИЕ UI ПЛЕЕРА ===

    updateMiniPlayer(track) {
        if (!track) {
            this.hideMiniPlayer();
            return;
        }

        const miniPlayerCover = Utils.$('#miniPlayerCover');
        const miniPlayerTitle = Utils.$('#miniPlayerTitle');
        const miniPlayerArtist = Utils.$('#miniPlayerArtist');
        const miniPlayBtn = Utils.$('#miniPlayBtn');

        if (miniPlayerCover) {
            miniPlayerCover.src = track.coverUrl || '/assets/default-cover.svg';
            miniPlayerCover.alt = track.title;
        }

        if (miniPlayerTitle) miniPlayerTitle.textContent = track.title;
        if (miniPlayerArtist) miniPlayerArtist.textContent = track.artist;

        // Обновляем кнопку воспроизведения
        if (miniPlayBtn && window.Player) {
            const icon = window.Player.isPlaying() ? '⏸️' : '▶️';
            miniPlayBtn.querySelector('.icon').textContent = icon;
        }

        this.showMiniPlayer();
    }

    updateFullPlayer(track) {
        if (!track) return;

        const fullPlayerCover = Utils.$('#fullPlayerCover');
        const fullPlayerTitle = Utils.$('#fullPlayerTitle');
        const fullPlayerArtist = Utils.$('#fullPlayerArtist');
        const mainPlayBtn = Utils.$('#mainPlayBtn');

        if (fullPlayerCover) {
            fullPlayerCover.src = track.coverUrl || '/assets/default-cover.svg';
            fullPlayerCover.alt = track.title;
        }

        if (fullPlayerTitle) fullPlayerTitle.textContent = track.title;
        if (fullPlayerArtist) fullPlayerArtist.textContent = track.artist;

        // Обновляем кнопку воспроизведения
        if (mainPlayBtn && window.Player) {
            const icon = window.Player.isPlaying() ? '⏸️' : '▶️';
            mainPlayBtn.querySelector('.icon').textContent = icon;
        }
    }

    updateProgress(currentTime, duration) {
        // Обновляем прогресс в мини-плеере
        const miniProgressFill = Utils.$('#miniProgressFill');
        if (miniProgressFill && duration > 0) {
            const progress = (currentTime / duration) * 100;
            miniProgressFill.style.width = `${progress}%`;
        }

        // Обновляем прогресс в полноэкранном плеере
        const progressFill = Utils.$('#progressFill');
        const progressHandle = Utils.$('#progressHandle');
        
        if (progressFill && duration > 0) {
            const progress = (currentTime / duration) * 100;
            progressFill.style.width = `${progress}%`;
            
            if (progressHandle) {
                progressHandle.style.left = `${progress}%`;
            }
        }

        // Обновляем время
        const currentTimeEl = Utils.$('#currentTime');
        const totalTimeEl = Utils.$('#totalTime');
        
        if (currentTimeEl) currentTimeEl.textContent = Utils.formatTime(currentTime);
        if (totalTimeEl) totalTimeEl.textContent = Utils.formatTime(duration);
    }

    // === УТИЛИТЫ ===

    setupTouch() {
        if (!Utils.isTouchDevice()) return;
        
        this.setupMiniPlayerGestures();
        this.setupPlayerSwipe();
    }
}

// Экспортируем класс
window.UIManager = UIManager;
