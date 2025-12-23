// Supabase конфигурация
const SUPABASE_URL = 'https://kqortewzwvwfhtjqjfor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3J0ZXd6d3Z3Zmh0anFqZm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTA4MjgsImV4cCI6MjA3ODM4NjgyOH0.f4fNkeJ40VOtoto0-rIsWp4ntSjyXhtowaazcx_5v2s';

let supabase = null;
let currentUser = null;
const adminUsers = ['ReFinek', 'HumidGolf', 'summi225', 'Admin', 'Root'];

// Инициализация Supabase
async function initSupabase() {
    console.log('🔌 Инициализация Supabase...');
    
    try {
        // Проверяем, загружена ли библиотека
        if (typeof window.supabase === 'undefined') {
            throw new Error('Библиотека Supabase не загружена');
        }
        
        // Создаем клиент
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase клиент создан');
        
        // Тестируем подключение
        return await testSupabaseConnection();
    } catch (error) {
        console.error('❌ Ошибка инициализации Supabase:', error);
        showNotification('Ошибка подключения к базе данных', 'error');
        return false;
    }
}

// Тестирование подключения к Supabase
async function testSupabaseConnection() {
    try {
        console.log('🔍 Тестирование подключения к Supabase...');
        
        const { data, error } = await supabase
            .from('users')
            .select('username')
            .limit(1);
            
        if (error && error.code !== 'PGRST116') { // PGRST116 = таблица пустая
            throw error;
        }
        
        console.log('✅ Подключение к Supabase успешно!');
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
        showNotification('Ошибка подключения к базе данных', 'error');
        return false;
    }
}

// Проверка статуса авторизации
async function checkAuthStatus() {
    currentUser = localStorage.getItem('otkazano_current_user');
    
    if (currentUser) {
        console.log(`🔍 Проверка авторизации для: ${currentUser}`);
        
        try {
            if (!supabase) {
                console.warn('⚠️ Supabase не доступен, используем локальные данные');
                updateAuthUI();
                return;
            }
            
            const { data: user, error } = await supabase
                .from('users')
                .select('username, avatar, is_admin, email')
                .eq('username', currentUser)
                .maybeSingle();
                
            if (error) {
                console.error('❌ Ошибка проверки пользователя:', error);
                if (error.code === 'PGRST116' || error.code === '42P01') {
                    // Пользователь не найден или таблица не существует
                    logoutUser();
                }
                return;
            }
            
            if (!user) {
                console.log('👤 Пользователь не найден в базе');
                logoutUser();
                return;
            }
            
            console.log('✅ Пользователь подтвержден:', currentUser);
            updateAuthUI(user);
        } catch (error) {
            console.error('❌ Ошибка проверки статуса авторизации:', error);
            showNotification('Ошибка проверки авторизации', 'error');
        }
    } else {
        updateAuthUI(null);
    }
}

// Регистрация пользователя
async function registerUser(username, password, email = '', avatar = null) {
    if (!supabase) {
        showNotification('База данных недоступна', 'error');
        return false;
    }
    
    try {
        // Проверяем существование пользователя
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();
            
        if (existingUser) {
            showNotification('Пользователь с таким логином уже существует', 'error');
            return false;
        }
        
        // Создаем нового пользователя
        const { error } = await supabase
            .from('users')
            .insert({
                username: username,
                password: password,
                email: email,
                avatar: avatar,
                is_admin: adminUsers.includes(username),
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString(),
                status: 'online'
            });
            
        if (error) {
            console.error('❌ Ошибка регистрации:', error);
            showNotification('Ошибка регистрации: ' + error.message, 'error');
            return false;
        }
        
        // Сохраняем текущего пользователя
        localStorage.setItem('otkazano_current_user', username);
        currentUser = username;
        
        showNotification(`Добро пожаловать, ${username}!`, 'success');
        return true;
    } catch (error) {
        console.error('❌ Критическая ошибка регистрации:', error);
        showNotification('Ошибка регистрации. Попробуйте позже.', 'error');
        return false;
    }
}

// Вход пользователя
async function loginUser(username, password, rememberMe = false) {
    if (!supabase) {
        showNotification('База данных недоступна', 'error');
        return false;
    }
    
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();
            
        if (error) {
            console.error('❌ Ошибка запроса пользователя:', error);
            showNotification('Ошибка базы данных', 'error');
            return false;
        }
        
        if (!user) {
            showNotification('Пользователь не найден', 'error');
            return false;
        }
        
        if (user.password !== password) {
            showNotification('Неверный пароль', 'error');
            return false;
        }
        
        // Обновляем время последнего входа
        await supabase
            .from('users')
            .update({ 
                last_login: new Date().toISOString(),
                status: 'online'
            })
            .eq('username', username);
            
        // Сохраняем пользователя
        localStorage.setItem('otkazano_current_user', username);
        if (rememberMe) {
            localStorage.setItem('otkazano_remember_me', 'true');
        }
        
        currentUser = username;
        showNotification(`Добро пожаловать, ${username}!`, 'success');
        return true;
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        showNotification('Ошибка входа. Попробуйте позже.', 'error');
        return false;
    }
}

// Смена пароля
async function changePassword(username, oldPassword, newPassword) {
    if (!supabase) {
        showNotification('База данных недоступна', 'error');
        return false;
    }
    
    try {
        // Проверяем старый пароль
        const { data: user, error: checkError } = await supabase
            .from('users')
            .select('password')
            .eq('username', username)
            .maybeSingle();
            
        if (checkError) {
            console.error('❌ Ошибка проверки пароля:', checkError);
            showNotification('Ошибка проверки пароля', 'error');
            return false;
        }
        
        if (!user || user.password !== oldPassword) {
            showNotification('Старый пароль неверен', 'error');
            return false;
        }
        
        // Обновляем пароль
        const { error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('username', username);
            
        if (error) {
            console.error('❌ Ошибка обновления пароля:', error);
            showNotification('Ошибка смены пароля', 'error');
            return false;
        }
        
        showNotification('Пароль успешно изменен!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Ошибка смены пароля:', error);
        showNotification('Ошибка смены пароля', 'error');
        return false;
    }
}

// Обновление аватарки
async function updateUserAvatar(avatarDataUrl) {
    if (!supabase || !currentUser) {
        showNotification('Ошибка обновления аватарки', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ avatar: avatarDataUrl })
            .eq('username', currentUser);
            
        if (error) {
            console.error('❌ Ошибка обновления аватарки:', error);
            showNotification('Ошибка обновления аватарки: ' + error.message, 'error');
            return;
        }
        
        showNotification('Аватарка успешно обновлена!', 'success');
        // Обновляем UI
        checkAuthStatus();
    } catch (error) {
        console.error('❌ Ошибка обновления аватарки:', error);
        showNotification('Ошибка обновления аватарки', 'error');
    }
}

// Выход из аккаунта
function logoutUser() {
    // Обновляем статус пользователя на offline
    if (supabase && currentUser) {
        supabase
            .from('users')
            .update({ status: 'offline' })
            .eq('username', currentUser)
            .then(() => {
                console.log('✅ Статус пользователя обновлен на offline');
            })
            .catch(error => {
                console.error('❌ Ошибка обновления статуса:', error);
            });
    }
    
    localStorage.removeItem('otkazano_current_user');
    localStorage.removeItem('otkazano_remember_me');
    currentUser = null;
    updateAuthUI(null);
    showNotification('Вы успешно вышли из аккаунта', 'success');
}

// Загрузка данных команды
async function loadTeamMembers() {
    if (!supabase) return [];
    
    try {
        const { data: members, error } = await supabase
            .from('team_members')
            .select('*')
            .order('role_priority', { ascending: true });
            
        if (error) {
            console.error('❌ Ошибка загрузки команды:', error);
            return [];
        }
        
        return members || [];
    } catch (error) {
        console.error('❌ Критическая ошибка загрузки команды:', error);
        return [];
    }
}

// Загрузка пользователей для админки
async function loadUsersForAdmin() {
    if (!supabase) return [];
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ Ошибка загрузки пользователей:', error);
            return [];
        }
        
        return users || [];
    } catch (error) {
        console.error('❌ Критическая ошибка загрузки пользователей:', error);
        return [];
    }
}

// Проверка прав администратора
function isAdmin() {
    return currentUser && adminUsers.includes(currentUser);
}

// Экспорт функций для использования в других модулях
window.supabaseUtils = {
    initSupabase,
    checkAuthStatus,
    registerUser,
    loginUser,
    changePassword,
    updateUserAvatar,
    logoutUser,
    loadTeamMembers,
    loadUsersForAdmin,
    isAdmin,
    currentUser,
    supabase
};