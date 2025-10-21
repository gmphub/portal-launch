// Advanced Functionality (e.g., form handling, modals, tooltips, charts)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all advanced functionalities
    initFormHandlers();
    initModals();
    initTooltips();
    initCharts();
    initTabNavigation();
    initSettingsSave();
    initLessonNavigation();
});

function initFormHandlers() {
    // Example: Intercept form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Formulário enviado! (Funcionalidade de backend necessária para salvar dados)');
            // In a real application, you would send data to a backend API here
        });
    });
}

function initModals() {
    // Example: Simple modal functionality
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modal = document.querySelector(this.dataset.modalTarget);
            if (modal) {
                modal.style.display = 'block';
            }
        });
    });
    const closeButtons = document.querySelectorAll('.modal .close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function initTooltips() {
    // Example: Simple tooltip functionality
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseover', function() {
            const tooltipText = this.dataset.tooltip;
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'tooltip-box';
            tooltipDiv.textContent = tooltipText;
            document.body.appendChild(tooltipDiv);
            const rect = this.getBoundingClientRect();
            tooltipDiv.style.left = rect.left + (rect.width / 2) - (tooltipDiv.offsetWidth / 2) + 'px';
            tooltipDiv.style.top = rect.top - tooltipDiv.offsetHeight - 5 + 'px';
        });
        tooltip.addEventListener('mouseout', function() {
            const tooltipDiv = document.querySelector('.tooltip-box');
            if (tooltipDiv) {
                tooltipDiv.remove();
            }
        });
    });
}

function initCharts() {
    // Placeholder for chart initialization (e.g., using Chart.js or D3.js)
    // This would typically involve fetching data and rendering charts.
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartId = container.id;
        if (chartId) {
            // console.log(`Initializing chart for ${chartId}`);
            // Example: new Chart(document.getElementById(chartId), config);
        }
    });
}

function initTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // In a real application, you would load content dynamically here
            // For now, we just change the active state
        });
    });
}

function initSettingsSave() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('siteName').value;
            const email = document.getElementById('adminEmail').value;
            const theme = document.querySelector('input[name="themePreference"]:checked').value;
            localStorage.setItem('siteName', name);
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('themePreference', theme);
            alert('Configurações salvas com sucesso!');
            // Optionally, update theme immediately if it's not handled by main.js
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        });
        // Load saved settings on page load
        document.addEventListener('DOMContentLoaded', function() {
            const savedSiteName = localStorage.getItem('siteName');
            const savedAdminEmail = localStorage.getItem('adminEmail');
            const savedThemePreference = localStorage.getItem('themePreference');
            if (savedSiteName) {
                document.getElementById('siteName').value = savedSiteName;
            }
            if (savedAdminEmail) {
                document.getElementById('adminEmail').value = savedAdminEmail;
            }
            if (savedThemePreference) {
                document.querySelector(`input[name="themePreference"][value="${savedThemePreference}"]`).checked = true;
            }
        });
    }
    const studentSettingsForm = document.getElementById('studentSettingsForm');
    if (studentSettingsForm) {
        studentSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const studentName = document.getElementById('studentName').value;
            const studentEmail = document.getElementById('studentEmail').value;
            localStorage.setItem('studentName', studentName);
            localStorage.setItem('studentEmail', studentEmail);
            alert('Configurações do aluno salvas com sucesso!');
        });
        document.addEventListener('DOMContentLoaded', function() {
            const savedStudentName = localStorage.getItem('studentName');
            const savedStudentEmail = localStorage.getItem('studentEmail');
            if (savedStudentName) {
                document.getElementById('studentName').value = savedStudentName;
            }
            if (savedStudentEmail) {
                document.getElementById('studentEmail').value = savedStudentEmail;
            }
        });
    }
}

function initLessonNavigation() {
    const prevLessonBtn = document.getElementById('prevLessonBtn');
    const nextLessonBtn = document.getElementById('nextLessonBtn');
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonVideo = document.getElementById('lessonVideo');
    const lessonDescription = document.getElementById('lessonDescription');
    const lessons = [
        {
            title: 'Lesson 1: Introduction to English',
            videoUrl: 'https://www.youtube.com/embed/t_d_j_X_X_X', // Replace with actual video URL
            description: 'This lesson introduces basic English greetings and common phrases.'
        },
        {
            title: 'Lesson 2: The Alphabet and Pronunciation',
            videoUrl: 'https://www.youtube.com/embed/y_d_j_X_X_X', // Replace with actual video URL
            description: 'Learn the English alphabet and practice correct pronunciation.'
        },
        {
            title: 'Lesson 3: Basic Grammar - Verbs',
            videoUrl: 'https://www.youtube.com/embed/z_d_j_X_X_X', // Replace with actual video URL
            description: 'Understand the basics of English verbs and their usage.'
        }
    ];
    let currentLessonIndex = 0;
    function loadLesson(index) {
        if (index >= 0 && index < lessons.length) {
            currentLessonIndex = index;
            const lesson = lessons[currentLessonIndex];
            if (lessonTitle) lessonTitle.textContent = lesson.title;
            if (lessonVideo) lessonVideo.src = lesson.videoUrl;
            if (lessonDescription) lessonDescription.textContent = lesson.description;
            if (prevLessonBtn) prevLessonBtn.disabled = (currentLessonIndex === 0);
            if (nextLessonBtn) nextLessonBtn.disabled = (currentLessonIndex === lessons.length - 1);
        }
    }
    if (prevLessonBtn) {
        prevLessonBtn.addEventListener('click', function() {
            loadLesson(currentLessonIndex - 1);
        });
    }
    if (nextLessonBtn) {
        nextLessonBtn.addEventListener('click', function() {
            loadLesson(currentLessonIndex + 1);
        });
    }
    // Load the first lesson on page load
    if (lessonTitle && lessonVideo && lessonDescription) {
        loadLesson(currentLessonIndex);
    }
}