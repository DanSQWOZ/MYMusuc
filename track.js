// =============================================================================
// 📄 ФАЙЛ: js/tracks.js - Управление треками
// =============================================================================

class TracksManager {
    constructor() {
        this.tracks = [];
        this.currentFilter = 'recent';
        this.isLoading = false;
        this.hasMore = true;
        this.offset = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Фильтры в ленте
        Utils.$$('.feed-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Бесконечная прокрутка
        window.addEventListener('scroll', Utils.throttle(() => {
            this.checkInfiniteScroll();
        }, 250));
    }

    setFilter(filter) {
        if (this.currentFilter === filter || this.isLoading) return;

        this.currentFilter = filter;
        this.offset = 0;
        this.hasMore = true;
        
        // Обновляем активный фильтр
        Utils.$$('.feed-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Перезагружаем треки
        this.loadTracks(true);
    }

    async loadTracks(reset = false) {
        if (this.isLoading || (!this.hasMore && !reset)) return;

        this.isLoading = true;

        if (reset) {
            this.tracks = [];
            this.offset = 0;
        }

        try {
            const response = await window.Storage.getTracks({
                filter: this.currentFilter,
                limit: CONFIG.FEATURES.TRACKS_PER_PAGE,
                offset: this.offset
            });

            if (reset) {
                this.tracks = response.tracks;
            } else {
                this.tracks = [...this.tracks, ...response.tracks];
            }

            this.hasMore = response.hasMore;
            this.offset += response.tracks.length;

            // Отображаем треки
            this.renderTracks(reset);

        } catch (error) {
            console.error('Error loading tracks:', error);
            window.UI.showToast('Ошибка загрузки треков', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }

    renderTracks(reset = false) {
        const container = Utils.$('#feedTracks');
        if (!container) return;

        if (reset) {
            container.innerHTML = '';
        }

        const tracksToRender = reset ? this.tracks : this.tracks.slice(-CONFIG.FEATURES.TRACKS_PER_PAGE);
        
        tracksToRender.forEach((track, index) => {
            const globalIndex = reset ? index : this.tracks.indexOf(track);
            const trackElement = window.UI.createTrackElement(track, this.tracks, globalIndex);
            container.appendChild(trackElement);
        });

        if (this.tracks.length === 0 && reset) {
            container.innerHTML = '<div class="no-results"><div class="no-results-icon">🎵</div><p>Треков пока нет</p></div>';
        }
    }

    checkInfiniteScroll() {
        if (this.isLoading || !this.hasMore) return;

        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.documentElement.offsetHeight - 1000;

        if (scrollPosition >= threshold) {
            this.showLoadingIndicator();
            this.loadTracks();
        }
    }

    showLoadingIndicator() {
        const loadingMore = Utils.$('#loadingMore');
        if (loadingMore) {
            loadingMore.classList.remove('hidden');
        }
    }

    hideLoadingIndicator() {
        const loadingMore = Utils.$('#loadingMore');
        if (loadingMore) {
            loadingMore.classList.add('hidden');
        }
    }

    // Метод для обновления трека в списке
    updateTrack(updatedTrack) {
        const index = this.tracks.findIndex(track => track.id === updatedTrack.id);
        if (index !== -1) {
            this.tracks[index] = { ...this.tracks[index], ...updatedTrack };
            this.renderTracks(true);
        }
    }

    // Поиск треков
    async searchTracks(query, filter = 'all') {
        try {
            const response = await window.Storage.getTracks({
                search: query,
                filter: filter === 'all' ? undefined : filter,
                limit: CONFIG.SEARCH.MAX_RESULTS
            });
            
            return response.tracks;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Получение треков пользователя
    async getUserTracks(userId) {
        try {
            const response = await window.Storage.getTracks({
                userId: userId,
                limit: 100
            });
            
            return response.tracks;
        } catch (error) {
            console.error('Error loading user tracks:', error);
            throw error;
        }
    }

    // Получение популярных треков
    async getPopularTracks(limit = 20) {
        try {
            const response = await window.Storage.getTracks({
                filter: 'popular',
                limit: limit
            });
            
            return response.tracks;
        } catch (error) {
            console.error('Error loading popular tracks:', error);
            throw error;
        }
    }
}
