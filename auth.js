// 📄 ФАЙЛ: js/auth.js - Система авторизации
// =============================================================================

class AuthManager {
    constructor() {
        this.storage = new StorageManager();
        this.currentUser = null;
        this.init();
    }

    init() {
        // Проверяем токен при загрузке
        if (this.storage.token) {
            this.loadCurrentUser();
        }

        // Слушаем события авторизации
        window.addEventListener('auth:login', (e) => this.handleLogin(e.detail));
        window.addEventListener('auth:logout', () => this.handleLogout());
    }

    async loadCurrentUser() {
        try {
            const response = await this.storage.getCurrentUser();
            this.currentUser = response.user;
            this.updateUI();
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.handleLogout();
        }
    }

    async register(username, password) {
        // Валидация
        const usernameError = Utils.validateUsername(username);
        if (usernameError) throw new Error(usernameError);

        const passwordError = Utils.validatePassword(password);
        if (passwordError) throw new Error(passwordError);

        try {
            const response = await this.storage.register(username, password);
            
            this.storage.setToken(response.token);
            this.currentUser = response.user;
            
            // Уведомляем о входе
            window.dispatchEvent(new CustomEvent('auth:login', { 
                detail: { user: this.currentUser, isNewUser: true } 
            }));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async login(username, password) {
        try {
            const response = await this.storage.login(username, password);
            
            this.storage.setToken(response.token);
            this.currentUser = response.user;
            
            // Уведомляем о входе
            window.dispatchEvent(new CustomEvent('auth:login', { 
                detail: { user: this.currentUser, isNewUser: false } 
            }));

            return response;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        this.storage.removeToken();
        this.storage.clearCache();
        this.currentUser = null;
        
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    handleLogin(detail) {
        this.updateUI();
        
        // Показываем уведомление
        const message = detail.isNewUser 
            ? `Добро пожаловать, ${detail.user.username}!` 
            : `С возвращением, ${detail.user.username}!`;
            
        window.UI.showToast(message, 'success');
        
        // Переключаемся на главную
        window.UI.switchTab('home');
    }

    handleLogout() {
        this.currentUser = null;
        this.updateUI();
        window.UI.showToast('Вы вышли из системы', 'info');
        
        // Возвращаемся на экран приветствия
        const app = Utils.$('#app');
        const welcomeScreen = Utils.$('#welcomeScreen');
        const mainApp = Utils.$('#mainApp');
        
        welcomeScreen?.classList.remove('hidden');
        mainApp?.classList.add('hidden');
    }

    updateUI() {
        const isLoggedIn = !!this.currentUser;
        
        // Обновляем заголовок
        const headerAvatar = Utils.$('#headerAvatar');
        const avatarText = Utils.$('#headerAvatar .avatar-text');
        
        if (headerAvatar && this.currentUser) {
            if (avatarText) {
                avatarText.textContent = this.currentUser.username[0].toUpperCase();
            }
            
            if (this.currentUser.avatar) {
                headerAvatar.style.backgroundImage = `url(${this.currentUser.avatar})`;
                headerAvatar.style.backgroundSize = 'cover';
            }
        }

        // Обновляем профиль
        this.updateProfile();
        
        // Показываем/скрываем элементы для авторизованных пользователей
        const authRequired = Utils.$$('.auth-required');
        authRequired.forEach(el => {
            el.classList.toggle('hidden', isLoggedIn);
        });
    }

    updateProfile() {
        if (!this.currentUser) return;

        const user = this.currentUser;
        
        // Обновляем данные профиля
        const elements = {
            '#profileDisplayName': user.displayName || user.username,
            '#profileUsername': `@${user.username}`,
            '#profileTracksCount': user.tracksCount || 0,
            '#profileFollowersCount': user.followersCount || 0,
            '#profileFollowingCount': user.followingCount || 0,
            '#profileAvatarText': user.username[0].toUpperCase()
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = Utils.$(selector);
            if (element) {
                element.textContent = value;
            }
        });

        // Устанавливаем аватар
        const profileAvatar = Utils.$('#profileAvatarLarge');
        if (profileAvatar && user.avatar) {
            profileAvatar.style.backgroundImage = `url(${user.avatar})`;
            profileAvatar.style.backgroundSize = 'cover';
        }
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }
}
