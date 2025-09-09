// 🎵 СЕРВЕР ДЛЯ МУЗЫКАЛЬНОЙ ПЛАТФОРМЫ SOUNDWAVE
// Простой Node.js сервер с файловым хранилищем

const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 НАСТРОЙКИ
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
const UPLOAD_DIR = 'uploads';
const DATA_DIR = 'data';
const AVATARS_DIR = path.join(UPLOAD_DIR, 'avatars');
const COVERS_DIR = path.join(UPLOAD_DIR, 'covers');
const TRACKS_DIR = path.join(UPLOAD_DIR, 'tracks');

// 📁 СОЗДАНИЕ ДИРЕКТОРИЙ
const createDirectories = () => {
    [UPLOAD_DIR, DATA_DIR, AVATARS_DIR, COVERS_DIR, TRACKS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createDirectories();

// 🛠️ MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Статические файлы
app.use(express.static('.'));
app.use('/uploads', express.static(UPLOAD_DIR));

// 📦 ХРАНИЛИЩЕ ДАННЫХ (JSON файлы)
const DB_FILES = {
    users: path.join(DATA_DIR, 'users.json'),
    tracks: path.join(DATA_DIR, 'tracks.json'),
    likes: path.join(DATA_DIR, 'likes.json'),
    stats: path.join(DATA_DIR, 'stats.json')
};

// Создаем файлы БД если их нет
Object.values(DB_FILES).forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([]));
    }
});

// 📋 ФУНКЦИИ ДЛЯ РАБОТЫ С БД
const readDB = (dbName) => {
    try {
        const data = fs.readFileSync(DB_FILES[dbName], 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка чтения ${dbName}:`, error);
        return [];
    }
};

const writeDB = (dbName, data) => {
    try {
        fs.writeFileSync(DB_FILES[dbName], JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Ошибка записи ${dbName}:`, error);
        return false;
    }
};

// 🔐 MIDDLEWARE ДЛЯ АВТОРИЗАЦИИ
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется токен авторизации' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// 📤 НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ФАЙЛОВ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = UPLOAD_DIR;
        
        if (file.fieldname === 'avatar') {
            uploadPath = AVATARS_DIR;
        } else if (file.fieldname === 'cover') {
            uploadPath = COVERS_DIR;
        } else if (file.fieldname === 'audio') {
            uploadPath = TRACKS_DIR;
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'audio') {
        // Аудиофайлы
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только аудиофайлы'), false);
        }
    } else {
        // Изображения
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения'), false);
        }
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// ================================
// 🔐 МАРШРУТЫ АВТОРИЗАЦИИ
// ================================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Валидация
        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Имя пользователя должно быть от 3 до 20 символов' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 4 символа' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Имя пользователя может содержать только буквы, цифры и подчеркивания' });
        }

        const users = readDB('users');

        // Проверяем, не занято ли имя пользователя
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем нового пользователя
        const newUser = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            displayName: username,
            avatar: null,
            cover: null,
            createdAt: new Date().toISOString(),
            tracksCount: 0,
            followersCount: 0,
            followingCount: 0
        };

        users.push(newUser);
        writeDB('users', users);

        // Создаем токен
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Возвращаем данные без пароля
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }

        const users = readDB('users');
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        // Создаем токен
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Возвращаем данные без пароля
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Успешный вход',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение данных текущего пользователя
app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const users = readDB('users');
        const user = users.find(u => u.id === req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });

    } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ================================
// 🎵 МАРШРУТЫ ДЛЯ ТРЕКОВ
// ================================

// Загрузка трека
app.post('/api/tracks/upload', authenticateToken, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), (req, res) => {
    try {
        const { title, artist, genre, mood, description, isPublic } = req.body;

        if (!req.files || !req.files.audio) {
            return res.status(400).json({ error: 'Аудиофайл обязателен' });
        }

        if (!title || !artist) {
            return res.status(400).json({ error: 'Название и исполнитель обязательны' });
        }

        const audioFile = req.files.audio[0];
        const coverFile = req.files.cover ? req.files.cover[0] : null;

        const tracks = readDB('tracks');
        
        const newTrack = {
            id: uuidv4(),
            title: title.trim(),
            artist: artist.trim(),
            genre: genre || null,
            mood: mood || null,
            description: description || null,
            isPublic: isPublic === 'true',
            audioUrl: `/uploads/tracks/${audioFile.filename}`,
            coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : null,
            duration: 0, // Будет обновлено клиентом
            uploadedBy: req.user.userId,
            uploadedAt: new Date().toISOString(),
            plays: 0,
            likes: 0
        };

        tracks.push(newTrack);
        writeDB('tracks', tracks);

        // Обновляем счетчик треков пользователя
        const users = readDB('users');
        const userIndex = users.findIndex(u => u.id === req.user.userId);
        if (userIndex !== -1) {
            users[userIndex].tracksCount = tracks.filter(t => t.uploadedBy === req.user.userId).length;
            writeDB('users', users);
        }

        res.status(201).json({
            message: 'Трек успешно загружен',
            track: newTrack
        });

    } catch (error) {
        console.error('Ошибка загрузки трека:', error);
        res.status(500).json({ error: 'Ошибка загрузки трека' });
    }
});

// Получение списка треков
app.get('/api/tracks', (req, res) => {
    try {
        const { filter = 'recent', limit = 20, offset = 0, search, userId } = req.query;
        
        let tracks = readDB('tracks');
        const users = readDB('users');

        // Добавляем информацию о пользователях к трекам
        tracks = tracks.map(track => {
            const user = users.find(u => u.id === track.uploadedBy);
            return {
                ...track,
                uploader: user ? {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.avatar
                } : null
            };
        });

        // Фильтр по пользователю
        if (userId) {
            tracks = tracks.filter(track => track.uploadedBy === userId);
        } else {
            // Показываем только публичные треки для общего списка
            tracks = tracks.filter(track => track.isPublic);
        }

        // Поиск
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                (track.description && track.description.toLowerCase().includes(searchLower))
            );
        }

        // Сортировка
        switch (filter) {
            case 'popular':
                tracks.sort((a, b) => (b.plays + b.likes) - (a.plays + a.likes));
                break;
            case 'recent':
            default:
                tracks.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                break;
        }

        // Пагинация
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedTracks = tracks.slice(startIndex, endIndex);

        res.json({
            tracks: paginatedTracks,
            total: tracks.length,
            hasMore: endIndex < tracks.length
        });

    } catch (error) {
        console.error('Ошибка получения треков:', error);
        res.status(500).json({ error: 'Ошибка получения треков' });
    }
});

// Получение трека по ID
app.get('/api/tracks/:id', (req, res) => {
    try {
        const tracks = readDB('tracks');
        const users = readDB('users');
        
        const track = tracks.find(t => t.id === req.params.id);
        
        if (!track) {
            return res.status(404).json({ error: 'Трек не найден' });
        }

        // Добавляем информацию о загрузившем пользователе
        const uploader = users.find(u => u.id === track.uploadedBy);
        const trackWithUploader = {
            ...track,
            uploader: uploader ? {
                id: uploader.id,
                username: uploader.username,
                displayName: uploader.displayName,
                avatar: uploader.avatar
            } : null
        };

        res.json({ track: trackWithUploader });

    } catch (error) {
        console.error('Ошибка получения трека:', error);
        res.status(500).json({ error: 'Ошибка получения трека' });
    }
});

// Увеличение счетчика прослушиваний
app.post('/api/tracks/:id/play', (req, res) => {
    try {
        const tracks = readDB('tracks');
        const trackIndex = tracks.findIndex(t => t.id === req.params.id);
        
        if (trackIndex === -1) {
            return res.status(404).json({ error: 'Трек не найден' });
        }

        tracks[trackIndex].plays = (tracks[trackIndex].plays || 0) + 1;
        writeDB('tracks', tracks);

        res.json({ message: 'Прослушивание засчитано', plays: tracks[trackIndex].plays });

    } catch (error) {
        console.error('Ошибка обновления прослушиваний:', error);
        res.status(500).json({ error: 'Ошибка обновления прослушиваний' });
    }
});

console.log('\n🎵 SoundWave Server запущен!');
console.log(`📡 Сервер доступен по адресу: http://localhost:${PORT}`);
console.log('📁 Структура каталогов создана');
console.log('💾 База данных готова к работе\n');

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой (максимум 50MB)' });
        }
    }
    
    res.status(500).json({ error: error.message });
});
