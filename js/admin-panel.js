// Инициализация админ-панели
function initAdminPanel() {
    console.log('🔧 Инициализация админ-панели...');
    
    // Проверяем права администратора
    const currentUser = window.supabaseUtils?.currentUser;
    const isAdmin = window.supabaseUtils?.isAdmin();
    
    if (!isAdmin) {
        console.log('❌ Пользователь не является администратором');
        hideAdminElements();
        return;
    }
    
    console.log('✅ Пользователь является администратором:', currentUser);
    showAdminElements();
    
    // Инициализация элементов админ-панели
    initAdminButtons();
    initAdminTabs();
    loadAdminUsers();
    initAdminCharts();
    
    // Отображение количества пользователей в статистике
    updateUsersStats();
}

// Отображение элементов админки
function showAdminElements() {
    // Показываем кнопку пользователей в навбаре
    const adminUsersSection = document.getElementById('admin-users-section');
    if (adminUsersSection) {
        adminUsersSection.style.display = 'block';
    }
    
    // Добавляем админ-бейдж к профилю
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        const adminBadge = document.createElement('div');
        adminBadge.className = 'admin-badge';
        adminBadge.innerHTML = '<i class="fas fa-crown"></i> АДМИН';
        authSection.parentNode.insertBefore(adminBadge, authSection.nextSibling);
    }
}

// Скрытие элементов админки
function hideAdminElements() {
    const adminUsersSection = document.getElementById('admin-users-section');
    if (adminUsersSection) {
        adminUsersSection.style.display = 'none';
    }
    
    // Удаляем админ-бейдж
    const adminBadge = document.querySelector('.admin-badge');
    if (adminBadge) {
        adminBadge.remove();
    }
}

// Инициализация кнопок админки
function initAdminButtons() {
    // Кнопка открытия админ-панели
    const usersBtn = document.getElementById('users-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminClose = document.getElementById('admin-close');
    
    if (usersBtn && adminModal) {
        usersBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminModal.classList.add('show');
            loadAdminUsers();
        });
    }
    
    if (adminClose && adminModal) {
        adminClose.addEventListener('click', () => {
            adminModal.classList.remove('show');
        });
        
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.classList.remove('show');
            }
        });
    }
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && adminModal.classList.contains('show')) {
            adminModal.classList.remove('show');
        }
    });
}

// Инициализация табов админ-панели
function initAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-button');
    const tabContents = document.querySelectorAll('.admin-content .tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Убираем активный класс у всех кнопок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            button.classList.add('active');
            
            // Скрываем все контенты
            tabContents.forEach(content => content.classList.remove('active'));
            // Показываем текущий контент
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Специальные действия для некоторых табов
            if (tabId === 'stats') {
                initAdminCharts();
            } else if (tabId === 'team') {
                loadTeamMembersForAdmin();
            }
        });
    });
}

// Загрузка пользователей для админки
async function loadAdminUsers() {
    showLoader('Загрузка пользователей...', 30);
    
    try {
        const users = await window.supabaseUtils.loadUsersForAdmin();
        renderAdminUsers(users);
        updateUsersStats(users.length);
        console.log('✅ Пользователи загружены для админки:', users.length);
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей для админки:', error);
        showNotification('Ошибка загрузки пользователей', 'error');
    } finally {
        hideLoader();
    }
}

// Рендеринг пользователей в админке
function renderAdminUsers(users = []) {
    const usersList = document.getElementById('admin-users-list');
    if (!usersList) return;
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="no-users">Пользователи не найдены</div>';
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-list-item';
        userElement.dataset.id = user.id;
        
        // Определяем роль для отображения
        let roleText = 'Пользователь';
        let roleClass = '';
        if (user.is_admin) {
            roleText = 'Администратор';
            roleClass = 'role-admin';
        }
        
        // Статус пользователя
        const statusClass = getStatusClass(user.status || 'offline');
        
        userElement.innerHTML = `
            <div class="user-cell user-avatar-cell">
                ${user.avatar ? 
                    `<img src="${user.avatar}" alt="${user.username}" class="user-avatar">` : 
                    `<div class="user-avatar-placeholder">${user.username.charAt(0)}</div>`
                }
            </div>
            <div class="user-cell user-name-cell">
                <div class="user-name">${user.username}</div>
                <div class="user-email">${user.email || 'не указан'}</div>
            </div>
            <div class="user-cell user-role-cell ${roleClass}">
                ${roleText}
            </div>
            <div class="user-cell user-status-cell ${statusClass}">
                ${getStatusText(user.status || 'offline')}
            </div>
            <div class="user-cell user-actions-cell">
                <button class="user-action-button edit-btn" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="user-action-button ${user.is_admin ? 'demote-btn' : 'promote-btn'}" title="${user.is_admin ? 'Понизить' : 'Повысить'}">
                    <i class="fas ${user.is_admin ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </button>
                <button class="user-action-button ban-btn" title="Заблокировать">
                    <i class="fas fa-ban"></i>
                </button>
            </div>
        `;
        
        usersList.appendChild(userElement);
        
        // Добавляем обработчики действий
        initUserActions(userElement, user);
    });
}

// Инициализация действий для пользователя
function initUserActions(userElement, userData) {
    const editBtn = userElement.querySelector('.edit-btn');
    const promoteBtn = userElement.querySelector('.promote-btn, .demote-btn');
    const banBtn = userElement.querySelector('.ban-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showUserEditModal(userData);
        });
    }
    
    if (promoteBtn) {
        promoteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleAdminStatus(userData);
        });
    }
    
    if (banBtn) {
        banBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmBanUser(userData);
        });
    }
}

// Переключение статуса администратора
async function toggleAdminStatus(user) {
    if (!window.supabaseUtils.supabase) return;
    
    try {
        const newAdminStatus = !user.is_admin;
        const { error } = await window.supabaseUtils.supabase
            .from('users')
            .update({ is_admin: newAdminStatus })
            .eq('id', user.id);
            
        if (error) throw error;
        
        showNotification(`Пользователь ${user.username} ${newAdminStatus ? 'стал администратором' : 'лишен прав администратора'}`, 'success');
        loadAdminUsers();
    } catch (error) {
        console.error('❌ Ошибка изменения прав администратора:', error);
        showNotification('Ошибка изменения прав', 'error');
    }
}

// Подтверждение блокировки пользователя
function confirmBanUser(user) {
    if (!confirm(`Вы уверены, что хотите заблокировать пользователя ${user.username}?`)) {
        return;
    }
    
    banUser(user);
}

// Блокировка пользователя
async function banUser(user) {
    if (!window.supabaseUtils.supabase) return;
    
    try {
        const { error } = await window.supabaseUtils.supabase
            .from('users')
            .update({ 
                status: 'banned',
                banned_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
        if (error) throw error;
        
        showNotification(`Пользователь ${user.username} успешно заблокирован`, 'success');
        loadAdminUsers();
    } catch (error) {
        console.error('❌ Ошибка блокировки пользователя:', error);
        showNotification('Ошибка блокировки пользователя', 'error');
    }
}

// Загрузка статистики пользователей
async function updateUsersStats(totalCount) {
    if (typeof totalCount === 'undefined') {
        try {
            const { count, error } = await window.supabaseUtils.supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
                
            if (error) throw error;
            totalCount = count;
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
            totalCount = 0;
        }
    }
    
    // Обновляем отображение
    document.getElementById('total-users').textContent = totalCount || 0;
    document.getElementById('online-users').textContent = '0'; // Заглушка
    document.getElementById('new-users').textContent = '0'; // Заглушка
}

// Инициализация графиков
function initAdminCharts() {
    const ctx = document.getElementById('user-activity-chart');
    if (!ctx) return;
    
    // Удаляем предыдущий график если он существует
    if (window.userActivityChart) {
        window.userActivityChart.destroy();
    }
    
    // Данные для графика (временно)
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 7; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
        data.push(Math.floor(Math.random() * 30) + 10);
    }
    
    window.userActivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Новые пользователи',
                data: data,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ccc'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Загрузка команды для админки
async function loadTeamMembersForAdmin() {
    const select = document.getElementById('team-member-select');
    if (!select) return;
    
    try {
        const members = await window.supabaseUtils.loadTeamMembers();
        
        select.innerHTML = '<option value="">-- Выберите пользователя --</option>';
        
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.name} (${member.role})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки команды для админки:', error);
        showNotification('Ошибка загрузки команды', 'error');
    }
}

// Вспомогательные функции
function getStatusClass(status) {
    const classes = {
        'online': 'status-online',
        'busy': 'status-busy',
        'away': 'status-away',
        'offline': 'status-offline',
        'banned': 'status-banned'
    };
    return classes[status] || 'status-offline';
}

function getStatusText(status) {
    const texts = {
        'online': 'ОНЛАЙН',
        'busy': 'ЗАНЯТ',
        'away': 'ОТСУТСТВУЕТ',
        'offline': 'ОФФЛАЙН',
        'banned': 'ЗАБЛОКИРОВАН'
    };
    return texts[status] || 'ОФФЛАЙН';
}

// Экспорт функций
window.adminPanel = {
    initAdminPanel,
    loadAdminUsers,
    initAdminCharts
};

// Автоинициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Ждем инициализации Supabase
    setTimeout(() => {
        if (window.supabaseUtils && window.supabaseUtils.initSupabase) {
            window.supabaseUtils.initSupabase().then(() => {
                initAdminPanel();
            });
        }
    }, 500);
});