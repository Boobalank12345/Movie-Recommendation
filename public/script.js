document.addEventListener('DOMContentLoaded', () => {
    const genreSelect = document.getElementById('genre-select');
    const ratingInput = document.getElementById('rating-input');
    const searchInput = document.getElementById('search-input');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const ratingValue = document.getElementById('rating-value');
    const recommendBtn = document.getElementById('recommend-btn');
    const resultsContainer = document.getElementById('results');

    // UI State for Debounce & AbortController
    let searchTimeout = null;
    let currentController = null; // To abort stale requests

    // Initialize Rating Display
    ratingValue.textContent = ratingInput.value;
    ratingInput.addEventListener('input', (e) => {
        ratingValue.textContent = e.target.value;
    });

    // Core Fetch Logic
    async function fetchMovies(logSearch = false) { // [MODIFY] Added parameter
        const genre = genreSelect.value;
        const minRating = ratingInput.value;
        const searchQuery = searchInput.value.trim();

        // 1. Abort previous request if it's still running
        if (currentController) {
            currentController.abort();
        }
        currentController = new AbortController();
        const signal = currentController.signal;

        // Visual Feedback
        if (document.activeElement !== searchInput) {
            recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        }

        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ genre, minRating, searchQuery, logSearch }), // [MODIFY] Pass flag
                signal: signal // Pass signal to fetch
            });

            if (!response.ok) throw new Error('API Error');
            const movies = await response.json();

            // Determine Render Mode
            const isSearchActive = searchQuery.length > 0;
            render(movies, isSearchActive);

        } catch (error) {
            if (error.name === 'AbortError') {
                // Ignore abort errors, this is expected behavior
                console.log('Fetch aborted');
            } else {
                console.error(error);
                resultsContainer.innerHTML = '<div class="placeholder-text">Error fetching movies.</div>';
            }
        } finally {
            // Only reset button if this is the *latest* request
            if (!signal.aborted) {
                recommendBtn.innerHTML = 'Find Movies <i class="fas fa-magic"></i>';
                currentController = null;
            }
        }
    }

    // Render Logic
    function render(movies, isSearchActive) {
        resultsContainer.innerHTML = '';

        // Handle "No Results"
        if (movies.length === 0) {
            const msg = isSearchActive
                ? `No movies found matching "${searchInput.value}"`
                : `No movies found with rating >= ${ratingInput.value}`;
            resultsContainer.innerHTML = `<div class="placeholder-text">${msg}</div>`;
            return;
        }

        // Mode: Grouped Sections (Only if NOT searching AND Genre is "All")
        const genre = genreSelect.value;
        if (!isSearchActive && genre === 'All') {
            resultsContainer.classList.remove('results-grid');
            resultsContainer.classList.add('results-sections');
            renderSections(movies);
        } else {
            // Mode: Flat Grid
            resultsContainer.classList.remove('results-sections');
            resultsContainer.classList.add('results-grid');
            renderFlat(movies);
        }
    }

    function renderSections(movies) {
        // Group movies strictly by their listed genre (simple grouping)
        const groups = {};

        movies.forEach(movie => {
            const genres = movie.genre.split(',').map(g => g.trim());
            genres.forEach(g => {
                if (!groups[g]) groups[g] = [];
                // Avoid duplicates in same group
                if (!groups[g].find(m => m.id === movie.id)) {
                    groups[g].push(movie);
                }
            });
        });

        // Create DOM
        Object.keys(groups).sort().forEach(gName => {
            if (groups[gName].length === 0) return;

            const section = document.createElement('section');
            section.className = 'genre-section';
            section.innerHTML = `<h2 class="genre-title">${gName}</h2>`;

            const grid = document.createElement('div');
            grid.className = 'results-grid';
            groups[gName].forEach(m => grid.appendChild(createCard(m)));

            section.appendChild(grid);
            resultsContainer.appendChild(section);
        });
    }

    function renderFlat(movies) {
        movies.forEach(m => resultsContainer.appendChild(createCard(m)));
    }

    function createCard(movie) {
        const div = document.createElement('div');
        div.className = 'movie-card';
        const posterBg = movie.poster && movie.poster.startsWith('http')
            ? `style="background-image: linear-gradient(to top, rgba(15,23,42,1), transparent), url('${movie.poster}')"`
            : '';

        div.innerHTML = `
            <div class="poster-box" ${posterBg}></div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.genre}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${movie.rating}</span>
                </div>
                <p class="description">${movie.description}</p>
            </div>
        `;
        return div;
    }

    // Event Bindings
    recommendBtn.addEventListener('click', () => fetchMovies(true)); // [MODIFY] Explicit click

    // Auto-fetch on Genre Change (Implicit)
    genreSelect.addEventListener('change', () => fetchMovies(false));

    // Auto-fetch on Rating Change (Implicit)
    ratingInput.addEventListener('change', () => fetchMovies(false));

    // Live Search with Debounce (Implicit)
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchMovies(false), 300);
    });

    // Enter Key (Explicit)
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            fetchMovies(true);
        }
    });

    // Icon Click (Explicit)
    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', () => {
            clearTimeout(searchTimeout);
            fetchMovies(true);
        });
    }

    // Initial Load
    fetchMovies();
});
