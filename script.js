const isAuthorsPage = window.location.pathname.includes('authors.html');
const list = document.getElementById('list');
const search = document.getElementById('search');
const sort = document.getElementById('sort');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Элементы тем (на странице авторов их может не быть)
const openThemes = document.getElementById('openThemes');
const closeThemes = document.getElementById('closeThemes');
const themesModal = document.getElementById('themesModal');
const themeSearch = document.getElementById('themeSearch');
const themesList = document.getElementById('themesList');

let activeTheme = null;
let activeAuthor = null;

// ===== ИЗБРАННОЕ =====
let showFavorites = false;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(title) {
    return favorites.includes(title);
}

function toggleFavorite(title) {
    if (isFavorite(title)) {
        favorites = favorites.filter(t => t !== title);
    } else {
        favorites.push(title);
    }
    saveFavorites();
    renderWorks();
}

// ===== ТЕМЫ (только для страниц с произведениями/стихами) =====
if (!isAuthorsPage && openThemes && themesModal) {
    function getAllThemes() {
        const set = new Set();
        works.forEach(w => (w.themes || []).forEach(t => set.add(t)));
        return Array.from(set).sort();
    }

    function renderThemesList(filter = '') {
        const q = filter.toLowerCase().trim();
        const themes = getAllThemes().filter(t => t.toLowerCase().includes(q));

        if (themes.length === 0) {
            themesList.innerHTML = '<div class="empty">Темы не найдены</div>';
            return;
        }

        themesList.innerHTML = themes.map(t => `
            <button class="theme-item ${activeTheme === t ? 'active' : ''}" data-theme="${t}">${t}</button>
        `).join('');

        themesList.querySelectorAll('.theme-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                activeTheme = (activeTheme === theme) ? null : theme;
                themesModal.style.display = 'none';
                renderWorks();
            });
        });
    }

    openThemes.addEventListener('click', () => {
        themesModal.style.display = 'block';
        renderThemesList('');
        themeSearch.value = '';
        themeSearch.focus();
    });

    closeThemes.addEventListener('click', () => {
        themesModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === themesModal) themesModal.style.display = 'none';
    });

    themeSearch.addEventListener('input', () => {
        renderThemesList(themeSearch.value);
    });
}

// ===== ОТРИСОВКА СПИСКА =====
function renderWorks() {
    // === ЛОГИКА ДЛЯ СТРАНИЦЫ АВТОРОВ ===
    if (isAuthorsPage) {
        const q = search.value.toLowerCase().trim();
        const authorList = (typeof authors !== 'undefined') ? authors : [];
        
        let filtered = authorList.filter(a => a.name.toLowerCase().includes(q));

        if (sort.value === 'az') filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        if (sort.value === 'za') filtered.sort((a, b) => b.name.localeCompare(a.name, 'ru'));

        const counter = document.getElementById('counter');
        if (counter) {
            counter.textContent = `Найдено авторов: ${filtered.length} из ${authorList.length}`;
        }

        if (filtered.length === 0) {
            list.innerHTML = '<div class="empty">Ничего не найдено</div>';
            return;
        }

        list.innerHTML = filtered.map(a => `
            <div class="work author-card" data-name="${a.name}">
                <h2>${a.name}</h2>
                <div class="author-years">${a.years}</div>
                <div class="tags">${(a.works || []).map(w => `<span>${w}</span>`).join('')}</div>
            </div>
        `).join('');

        list.querySelectorAll('.author-card').forEach(el => {
            el.addEventListener('click', () => {
                const name = el.dataset.name;
                const author = authorList.find(a => a.name === name);
                showAuthorModal(author);
            });
        });
        return;
    }

    // === ЛОГИКА ДЛЯ ПРОИЗВЕДЕНИЙ И СТИХОВ ===
    const q = search.value.toLowerCase().trim();
    const workList = (typeof works !== 'undefined') ? works : [];
    
    let filtered = workList.filter(w => {
        const themes = w.themes || [];
        const matchesSearch = (
            w.title.toLowerCase().includes(q) ||
            w.author.toLowerCase().includes(q) ||
            themes.some(t => t.toLowerCase().includes(q))
        );
        const matchesTheme = !activeTheme || themes.includes(activeTheme);
        const matchesAuthor = !activeAuthor || w.author === activeAuthor;
        return matchesSearch && matchesTheme && matchesAuthor;
    });

    // Фильтр по избранному
    if (showFavorites) {
        filtered = filtered.filter(w => isFavorite(w.title));
    }

    if (sort.value === 'az') filtered.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    if (sort.value === 'za') filtered.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
    if (sort.value === 'author_az') filtered.sort((a, b) => a.author.localeCompare(b.author, 'ru'));
    if (sort.value === 'author_za') filtered.sort((a, b) => b.author.localeCompare(a.author, 'ru'));

    const authorFilter = document.getElementById('authorFilter');
    const authorName = document.getElementById('authorName');
    if (authorFilter && authorName) {
        if (activeAuthor) {
            authorFilter.style.display = 'flex';
            authorName.textContent = 'Автор: ' + activeAuthor;
        } else {
            authorFilter.style.display = 'none';
        }
    }

    const counter = document.getElementById('counter');
    if (counter) {
        counter.textContent = `Найдено: ${filtered.length} из ${workList.length}`;
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty">Ничего не найдено</div>';
        return;
    }

    list.innerHTML = filtered.map(w => `
        <div class="work" data-title="${w.title}">
            <button class="fav-btn ${isFavorite(w.title) ? 'active' : ''}" data-fav="${w.title}" title="В избранное">${isFavorite(w.title) ? '★' : '☆'}</button>
            <h2>${w.title}</h2>
            <div class="author">
                <span class="author-link" data-author="${w.author}">${w.author}</span>
            </div>
            <div class="tags">${(w.themes || []).map(t => `<span>${t}</span>`).join('')}</div>
        </div>
    `).join('');

    // Обработчик звёздочек
    list.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn.dataset.fav);
        });
    });

    list.querySelectorAll('.work').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('author-link')) return;
            if (e.target.classList.contains('fav-btn')) return;
            const title = el.dataset.title;
            const work = workList.find(w => w.title === title);
            showModal(work);
        });
    });

    list.querySelectorAll('.author-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const author = el.dataset.author;
            activeAuthor = (activeAuthor === author) ? null : author;
            renderWorks();
        });
    });
}

// ===== МОДАЛКА ПРОИЗВЕДЕНИЯ =====
function showModal(work) {
    if (work.genre === "Стихотворение" || work.about) {
        modalBody.innerHTML = `
            <h2>${work.title}</h2>
            <p><b>Автор:</b> ${work.author}</p>
            <p><b>Год:</b> ${work.year}</p>
            <p><b>Жанр:</b> ${work.genre}</p>

            <h3>О чём стихотворение?</h3>
            <p>${work.about}</p>

            <h3>Идея (главная мысль)</h3>
            <p>${work.idea}</p>

            <h3>Лирический герой</h3>
            <p>${work.hero}</p>

            <h3>Настроение</h3>
            <p>${work.mood}</p>

            <h3>Композиция</h3>
            <p>${work.composition}</p>

            <h3>Символы и образы</h3>
            <p>${work.symbols}</p>

            <h3>Авторская позиция</h3>
            <p>${work.authorPosition}</p>
        `;
        modal.style.display = 'block';
        modalBody.scrollTop = 0;
        return;
    }

    modalBody.innerHTML = `
        <h2>${work.title}</h2>
        <p><b>Автор:</b> ${work.author}</p>
        <p><b>Год:</b> ${work.year}</p>
        <p><b>Жанр:</b> ${work.genre}</p>
        <p><b>Эпиграф:</b> ${work.epigraph}</p>

        <h3>История создания</h3>
        <p>${work.history}</p>

        ${work.simple ? `<h3>Простыми словами — о чём это</h3><p>${work.simple}</p>` : ''}

        <h3>Темы для итогового сочинения</h3>
        ${(work.themeTable || []).map(row => `
            <p><b>${row.theme}.</b> ${row.proof}. <i>Аргумент:</i> ${row.argument}.</p>
        `).join('')}

        <h3>Проблематика</h3>
        <ul>${(work.problems || []).map(p => `<li>${p}</li>`).join('')}</ul>

        <h3>Авторская позиция</h3>
        <p>${work.authorPosition}</p>

        <h3>Герои</h3>
        <ul>${(work.heroes || []).map(h => `<li>${h}</li>`).join('')}</ul>

        <h3>Символика</h3>
        <ul>${(work.symbols || []).map(s => `<li>${s}</li>`).join('')}</ul>

        <h3>Сюжет и композиция</h3>
        <p>${work.plot || ''}</p>
        <p>${work.composition || ''}</p>

        <h3>Итог</h3>
        <p>${work.итог || ''}</p>
    `;
    modal.style.display = 'block';
    modalBody.scrollTop = 0;
}

// ===== МОДАЛКА АВТОРА =====
function showAuthorModal(author) {
    modalBody.innerHTML = `
        <h2>${author.name}</h2>
        <p><b>Годы жизни:</b> ${author.years}</p>
        
        <h3>Биография</h3>
        <p style="line-height: 1.7;">${author.bio}</p>
        
        <h3>Ключевые произведения</h3>
        <ul>${(author.works || []).map(w => `<li>${w}</li>`).join('')}</ul>
    `;
    modal.style.display = 'block';
    modalBody.scrollTop = 0;
}

// ===== ЗАКРЫТИЕ МОДАЛОК =====
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// ===== ОБРАБОТЧИКИ =====
search.addEventListener('input', renderWorks);
sort.addEventListener('change', renderWorks);

const clearAuthorBtn = document.getElementById('clearAuthor');
if (clearAuthorBtn) {
    clearAuthorBtn.addEventListener('click', () => {
        activeAuthor = null;
        renderWorks();
    });
}

// ===== КНОПКА "ИЗБРАННОЕ" =====
const toggleFavoritesBtn = document.getElementById('toggleFavorites');
if (toggleFavoritesBtn) {
    toggleFavoritesBtn.addEventListener('click', () => {
        showFavorites = !showFavorites;
        toggleFavoritesBtn.classList.toggle('active', showFavorites);
        renderWorks();
    });
}

// ===== КНОПКА "НАВЕРХ" =====
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== СТАРТ =====
renderWorks();