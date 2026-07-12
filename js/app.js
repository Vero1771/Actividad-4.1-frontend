(function() {
    'use strict';

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    const tabs = document.querySelectorAll('.tab');
    let currentTab = 'definiciones';
    let currentData = null;
    let currentWord = '';

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

        // Evento para botones de audio
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

    // Evento de búsqueda
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Evento de pestañas
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