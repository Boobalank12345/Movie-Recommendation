const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/recommend';

async function test(name, payload) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`--- Test: ${name} ---`);
        console.log(`Payload:`, payload);
        console.log(`Result Count: ${data.length}`);
        if (data.length > 0) {
            console.log(`First Result: ${data[0].title} (${data[0].rating})`);
        }
        console.log('\n');
    } catch (e) {
        console.error(`Test ${name} failed:`, e.message);
    }
}

async function runTests() {
    // 1. Default (All movies)
    await test('Default (No filters)', { genre: 'All', minRating: 0, searchQuery: '' });

    // 2. Search strict
    await test('Search "Bat" (Should find Dark Knight)', { genre: 'All', minRating: 0, searchQuery: 'Bat' });

    // 3. Search strict with Rating
    // Dark Knight is 9.0. If we filter > 9.1 it should disappear.
    await test('Search "Bat" + High Rating (Should be empty)', { genre: 'All', minRating: 9.5, searchQuery: 'Bat' });

    // 4. Genre filtering
    await test('Genre "Sci-Fi"', { genre: 'Sci-Fi', minRating: 0, searchQuery: '' });

    // 5. Rating only
    await test('Rating > 9.0 (Godfather)', { genre: 'All', minRating: 9.1, searchQuery: '' });
}

runTests();
