// Система уведомлений
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Иконка в зависимости от типа
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
            <div class="notification-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Добавляем в контейнер
    container.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        hideNotification(notification);
    }, duration);
    
    // Обработчик закрытия
    notification.querySelector('.notification-close').addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Эффекты загрузки
function showLoader(message = 'Загрузка...', progress = 0) {
    const loader = document.querySelector('.loader-overlay');
    const status = document.querySelector('.loader-status');
    const progressBar = document.querySelector('.progress-bar');
    
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.add('show');
    }
    
    if (status) {
        status.textContent = message;
    }
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function hideLoader() {
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        loader.classList.remove('show');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// Эффект TV помех на Canvas
function initTVStatic() {
    const canvas = document.querySelector('.tv-static-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function generateStatic() {
        if (!ctx) return;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Создаем данные для шума
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        // Генерируем шум
        for (let i = 0; i < data.length; i += 4) {
            const rand = Math.random();
            
            // Более интенсивный шум в центре экрана
            const centerX = width / 2;
            const centerY = height / 2;
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
            const intensity = 1 - (distance / maxDistance) * 0.5;
            
            const value = rand > 0.5 ? 255 : 0;
            const alpha = Math.random() * 20 * intensity;
            
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = alpha; // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Случайные вспышки
        if (Math.random() > 0.99) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            ctx.fillRect(0, 0, width, height);
        }
        
        animationFrame = requestAnimationFrame(generateStatic);
    }
    
    // Инициализация
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    generateStatic();
    
    return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resizeCanvas);
    };
}

// Эффект мерцания текста (CRT)
function initTextFlicker() {
    const flickerElements = document.querySelectorAll('.glitch, .main-title, .section-title, .stat-number');
    
    flickerElements.forEach(element => {
        // Случайное мерцание
        setInterval(() => {
            if (Math.random() > 0.95) {
                element.style.opacity = '0.8';
                setTimeout(() => {
                    element.style.opacity = '1';
                }, 100);
            }
        }, 1000);
    });
}

// Эффект анимации счетчиков
function initCountAnimations() {
    const countElements = document.querySelectorAll('.glitch-count');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseInt(element.dataset.target);
                let count = 0;
                const duration = 2000; // ms
                const stepTime = 20; // ms
                const steps = duration / stepTime;
                const increment = target / steps;
                
                const counter = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        count = target;
                        clearInterval(counter);
                    }
                    element.textContent = Math.floor(count);
                }, stepTime);
                
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });
    
    countElements.forEach(element => {
        observer.observe(element);
    });
}

// Эффект появления при скролле
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.team-member, .achievement-card, .stat-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Эффект CRT включения/выключения
function initScreenEffects() {
    // Эффект включения при загрузке
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.filter = 'brightness(1)';
    }, 500);
    
    // Эффект "дрожания" экрана при фокусе
    let screenShakeTimeout;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            clearTimeout(screenShakeTimeout);
            document.body.classList.add('screen-shake');
            screenShakeTimeout = setTimeout(() => {
                document.body.classList.remove('screen-shake');
            }, 300);
        }
    });
    
    // Добавляем класс для дрожания
    const style = document.createElement('style');
    style.textContent = `
        .screen-shake {
            animation: screen-shake 0.3s;
        }
        @keyframes screen-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-2px); }
            40%, 80% { transform: translateX(2px); }
        }
    `;
    document.head.appendChild(style);
}

// Инициализация всех эффектов
function initAllEffects() {
    // Показываем загрузчик
    showLoader('Инициализация системы...', 20);
    
    // Инициализация эффектов с задержками для плавности
    setTimeout(() => {
        initTVStatic();
        showLoader('Загрузка визуальных эффектов...', 40);
    }, 300);
    
    setTimeout(() => {
        initTextFlicker();
        initCountAnimations();
        initScrollAnimations();
        initScreenEffects();
        showLoader('Финальная настройка...', 80);
    }, 600);
    
    setTimeout(() => {
        hideLoader();
        // Эффект появления контента
        document.body.style.opacity = '0';
        document.body.style.filter = 'brightness(0.5)';
        document.body.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
            document.body.style.filter = 'brightness(1)';
        }, 100);
    }, 1000);
}

// Экспорт функций
window.uiEffects = {
    showNotification,
    showLoader,
    hideLoader,
    initAllEffects
};

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для плавной загрузки
    setTimeout(initAllEffects, 200);
});
