// Данные команды (временно, пока нет интеграции с Supabase)
const teamMembersData = [
    {
        id: 1,
        name: 'ReFinek',
        role: 'Главный Разработчик',
        role_key: 'lead_dev',
        description: 'Создает весь визуал в играх, от общего дизайна помещений до микропылинок в игре, текстуры; 3D модели; концепты; анимации; композиция и расстановка в самом движке - всем этим занимается он, также создает лор.',
        avatar: 'RF.png',
        status: 'online',
        achievements: ['founder', 'artist', 'writer'],
        socials: {
            discord: 'ReFinek#1234',
            github: 'refinek'
        }
    },
    {
        id: 2,
        name: 'SummitBadeline',
        role: 'Главный Кодер',
        role_key: 'lead_coder',
        description: 'Пишет 90% кода для игр, разнообразные механики, ии противников, и вся функциональная часть будет возможна благодаря нему.',
        avatar: 'SB.png',
        status: 'busy',
        achievements: ['coder', 'ai_expert'],
        socials: {
            github: 'summitbadeline'
        }
    },
    {
        id: 3,
        name: 'HumidGolf',
        role: 'Спонсор',
        role_key: 'sponsor',
        description: 'Покупает нам сухарики и прочие различные вкусняхи, без него игра бы просто не вышла 💀 а также помогает создавать лор.',
        avatar: 'hg.png',
        status: 'online',
        achievements: ['sponsor', 'lore_master'],
        socials: {
            discord: 'HumidGolf#5678'
        }
    },
    {
        id: 4,
        name: 'Piter',
        role: 'Кодерок',
        role_key: 'coder',
        description: 'мы заставим делать его механику ломания досок топором',
        avatar: 'vova.png',
        status: 'away',
        achievements: ['junior_dev'],
        socials: {
            github: 'pitercoder'
        }
    }
];

// Загрузка данных команды
async function loadTeamData() {
    try {
        // Пытаемся загрузить из Supabase
        if (window.supabaseUtils && window.supabaseUtils.supabase) {
            const members = await window.supabaseUtils.loadTeamMembers();
            if (members && members.length > 0) {
                console.log('✅ Команда загружена из Supabase:', members);
                return members;
            }
        }
        
        console.log('ℹ️ Используем локальные данные команды');
        return teamMembersData;
    } catch (error) {
        console.error('❌ Ошибка загрузки команды:', error);
        showNotification('Ошибка загрузки данных команды', 'error');
        return teamMembersData;
    }
}

// Рендеринг карточек команды
function renderTeamMembers(members) {
    const container = document.getElementById('team-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    members.forEach((member, index) => {
        // Определяем роль для CSS классов
        let roleClass = '';
        switch(member.role_key) {
            case 'lead_dev':
                roleClass = 'role-lead-dev';
                break;
            case 'lead_coder':
                roleClass = 'role-lead-coder';
                break;
            case 'sponsor':
                roleClass = 'role-sponsor';
                break;
            case 'coder':
                roleClass = 'role-coder';
                break;
            default:
                roleClass = 'role-member';
        }
        
        const memberElement = document.createElement('div');
        memberElement.className = `team-member ${roleClass}`;
        memberElement.dataset.id = member.id;
        memberElement.innerHTML = `
            <div class="member-avatar">
                <img src="${member.avatar || 'default-avatar.png'}" alt="${member.name}" onerror="this.parentElement.innerHTML='<div class=\"member-avatar-placeholder\">${member.name.charAt(0)}</div>'">
                <div class="member-badge">${getRoleBadgeText(member.role_key)}</div>
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role}</div>
                <div class="member-status status-${member.status}">${getStatusText(member.status)}</div>
                <div class="member-description">${member.description}</div>
                <div class="member-achievements">
                    ${renderAchievements(member.achievements)}
                </div>
                <div class="member-socials">
                    ${renderSocials(member.socials)}
                </div>
            </div>
        `;
        
        container.appendChild(memberElement);
        
        // Добавляем обработчик клика с задержкой для анимации
        setTimeout(() => {
            memberElement.addEventListener('click', () => toggleMemberDetails(memberElement));
        }, 100 * index);
    });
}

// Переключение деталей участника
function toggleMemberDetails(memberElement) {
    const isActive = memberElement.classList.contains('active');
    
    // Сначала скрываем все другие активные карточки
    document.querySelectorAll('.team-member').forEach(el => {
        if (el !== memberElement) {
            el.classList.remove('active');
        }
    });
    
    // Переключаем текущую карточку
    if (!isActive) {
        memberElement.classList.add('active');
        
        // Скроллим к карточке если она не в зоне видимости
        const rect = memberElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < 0 || rect.bottom > windowHeight) {
            memberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        memberElement.classList.remove('active');
    }
}

// Получение текста для бейджа роли
function getRoleBadgeText(roleKey) {
    const badges = {
        'lead_dev': '👑 ОСНОВАТЕЛЬ',
        'lead_coder': '⚡ ГЛАВНЫЙ',
        'sponsor': '💖 СПОНСОР',
        'coder': '🛠️ РАЗРАБ',
        'designer': '🎨 ДИЗАЙНЕР',
        'tester': '🔍 ТЕСТЕР'
    };
    return badges[roleKey] || 'УЧАСТНИК';
}

// Получение текста статуса
function getStatusText(status) {
    const statuses = {
        'online': 'ОНЛАЙН',
        'busy': 'ЗАНЯТ',
        'away': 'ОТСУТСТВУЕТ',
        'offline': 'ОФФЛАЙН'
    };
    return statuses[status] || 'ОНЛАЙН';
}

// Рендеринг достижений
function renderAchievements(achievements = []) {
    if (!achievements || achievements.length === 0) return '';
    
    const achievementIcons = {
        'founder': { icon: '👑', tooltip: 'Основатель студии' },
        'artist': { icon: '🎨', tooltip: 'Главный художник' },
        'writer': { icon: '📝', tooltip: 'Автор лора' },
        'coder': { icon: '💻', tooltip: 'Эксперт по коду' },
        'ai_expert': { icon: '🤖', tooltip: 'Специалист по ИИ' },
        'sponsor': { icon: '💰', tooltip: 'Спонсор проекта' },
        'lore_master': { icon: '📖', tooltip: 'Мастер по лору' },
        'junior_dev': { icon: '🎓', tooltip: 'Младший разработчик' }
    };
    
    return achievements.map(achievement => {
        const data = achievementIcons[achievement] || { icon: '⭐', tooltip: achievement };
        return `
            <div class="achievement-badge" data-tooltip="${data.tooltip}">
                ${data.icon}
            </div>
        `;
    }).join('');
}

// Рендеринг социальных ссылок
function renderSocials(socials = {}) {
    if (!socials) return '';
    
    let html = '';
    
    if (socials.discord) {
        html += `<a href="#" class="social-icon" title="Discord: ${socials.discord}"><i class="fab fa-discord"></i></a>`;
    }
    
    if (socials.github) {
        html += `<a href="https://github.com/${socials.github}" target="_blank" class="social-icon" title="GitHub: ${socials.github}"><i class="fab fa-github"></i></a>`;
    }
    
    if (socials.telegram) {
        html += `<a href="https://t.me/${socials.telegram}" target="_blank" class="social-icon" title="Telegram: ${socials.telegram}"><i class="fab fa-telegram"></i></a>`;
    }
    
    return html;
}

// Инициализация взаимодействий команды
async function initTeamInteractions() {
    console.log('🔧 Инициализация взаимодействий команды...');
    
    try {
        const members = await loadTeamData();
        renderTeamMembers(members);
        console.log('✅ Взаимодействия команды инициализированы');
    } catch (error) {
        console.error('❌ Ошибка инициализации команды:', error);
        showNotification('Ошибка загрузки команды', 'error');
    }
}

// Экспорт функций
window.teamInteractions = {
    initTeamInteractions,
    renderTeamMembers,
    toggleMemberDetails
};

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('team-container')) {
        initTeamInteractions();
    }
});