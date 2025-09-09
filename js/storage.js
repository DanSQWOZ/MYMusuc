// =============================================================================
// 📄 ФАЙЛ: js/storage.js - Работа с данными и API
// =============================================================================

class StorageManager {
    constructor() {
        this.baseURL = 'https://mymusuc.onrender.com/'; // Для продакшена будет URL вашего сервера на Render
        this.token = localStorage.getItem('soundwave_token');
    }

    // Установка токена авторизации
    setToken(token) {
        this.token = token;
        localStorage.setItem('soundwave_token', token);
    }

    // Удаление токена
    removeToken() {
        this.token = null;
        localStorage.removeItem('soundwave_token');
    }

    // Получение заголовков для API запросов
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Универсальный метод для API запросов
    async apiRequest(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        
        const config = {
            method: 'GET',
            ...options,
            headers: {
                ...(options.headers || {}),
                ...(options.method !== 'GET' && !options.body?.constructor?.name?.includes('FormData') ? this.getHeaders() : {})
            }
        };

        if (this.token && !options.skipAuth) {
            if (!config.headers['Authorization']) {
                config.headers['Authorization'] = `Bearer ${this.token}`;
            }
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Токен недействителен - выходим из системы
                this.removeToken();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Сессия истекла');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // === МЕТОДЫ ДЛЯ АВТОРИЗАЦИИ ===
    
    async register(username, password) {
        return this.apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipAuth: true
        });
    }

    async login(username, password) {
        return this.apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipAuth: true
        });
    }

    async getCurrentUser() {
        return this.apiRequest('/auth/me');
    }

    // === МЕТОДЫ ДЛЯ ТРЕКОВ ===
    
    async getTracks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.apiRequest(`/tracks${queryString ? '?' + queryString : ''}`);
    }

    async getTrack(id) {
        return this.apiRequest(`/tracks/${id}`);
    }

    async uploadTrack(formData) {
        const url = `${this.baseURL}/api/tracks/upload`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    }

    async incrementPlayCount(trackId) {
        return this.apiRequest(`/tracks/${trackId}/play`, {
            method: 'POST'
        });
    }

    // === ЛОКАЛЬНОЕ КЕШИРОВАНИЕ (для производительности) ===
    
    getCachedTracks() {
        try {
            const cached = localStorage.getItem('soundwave_cached_tracks');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    }

    setCachedTracks(tracks) {
        try {
            localStorage.setItem('soundwave_cached_tracks', JSON.stringify(tracks));
        } catch (error) {
            console.warn('Could not cache tracks:', error);
        }
    }

    clearCache() {
        localStorage.removeItem('soundwave_cached_tracks');
    }
}
