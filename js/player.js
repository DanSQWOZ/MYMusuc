// =============================================================================
// 📄 ФАЙЛ: js/player.js - Музыкальный плеер
// =============================================================================

class AudioPlayer {
    constructor() {
        this.audio = Utils.$('#audioPlayer') || this.createAudioElement();
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = CONFIG.PLAYER.DEFAULT_VOLUME / 100;
        this.isMuted = false;
        this.shuffle = false;
        this.repeat = 'none'; // 'none', 'one', 'all'
        
        this.init();
    }

    createAudioElement() {
    let audio = document.getElementById('audioPlayer');
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'audioPlayer';
        audio.preload = CONFIG.AUDIO.PRELOAD || 'metadata';
        document.body.appendChild(audio);
    }
    return audio;
}

    init() {
        this.setupEventListeners();
        this.setupControls();
        this.audio.volume = this.volume;
    }

    setupEventListeners() {
        // События аудио элемента
        this.audio.addEventListener('loadstart', () => this.onLoadStart());
        this.audio.addEventListener('canplay', () => this.onCanPlay());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // Медиа сессии (для уведомлений и внешних элементов управления)
        if ('mediaSession' in navigator) {
            this.setupMediaSession();
        }
    }

    setupControls() {
        // Мини плеер
        const miniPlayBtn = Utils.$('#miniPlayBtn');
        const miniPlayerContent = Utils.$('#miniPlayerContent');

        miniPlayBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayPause();
        });

        miniPlayerContent?.addEventListener('click', () => {
            window.UI.showFullPlayer();
        });

        // Полноэкранный плеер
        const mainPlayBtn = Utils.$('#mainPlayBtn');
        const prevBtn = Utils.$('#prevTrackBtn');
        const nextBtn = Utils.$('#nextTrackBtn');
        const shuffleBtn = Utils.$('#shuffleBtn');
        const repeatBtn = Utils.$('#repeatBtn');
        const volumeSlider = Utils.$('#volumeSlider');
        const volumeBtn = Utils.$('#volumeBtn');

        mainPlayBtn?.addEventListener('click', () => this.togglePlayPause());
        prevBtn?.addEventListener('click', () => this.previousTrack());
        nextBtn?.addEventListener('click', () => this.nextTrack());
        shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
        repeatBtn?.addEventListener('click', () => this.toggleRepeat());
        
        volumeSlider?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        volumeBtn?.addEventListener('click', () => this.toggleMute());

        // Прогресс бар
        this.setupProgressBar();
    }

    setupProgressBar() {
        const progressContainer = Utils.$('#progressContainer');
        const progressHandle = Utils.$('#progressHandle');

        if (!progressContainer) return;

        let isDragging = false;

        const updateProgress = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = percent * this.audio.duration;
            
            if (isFinite(newTime)) {
                this.audio.currentTime = newTime;
            }
        };

        progressContainer.addEventListener('click', updateProgress);

        // Drag and drop для прогресс бара
        progressHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            progressContainer.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateProgress(e);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                progressContainer.classList.remove('dragging');
            }
        });

        // Touch события для мобильных
        progressContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            updateProgress(touch);
        });
    }

    setupMediaSession() {
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime && isFinite(details.seekTime)) {
                this.audio.currentTime = details.seekTime;
            }
        });
    }

    // === ОСНОВНЫЕ МЕТОДЫ УПРАВЛЕНИЯ ===

    async loadTrack(track, playlist = null, index = 0) {
        this.currentTrack = track;
        
        if (playlist) {
            this.playlist = playlist;
            this.currentIndex = index;
        }

        this.audio.src = track.audioUrl;
        this.updateUI();
        
        // Увеличиваем счетчик прослушиваний
        if (window.Storage) {
            try {
                await window.Storage.incrementPlayCount(track.id);
            } catch (error) {
                console.warn('Could not increment play count:', error);
            }
        }

        // Обновляем Media Session
        this.updateMediaSession();
    }

    play() {
        if (!this.audio.src) return;
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Playback failed:', error);
                window.UI.showToast('Ошибка воспроизведения', 'error');
            });
        }
    }

    pause() {
        this.audio.pause();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.isMuted ? 0 : this.volume;
        
        // Обновляем UI
        const volumeSlider = Utils.$('#volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }

        this.updateVolumeIcon();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volumeBtn = Utils.$('#volumeBtn .icon');
        if (!volumeBtn) return;

        if (this.isMuted || this.volume === 0) {
            volumeBtn.textContent = '🔇';
        } else if (this.volume < 0.5) {
            volumeBtn.textContent = '🔉';
        } else {
            volumeBtn.textContent = '🔊';
        }
    }

    // === УПРАВЛЕНИЕ ПЛЕЙЛИСТОМ ===

    nextTrack() {
        if (this.playlist.length === 0) return;

        let nextIndex;
        
        if (this.shuffle) {
            do {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } while (nextIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            nextIndex = (this.currentIndex + 1) % this.playlist.length;
        }

        this.currentIndex = nextIndex;
        this.loadTrack(this.playlist[nextIndex], this.playlist, nextIndex);
        
        if (this.isPlaying) {
            this.play();
        }
    }

    previousTrack() {
        if (this.playlist.length === 0) return;

        // Если трек играет больше 3 секунд, перематываем в начало
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex;
        
        if (this.shuffle) {
            do {
                prevIndex = Math.floor(Math.random() * this.playlist.length);
            } while (prevIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            prevIndex = this.currentIndex === 0 
                ? this.playlist.length - 1 
                : this.currentIndex - 1;
        }

        this.currentIndex = prevIndex;
        this.loadTrack(this.playlist[prevIndex], this.playlist, prevIndex);
        
        if (this.isPlaying) {
            this.play();
        }
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        
        const shuffleBtn = Utils.$('#shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.shuffle);
        }

        window.UI.showToast(
            this.shuffle ? 'Перемешивание включено' : 'Перемешивание выключено',
            'info'
        );
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentModeIndex = modes.indexOf(this.repeat);
        this.repeat = modes[(currentModeIndex + 1) % modes.length];
        
        const repeatBtn = Utils.$('#repeatBtn');
        const repeatIcon = Utils.$('#repeatBtn .icon');
        
        if (repeatBtn && repeatIcon) {
            repeatBtn.className = `control-btn ${this.repeat !== 'none' ? 'active' : ''}`;
            
            switch (this.repeat) {
                case 'none':
                    repeatIcon.textContent = '🔁';
                    break;
                case 'all':
                    repeatIcon.textContent = '🔁';
                    break;
                case 'one':
                    repeatIcon.textContent = '🔂';
                    break;
            }
        }

        const messages = {
            'none': 'Повтор выключен',
            'all': 'Повтор плейлиста',
            'one': 'Повтор трека'
        };

        window.UI.showToast(messages[this.repeat], 'info');
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===

    onLoadStart() {
        // Показываем индикатор загрузки
        Utils.$$('.track-item.playing').forEach(item => {
            item.classList.add('loading');
        });
    }

    onCanPlay() {
        // Убираем индикатор загрузки
        Utils.$$('.track-item.loading').forEach(item => {
            item.classList.remove('loading');
        });
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButtons();
        
        // Показываем мини плеер
        window.UI.showMiniPlayer();
        
        // Запускаем анимации
        const artwork = Utils.$('.player-artwork');
        if (artwork) {
            artwork.classList.add('playing');
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.TRACK_PLAY, {
            detail: { track: this.currentTrack }
        }));
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButtons();
        
        // Останавливаем анимации
        const artwork = Utils.$('.player-artwork');
        if (artwork) {
            artwork.classList.remove('playing');
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.TRACK_PAUSE, {
            detail: { track: this.currentTrack }
        }));
    }

    onEnded() {
        switch (this.repeat) {
            case 'one':
                this.audio.currentTime = 0;
                this.play();
                break;
            case 'all':
                this.nextTrack();
                break;
            default:
                if (this.currentIndex < this.playlist.length - 1) {
                    this.nextTrack();
                } else {
                    this.isPlaying = false;
                    this.updatePlayButtons();
                }
        }

        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.TRACK_END, {
            detail: { track: this.currentTrack }
        }));
    }

    onTimeUpdate() {
        if (!this.currentTrack || !isFinite(this.audio.duration)) return;

        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        const progress = currentTime / duration;

        // Обновляем прогресс бары
        const progressFills = Utils.$$('.progress-fill, .mini-progress-fill');
        progressFills.forEach(fill => {
            fill.style.width = `${progress * 100}%`;
        });

        // Обновляем ручку прогресса
        const progressHandle = Utils.$('#progressHandle');
        if (progressHandle) {
            progressHandle.style.left = `${progress * 100}%`;
        }

        // Обновляем время
        const currentTimeEl = Utils.$('#currentTime');
        const totalTimeEl = Utils.$('#totalTime');
        
        if (currentTimeEl) {
            currentTimeEl.textContent = Utils.formatTime(currentTime);
        }
        
        if (totalTimeEl) {
            totalTimeEl.textContent = Utils.formatTime(duration);
        }

        // Обновляем Media Session
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: this.audio.playbackRate,
                    position: currentTime
                });
            } catch (error) {
                console.warn('Could not set position state:', error);
            }
        }

        // Диспатчим событие
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent(EVENTS.PLAYER_TIME_UPDATE, {
            detail: { 
                track: this.currentTrack, 
                currentTime, 
                duration, 
                progress 
            }
        }));
    }

    onError(e) {
        console.error('Audio playback error:', e);
        window.UI.showToast('Ошибка воспроизведения трека', 'error');
        
        // Пробуем следующий трек
        if (this.playlist.length > 1) {
            this.nextTrack();
        }
    }

    // === ОБНОВЛЕНИЕ UI ===

    updateUI() {
        if (!this.currentTrack) return;

        const track = this.currentTrack;

        // Мини плеер
        const miniTitle = Utils.$('#miniPlayerTitle');
        const miniArtist = Utils.$('#miniPlayerArtist');
        const miniCover = Utils.$('#miniPlayerCover');

        if (miniTitle) miniTitle.textContent = track.title;
        if (miniArtist) miniArtist.textContent = track.artist;
        if (miniCover) {
            miniCover.src = track.coverUrl || '';
            miniCover.alt = `${track.title} - ${track.artist}`;
        }

        // Полноэкранный плеер
        const fullTitle = Utils.$('#fullPlayerTitle');
        const fullArtist = Utils.$('#fullPlayerArtist');
        const fullCover = Utils.$('#fullPlayerCover');

        if (fullTitle) fullTitle.textContent = track.title;
        if (fullArtist) fullArtist.textContent = track.artist;
        if (fullCover) {
            fullCover.src = track.coverUrl || '';
            fullCover.alt = `${track.title} - ${track.artist}`;
        }

        // Обновляем фон плеера
        this.updatePlayerBackground();
        
        // Обновляем активный трек в списках
        this.updateActiveTrack();
    }

    updatePlayerBackground() {
        if (!this.currentTrack?.coverUrl) return;

        const fullPlayer = Utils.$('#fullPlayer');
        if (fullPlayer) {
            // Устанавливаем фон с размытием
            fullPlayer.style.setProperty('--bg-image', `url(${this.currentTrack.coverUrl})`);
        }
    }

    updateActiveTrack() {
        // Убираем класс playing со всех треков
        Utils.$('.track-item').forEach(item => {
            item.classList.remove('playing');
        });

        // Добавляем класс playing к текущему треку
        if (this.currentTrack) {
            const activeTrack = Utils.$(`[data-track-id="${this.currentTrack.id}"]`);
            if (activeTrack) {
                activeTrack.classList.add('playing');
            }
        }
    }

    updatePlayButtons() {
        const playBtns = Utils.$('#miniPlayBtn .icon, #mainPlayBtn .icon');
        const icon = this.isPlaying ? '⏸️' : '▶️';
        
        playBtns.forEach(btn => {
            btn.textContent = icon;
        });

        // Обновляем класс для анимаций
        const mainPlayBtn = Utils.$('#mainPlayBtn');
        if (mainPlayBtn) {
            mainPlayBtn.classList.toggle('playing', this.isPlaying);
        }
    }

    updateMediaSession() {
        if (!('mediaSession' in navigator) || !this.currentTrack) return;

        const track = this.currentTrack;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            artwork: track.coverUrl ? [
                { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }
            ] : []
        });
    }
}
            
