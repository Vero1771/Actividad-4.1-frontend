(function() {
    'use strict';

    // Variables de estado de la aplicacion
    let currentTheme = 'auto';
    let currentPage = 'definiciones';
    let currentWord = '';
    let currentData = null;
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 400;

    // Referencias a elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const pageContainer = document.getElementById('page-container');
    const themeToggle = document.getElementById('themeToggle');
    const fontSelect = document.getElementById('fontSelect');
    const logoLink = document.getElementById('logoLink');
    const helpBtn = document.getElementById('helpBtn');
    const navLinks = document.querySelectorAll('.main-nav a[data-page]');

    // Aplica el tema seleccionado (claro, oscuro o auto)
    function applyTheme(theme) {
        currentTheme = theme;
        if (!themeToggle) return;
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<span class="material-symbols-outlined icon-sm">dark_mode</span> Oscuro';
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<span class="material-symbols-outlined icon-sm">light_mode</span> Claro';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '<span class="material-symbols-outlined icon-sm">contrast</span> Auto';
        }
        localStorage.setItem('dictionary-theme', theme);
    }

    // Carga el tema guardado en localStorage o usa el predeterminado
    function loadTheme() {
        var saved = localStorage.getItem('dictionary-theme');
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
            applyTheme(saved);
        } else {
            applyTheme('auto');
        }
    }

    // Cambia entre los modos de tema: auto -> light -> dark -> auto
    function toggleTheme() {
        if (currentTheme === 'auto') {
            applyTheme('light');
        } else if (currentTheme === 'light') {
            applyTheme('dark');
        } else {
            applyTheme('auto');
        }
    }

    // Escucha cambios en la preferencia del sistema operativo
    function listenSystemTheme() {
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', function() {
            if (currentTheme === 'auto') {
                applyTheme('auto');
            }
        });
    }

    // Aplica la tipografia seleccionada
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

    // Carga la tipografia guardada en localStorage
    function loadFont() {
        var saved = localStorage.getItem('dictionary-font');
        if (!fontSelect) return;
        
        if (saved) {
            fontSelect.value = saved;
            applyFont(saved);
        } else {
            fontSelect.value = 'font-1';
            applyFont('font-1');
        }
    }

    // Cambia la pagina actual (definiciones, sinonimos, ejemplos)
    function switchPage(page) {
        currentPage = page;
        
        navLinks.forEach(function(link) {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        if (currentData && currentWord) {
            renderPageContent(page, currentData, currentWord);
        } else {
            var word = searchInput.value.trim();
            if (word) {
                fetchWord(word);
            } else {
                showEmptyState();
            }
        }
    }

    // Muestra el tutorial de ayuda en un modal
    function showHelp() {
        var existingOverlay = document.querySelector('.help-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
            return;
        }

        var overlay = document.createElement('div');
        overlay.className = 'help-overlay';
        
        overlay.innerHTML = `
            <div class="help-modal" role="dialog" aria-label="Tutorial de uso">
                <button class="help-close" id="helpCloseBtn" aria-label="Cerrar ayuda">
                    <span class="material-symbols-outlined">close</span>
                </button>
                
                <div class="help-header">
                    <div class="help-icon">
                        <span class="material-symbols-outlined">school</span>
                    </div>
                    <h2>Como usar WordWise</h2>
                    <p>Aprende a sacarle el maximo provecho a tu diccionario inteligente</p>
                </div>

                <div class="help-grid">
                    <div class="help-card">
                        <div class="step-number">1</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">search</span>
                        </div>
                        <h3>Busca una palabra</h3>
                        <p>Escribe cualquier palabra en ingles y presiona "Buscar" o Enter.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">search</span>
                                Buscar
                            </span>
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">keyboard_return</span>
                                Enter
                            </span>
                        </div>
                    </div>

                    <div class="help-card">
                        <div class="step-number">2</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">description</span>
                        </div>
                        <h3>Explora definiciones</h3>
                        <p>Encuentra el significado, categoria gramatical y ejemplos de uso.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">description</span>
                                Definiciones
                            </span>
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">volume_up</span>
                                Audio
                            </span>
                        </div>
                    </div>

                    <div class="help-card">
                        <div class="step-number">3</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">sync_alt</span>
                        </div>
                        <h3>Descubre sinonimos</h3>
                        <p>Amplia tu vocabulario con palabras de significado similar.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">sync_alt</span>
                                Sinonimos
                            </span>
                        </div>
                    </div>

                    <div class="help-card">
                        <div class="step-number">4</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">format_quote</span>
                        </div>
                        <h3>Ve ejemplos</h3>
                        <p>Aprende como se usa la palabra en frases reales y contextualizadas.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">format_quote</span>
                                Ejemplos
                            </span>
                        </div>
                    </div>

                    <div class="help-card">
                        <div class="step-number">5</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">tune</span>
                        </div>
                        <h3>Personaliza</h3>
                        <p>Cambia el tema (claro/oscuro) y la tipografia a tu gusto.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">palette</span>
                                Tema
                            </span>
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">text_fields</span>
                                Fuente
                            </span>
                        </div>
                    </div>

                    <div class="help-card">
                        <div class="step-number">6</div>
                        <div class="card-icon">
                            <span class="material-symbols-outlined">volume_up</span>
                        </div>
                        <h3>Escucha la pronunciacion</h3>
                        <p>Haz clic en el boton de audio para escuchar la pronunciacion correcta.</p>
                        <div class="icon-row">
                            <span class="icon-badge">
                                <span class="material-symbols-outlined">volume_up</span>
                                Escuchar
                            </span>
                        </div>
                    </div>
                </div>

                <div class="help-tips">
                    <h3>
                        <span class="material-symbols-outlined">lightbulb</span>
                        Palabras para practicar
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: 0.6rem; font-size: 0.9rem;">Prueba con estas palabras para ver como funciona WordWise:</p>
                    <div class="tip-grid">
                        <span class="tip-tag" data-word="hello">hello</span>
                        <span class="tip-tag" data-word="house">house</span>
                        <span class="tip-tag" data-word="dog">dog</span>
                        <span class="tip-tag" data-word="beautiful">beautiful</span>
                        <span class="tip-tag" data-word="book">book</span>
                        <span class="tip-tag" data-word="happy">happy</span>
                        <span class="tip-tag" data-word="computer">computer</span>
                        <span class="tip-tag" data-word="education">education</span>
                        <span class="tip-tag" data-word="science">science</span>
                        <span class="tip-tag" data-word="adventure">adventure</span>
                        <span class="tip-tag" data-word="knowledge">knowledge</span>
                        <span class="tip-tag" data-word="success">success</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        var closeBtn = document.getElementById('helpCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                overlay.remove();
            });
        }

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });

        overlay.querySelectorAll('.tip-tag').forEach(function(tag) {
            tag.addEventListener('click', function() {
                var word = this.dataset.word;
                searchInput.value = word;
                overlay.remove();
                handleSearch();
            });
        });
    }

    // Renderiza las definiciones de una palabra
    function renderDefinitions(entry, word) {
        var phoneticText = entry.phonetic || '';
        var audioUrl = getAudioUrl(entry.phonetics);
        var meanings = entry.meanings || [];
        var sourceUrl = entry.sourceUrls ? entry.sourceUrls[0] : 'https://dictionaryapi.dev/';

        var meaningsHtml = '';
        meanings.forEach(function(m) {
            var partOfSpeech = m.partOfSpeech || 'noun';
            var definitions = m.definitions || [];
            
            var defHtml = '';
            definitions.forEach(function(d, idx) {
                var definition = d.definition || '';
                var example = d.example ? '<div class="example">"' + d.example + '"</div>' : '';
                defHtml += '<div class="definition">' + (idx + 1) + '. ' + definition + '</div>' + example;
            });
            
            meaningsHtml += '<div class="meaning-item">';
            meaningsHtml += '<div class="part-of-speech">' + partOfSpeech + '</div>';
            meaningsHtml += defHtml;
            meaningsHtml += '</div>';
        });

        var audioButtonHtml = '';
        if (audioUrl) {
            audioButtonHtml = '<button class="audio-btn" id="playAudioBtn" aria-label="Reproducir pronunciacion" title="Escuchar pronunciacion">';
            audioButtonHtml += '<span class="material-symbols-outlined">volume_up</span>';
            audioButtonHtml += '</button>';
            audioButtonHtml += '<audio id="audioPlayer" class="hidden-audio" controls>';
            audioButtonHtml += '<source src="' + audioUrl + '" type="audio/mpeg">';
            audioButtonHtml += '<source src="' + audioUrl + '" type="audio/ogg">';
            audioButtonHtml += 'Tu navegador no soporta audio.';
            audioButtonHtml += '</audio>';
        } else {
            audioButtonHtml = '<span style="color: var(--text-secondary);">(sin audio disponible)</span>';
        }

        var html = '';
        html += '<div class="card">';
        html += '<div class="word-header">';
        html += '<span class="word-title">' + word + '</span>';
        html += '<div class="word-phonetic">';
        html += '<span>' + phoneticText + '</span>';
        html += audioButtonHtml;
        html += '</div>';
        html += '</div>';
        html += '<div class="meanings">' + meaningsHtml + '</div>';
        html += '<div class="source-link">';
        html += '<span class="material-symbols-outlined icon-sm" style="vertical-align: middle;">link</span>';
        html += ' Fuente: <a href="' + sourceUrl + '" target="_blank" rel="noopener noreferrer">' + sourceUrl + '</a>';
        html += '</div>';
        html += '</div>';

        pageContainer.innerHTML = html;

        var audioBtn = document.getElementById('playAudioBtn');
        var audioPlayer = document.getElementById('audioPlayer');
        if (audioBtn && audioPlayer) {
            audioBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (audioPlayer.paused) {
                    audioPlayer.play().catch(function(err) {
                        console.warn('Error al reproducir audio:', err);
                    });
                } else {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                }
            });
        }
    }

    // Renderiza los sinonimos de una palabra
    function renderSynonyms(entry, word) {
        var meanings = entry.meanings || [];
        var allSynonyms = [];
        
        meanings.forEach(function(m) {
            if (m.synonyms && m.synonyms.length > 0) {
                allSynonyms = allSynonyms.concat(m.synonyms);
            }
        });

        var html = '';
        html += '<div class="card">';
        
        if (allSynonyms.length === 0) {
            html += '<div class="empty-state">';
            html += '<span class="material-symbols-outlined icon">sync_alt</span>';
            html += '<h3>Sin sinonimos disponibles</h3>';
            html += '<p>No se encontraron sinonimos para "' + word + '"</p>';
            html += '</div>';
        } else {
            html += '<h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">';
            html += '<span class="material-symbols-outlined">sync_alt</span>';
            html += 'Sinonimos de "' + word + '"';
            html += '</h3>';
            html += '<div class="synonyms-list">';
            allSynonyms.forEach(function(s) {
                html += '<span>' + s + '</span>';
            });
            html += '</div>';
        }
        
        html += '</div>';
        pageContainer.innerHTML = html;
    }

    // Renderiza los ejemplos de una palabra
    function renderExamples(entry, word) {
        var meanings = entry.meanings || [];
        var allExamples = [];
        
        meanings.forEach(function(m) {
            var definitions = m.definitions || [];
            definitions.forEach(function(d) {
                if (d.example) {
                    allExamples.push({
                        example: d.example,
                        partOfSpeech: m.partOfSpeech || 'noun'
                    });
                }
            });
        });

        var html = '';
        html += '<div class="card">';
        
        if (allExamples.length === 0) {
            html += '<div class="empty-state">';
            html += '<span class="material-symbols-outlined icon">format_quote</span>';
            html += '<h3>Sin ejemplos disponibles</h3>';
            html += '<p>No se encontraron ejemplos de uso para "' + word + '"</p>';
            html += '</div>';
        } else {
            html += '<h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">';
            html += '<span class="material-symbols-outlined">format_quote</span>';
            html += 'Ejemplos de "' + word + '"';
            html += '</h3>';
            html += '<ul class="examples-list">';
            allExamples.forEach(function(e) {
                html += '<li>';
                html += '<span style="color: var(--accent); font-weight: 500;">' + e.partOfSpeech + ':</span>';
                html += ' "' + e.example + '"';
                html += '</li>';
            });
            html += '</ul>';
        }
        
        html += '</div>';
        pageContainer.innerHTML = html;
    }

    // Renderiza el contenido segun la pagina actual
    function renderPageContent(page, data, word) {
        var entry = data[0];
        
        switch(page) {
            case 'definiciones':
                renderDefinitions(entry, word);
                break;
            case 'sinonimos':
                renderSynonyms(entry, word);
                break;
            case 'ejemplos':
                renderExamples(entry, word);
                break;
            default:
                renderDefinitions(entry, word);
                break;
        }
    }

    // Muestra el estado inicial de la aplicacion
    function showEmptyState() {
        pageContainer.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <span class="material-symbols-outlined icon">search</span>
                    <h3>¿Que palabra deseas explorar?</h3>
                    <p>Escribe cualquier palabra en ingles para descubrir su significado</p>
                    <div class="suggestion-pills">
                        <span class="pill" data-word="hello">hello</span>
                        <span class="pill" data-word="house">house</span>
                        <span class="pill" data-word="dog">dog</span>
                        <span class="pill" data-word="beautiful">beautiful</span>
                        <span class="pill" data-word="book">book</span>
                        <span class="pill" data-word="happy">happy</span>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.pill').forEach(function(pill) {
            pill.addEventListener('click', function() {
                searchInput.value = this.dataset.word;
                handleSearch();
            });
        });
    }

    // Muestra el estado de carga
    function showLoading(word) {
        pageContainer.innerHTML = '';
        pageContainer.innerHTML += '<div class="card">';
        pageContainer.innerHTML += '<div class="empty-state">';
        pageContainer.innerHTML += '<span class="material-symbols-outlined icon" style="animation: pulse 1.5s ease-in-out infinite;">hourglass_top</span>';
        pageContainer.innerHTML += '<h3>Cargando...</h3>';
        pageContainer.innerHTML += '<p>Buscando "' + word + '"</p>';
        pageContainer.innerHTML += '</div>';
        pageContainer.innerHTML += '</div>';
    }

    // Muestra un mensaje de error
    function showError(message, word) {
        pageContainer.innerHTML = '';
        pageContainer.innerHTML += '<div class="card">';
        pageContainer.innerHTML += '<div class="empty-state">';
        pageContainer.innerHTML += '<span class="material-symbols-outlined icon">error</span>';
        pageContainer.innerHTML += '<h3>' + message + '</h3>';
        pageContainer.innerHTML += '<p>No encontramos "' + word + '". Prueba con otra palabra.</p>';
        pageContainer.innerHTML += '<p style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.7;">';
        pageContainer.innerHTML += 'Ejemplos: hello, house, dog, beautiful, book';
        pageContainer.innerHTML += '</p>';
        pageContainer.innerHTML += '</div>';
        pageContainer.innerHTML += '</div>';
    }

    // Obtiene la URL del audio desde los datos de fonetica
    function getAudioUrl(phonetics) {
        if (!phonetics || !Array.isArray(phonetics)) return null;
        for (var i = 0; i < phonetics.length; i++) {
            if (phonetics[i].audio) {
                var url = phonetics[i].audio;
                if (url.endsWith('.mp3')) return url;
            }
        }
        for (var j = 0; j < phonetics.length; j++) {
            if (phonetics[j].audio) return phonetics[j].audio;
        }
        return null;
    }

    // Realiza la consulta a la API de dictionaryapi.dev
    function fetchWord(word) {
        if (!word || word.trim() === '') {
            showEmptyState();
            return;
        }

        var trimmed = word.trim().toLowerCase();
        currentWord = trimmed;
        
        showLoading(trimmed);

        var url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(trimmed);

        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Palabra no encontrada');
                    }
                    throw new Error('Error HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('No se encontraron definiciones');
                }
                currentData = data;
                renderPageContent(currentPage, data, trimmed);
            })
            .catch(function(error) {
                showError(error.message, trimmed);
            });
    }

    // Maneja la busqueda con debounce
    function handleSearch() {
        var word = searchInput.value.trim();
        if (word === '') {
            showEmptyState();
            return;
        }
        
        localStorage.setItem('last-word', word);
        fetchWord(word);
    }

    // Inicializa el buscador con los eventos
    function initSearch() {
        if (!searchInput || !searchBtn) return;
        
        var savedWord = localStorage.getItem('last-word');
        if (savedWord) {
            searchInput.value = savedWord;
        }
        
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            var word = this.value.trim();
            if (word === '') {
                showEmptyState();
                return;
            }
            debounceTimer = setTimeout(function() {
                handleSearch();
            }, DEBOUNCE_DELAY);
        });
        
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearTimeout(debounceTimer);
            handleSearch();
        });
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceTimer);
                handleSearch();
            }
        });
    }

    // Inicializa el dropdown para dispositivos moviles
    function initDropdown() {
        var dropdown = document.querySelector('.header-dropdown');
        var dropdownBtn = document.getElementById('dropdownBtn');
        
        if (!dropdown || !dropdownBtn) return;
        
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                dropdown.classList.toggle('active');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Inicializa los eventos de tema y fuente
    function initThemeAndFont() {
        // Evento del boton de tema
        if (themeToggle) {
            themeToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleTheme();
            });
        }

        // Evento del selector de fuente
        if (fontSelect) {
            fontSelect.addEventListener('change', function() {
                applyFont(this.value);
            });
        }
    }

    // Inicializa la aplicacion cuando el DOM esta listo
    function init() {
        // Cargar configuraciones guardadas
        loadTheme();
        loadFont();
        listenSystemTheme();
        
        // Inicializar componentes
        initDropdown();
        initSearch();
        initThemeAndFont();
        
        // Evento del boton de ayuda
        if (helpBtn) {
            helpBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showHelp();
            });
        }
        
        // Eventos para cambiar entre secciones
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = this.dataset.page;
                switchPage(page);
            });
        });
        
        // Reinicia la aplicacion al hacer clic en el logo
        if (logoLink) {
            logoLink.addEventListener('click', function(e) {
                e.preventDefault();
                searchInput.value = '';
                currentWord = '';
                currentData = null;
                currentPage = 'definiciones';
                navLinks.forEach(function(link) {
                    if (link.dataset.page === 'definiciones') {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
                showEmptyState();
                searchInput.focus();
            });
        }
        
        // Busca la palabra guardada al cargar la pagina
        var savedWord = localStorage.getItem('last-word');
        if (savedWord) {
            searchInput.value = savedWord;
            setTimeout(function() {
                handleSearch();
            }, 300);
        } else {
            showEmptyState();
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();