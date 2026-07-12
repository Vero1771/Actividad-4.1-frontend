(function() {
    'use strict';

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    const tabs = document.querySelectorAll('.tab');
    const themeToggle = document.getElementById('themeToggle');
    const fontSelect = document.getElementById('fontSelect');
    
    let currentTab = 'definiciones';
    let currentData = null;
    let currentWord = '';
    let currentTheme = 'auto';

    // === TEMA ===
    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '🌙 Oscuro';
        } else if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '☀️ Claro';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '🌓 Auto';
        }
        localStorage.setItem('dictionary-theme', theme);
    }

    function toggleTheme() {
        if (currentTheme === 'auto') applyTheme('light');
        else if (currentTheme === 'light') applyTheme('dark');
        else applyTheme('auto');
    }

    function loadTheme() {
        var saved = localStorage.getItem('dictionary-theme');
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
            applyTheme(saved);
        } else {
            applyTheme('auto');
        }
    }

    // === FUENTE ===
    function applyFont(fontClass) {
        document.body.className = document.body.className
            .split(' ')
            .filter(function(cls) {
                return !cls.startsWith('font-');
            })
            .join(' ');
        
        if (fontClass && fontClass !== 'font-1') {
            document.body.classList.add(fontClass);
        }
        localStorage.setItem('dictionary-font', fontClass);
    }

    function loadFont() {
        var saved = localStorage.getItem('dictionary-font');
        if (saved) {
            fontSelect.value = saved;
            applyFont(saved);
        } else {
            fontSelect.value = 'font-1';
            applyFont('font-1');
        }
    }

    // === RENDER ===
    function showLoading() {
        resultContainer.innerHTML = '<p>Cargando...</p>';
    }

    function showError(message) {
        resultContainer.innerHTML = '<p>❌ Error: ' + message + '</p>';
    }

    function showEmptyState() {
        resultContainer.innerHTML = '<p>Escribe una palabra para buscar su definición</p>';
    }

    function getAudioUrl(phonetics) {
        if (!phonetics || !Array.isArray(phonetics)) return null;
        for (var i = 0; i < phonetics.length; i++) {
            if (phonetics[i].audio) {
                return phonetics[i].audio;
            }
        }
        return null;
    }

    function renderDefinitions(entry) {
        const meanings = entry.meanings || [];
        const audioUrl = getAudioUrl(entry.phonetics);
        
        let html = '<h2>' + currentWord + '</h2>';
        
        if (entry.phonetic) {
            html += '<p>Pronunciación: ' + entry.phonetic;
            if (audioUrl) {
                html += ' <button class="audio-btn" data-audio="' + audioUrl + '">🔊</button>';
            }
            html += '</p>';
        }
        
        meanings.forEach(function(m) {
            html += '<h3>' + (m.partOfSpeech || '') + '</h3>';
            html += '<ul>';
            (m.definitions || []).forEach(function(d) {
                html += '<li>' + d.definition;
                if (d.example) {
                    html += ' <span class="example">— "' + d.example + '"</span>';
                }
                html += '</li>';
            });
            html += '</ul>';
        });
        
        resultContainer.innerHTML = html;

        document.querySelectorAll('.audio-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var audio = new Audio(this.dataset.audio);
                audio.play().catch(function(err) {
                    console.warn('Error al reproducir audio:', err);
                });
            });
        });
    }

    function renderSynonyms(entry) {
        const meanings = entry.meanings || [];
        let allSynonyms = [];
        
        meanings.forEach(function(m) {
            if (m.synonyms && m.synonyms.length > 0) {
                allSynonyms = allSynonyms.concat(m.synonyms);
            }
        });

        let html = '<h2>Sinónimos de "' + currentWord + '"</h2>';
        
        if (allSynonyms.length === 0) {
            html += '<p>No se encontraron sinónimos</p>';
        } else {
            html += '<ul>';
            allSynonyms.forEach(function(s) {
                html += '<li>' + s + '</li>';
            });
            html += '</ul>';
        }
        
        resultContainer.innerHTML = html;
    }

    function renderExamples(entry) {
        const meanings = entry.meanings || [];
        let allExamples = [];
        
        meanings.forEach(function(m) {
            (m.definitions || []).forEach(function(d) {
                if (d.example) {
                    allExamples.push({
                        example: d.example,
                        partOfSpeech: m.partOfSpeech || 'noun'
                    });
                }
            });
        });

        let html = '<h2>Ejemplos de "' + currentWord + '"</h2>';
        
        if (allExamples.length === 0) {
            html += '<p>No se encontraron ejemplos</p>';
        } else {
            html += '<ul>';
            allExamples.forEach(function(e) {
                html += '<li><strong>' + e.partOfSpeech + ':</strong> "' + e.example + '"</li>';
            });
            html += '</ul>';
        }
        
        resultContainer.innerHTML = html;
    }

    function renderContent() {
        if (!currentData || !currentWord) {
            showEmptyState();
            return;
        }

        const entry = currentData[0];
        
        if (currentTab === 'definiciones') {
            renderDefinitions(entry);
        } else if (currentTab === 'sinonimos') {
            renderSynonyms(entry);
        } else if (currentTab === 'ejemplos') {
            renderExamples(entry);
        }
    }

    // === API ===
    function fetchWord(word) {
        if (!word || word.trim() === '') {
            showEmptyState();
            return;
        }

        const trimmed = word.trim().toLowerCase();
        currentWord = trimmed;
        localStorage.setItem('last-word', trimmed);
        showLoading();

        const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(trimmed);

        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Palabra no encontrada');
                }
                return response.json();
            })
            .then(function(data) {
                currentData = data;
                renderContent();
            })
            .catch(function(error) {
                showError(error.message);
            });
    }

    function handleSearch() {
        const word = searchInput.value.trim();
        fetchWord(word);
    }

    // === INICIALIZACIÓN ===
    // Tema
    loadTheme();
    themeToggle.addEventListener('click', toggleTheme);

    // Fuente
    loadFont();
    fontSelect.addEventListener('change', function() {
        applyFont(this.value);
    });

    // Búsqueda
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Pestañas
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            currentTab = this.dataset.tab;
            renderContent();
        });
    });

    // Cargar última palabra
    var savedWord = localStorage.getItem('last-word');
    if (savedWord) {
        searchInput.value = savedWord;
        setTimeout(function() {
            handleSearch();
        }, 300);
    }

})();