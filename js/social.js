// =============================================================================
// 📄 ФАЙЛ: js/social.js - Социальные функции
// =============================================================================

class SocialManager {
    constructor() {
        this.likes = new Set();
        this.following = new Set();
        this.likedTracks = [];
        
        this.init();
    }

    init() {
        this.loadLikes();
        this.loadFollowing();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Слушаем события лайков
        document.addEventListener('track:like', (e) => {
            this.handleTrackLike(e.detail);
        });

        document.addEventListener('user:follow', (e) => {
            this.handleUserFollow(e.detail);
        });
    }

    loadLikes() {
        try {
            const saved = localStorage.getItem('soundwave_likes');
            if (saved) {
                const likedData = JSON.parse(saved);
                this.likes = new Set(likedData.ids || []);
                this.likedTracks = likedData.tracks || [];
            }
        } catch (error) {
            console.warn('Could not load likes:', error);
        }
    }

    saveLikes() {
        try {
            const likedData = {
                ids: [...this.likes],
                tracks: this.likedTracks,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('soundwave_likes', JSON.stringify(likedData));
        } catch (error) {
            console.warn('Could not save likes:', error);
        }
    }

    loadFollowing() {
        try {
            const saved = localStorage.getItem('soundwave_following');
            if (saved) {
                this.following = new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Could not load following:', error);
        }
    }

    saveFollowing() {
        try {
            localStorage.setItem('soundwave_following', JSON.stringify([...this.following]));
        } catch (error) {
            console.warn('Could not save following:', error);
        }
    }

    toggleLike(track) {
        const isCurrentlyLiked = this.likes.has(track.id);
        
        if (isCurrentlyLiked) {
            this.likes.delete(track.id);
            this.likedTracks = this.likedTracks.filter(t => t.id !== track.id);
        } else {
            this.likes.add(track.id);
            this.likedTracks.push(track);
        }
        
        this.saveLikes();
        
        // Обновляем UI
        this.updateLikeButtons(track.id, !isCurrentlyLiked);
        
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent('track:liked', {
            detail: { trackId: track.id, isLiked: !isCurrentlyLiked, track }
        }));

        return !isCurrentlyLiked;
    }

    isLiked(trackId) {
        return this.likes.has(trackId);
    }

    getLikedTracks() {
        return [...this.likedTracks];
    }

    updateLikeButtons(trackId, isLiked) {
        const trackElements = Utils.$$(`[data-track-id="${trackId}"]`);
        
        trackElements.forEach(element => {
            const likeBtn = element.querySelector('.like-btn');
            const icon = likeBtn?.querySelector('.icon');
            
            if (likeBtn && icon) {
                likeBtn.classList.toggle('liked', isLiked);
                icon.textContent = isLiked ? '❤️' : '🤍';
                
                if (isLiked) {
                    likeBtn.classList.add('pulse-on-play');
                    setTimeout(() => likeBtn.classList.remove('pulse-on-play'), 300);
                }
            }
        });
    }

    handleTrackLike(detail) {
        const { trackId, isLiked } = detail;
        this.updateLikeButtons(trackId, isLiked);
    }

    toggleFollow(user) {
        const isCurrentlyFollowing = this.following.has(user.id);
        
        if (isCurrentlyFollowing) {
            this.following.delete(user.id);
        } else {
            this.following.add(user.id);
        }
        
        this.saveFollowing();
        
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent('user:followed', {
            detail: { userId: user.id, isFollowing: !isCurrentlyFollowing, user }
        }));

        return !isCurrentlyFollowing;
    }

    isFollowing(userId) {
        return this.following.has(userId);
    }

    getFollowing() {
        return [...this.following];
    }

    handleUserFollow(detail) {
        const { userId, isFollowing } = detail;
        
        // Обновляем кнопки подписки в UI
        const followButtons = Utils.$$(`[data-user-id="${userId}"] .follow-btn`);
        followButtons.forEach(btn => {
            btn.textContent = isFollowing ? 'Отписаться' : 'Подписаться';
            btn.classList.toggle('following', isFollowing);
        });
    }

    // Получение статистики
    getStats() {
        return {
            likedTracks: this.likes.size,
            following: this.following.size,
            lastActivity: new Date().toISOString()
        };
    }

    // Очистка данных
    clearAllData() {
        this.likes.clear();
        this.following.clear();
        this.likedTracks = [];
        
        localStorage.removeItem('soundwave_likes');
        localStorage.removeItem('soundwave_following');
        
        window.UI?.showToast('Данные очищены', 'info');
    }

    // Экспорт данных пользователя
    exportUserData() {
        const data = {
            likes: [...this.likes],
            likedTracks: this.likedTracks,
            following: [...this.following],
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        return data;
    }

    // Импорт данных пользователя
    importUserData(data) {
        try {
            if (data.likes) {
                this.likes = new Set(data.likes);
            }
            if (data.likedTracks) {
                this.likedTracks = data.likedTracks;
            }
            if (data.following) {
                this.following = new Set(data.following);
            }
            
            this.saveLikes();
            this.saveFollowing();
            
            window.UI?.showToast('Данные импортированы', 'success');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            window.UI?.showToast('Ошибка импорта данных', 'error');
            return false;
        }
    }
}
