(function() {
    'use strict';

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');

    function showLoading() {
        resultContainer.innerHTML = '<p>Cargando...</p>';
    }

    function showError(message) {
        resultContainer.innerHTML = '<p>Error: ' + message + '</p>';
    }

    function showResult(data, word) {
        if (!data || data.length === 0) {
            showError('No se encontraron definiciones para "' + word + '"');
            return;
        }

        const entry = data[0];
        const meanings = entry.meanings || [];
        
        let html = '<h2>' + word + '</h2>';
        
        if (entry.phonetic) {
            html += '<p>Pronunciación: ' + entry.phonetic + '</p>';
        }
        
        meanings.forEach(function(m) {
            html += '<h3>' + (m.partOfSpeech || '') + '</h3>';
            html += '<ul>';
            (m.definitions || []).forEach(function(d) {
                html += '<li>' + d.definition + '</li>';
            });
            html += '</ul>';
        });
        
        resultContainer.innerHTML = html;
    }

    function fetchWord(word) {
        if (!word || word.trim() === '') {
            resultContainer.innerHTML = '<p>Escribe una palabra para buscar su definición</p>';
            return;
        }

        const trimmed = word.trim().toLowerCase();
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
                showResult(data, trimmed);
            })
            .catch(function(error) {
                showError(error.message);
            });
    }

    function handleSearch() {
        const word = searchInput.value.trim();
        fetchWord(word);
    }

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

})();