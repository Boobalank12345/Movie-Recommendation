const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // [NEW] Use Mongoose
const Movie = require('./models/Movie'); // [NEW] Import Movie Model
const SearchLog = require('./models/SearchLog'); // [NEW] Import SearchLog Model
require('dotenv').config();

const app = express();
const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cine_db'; // [NEW] DataBase URI

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// [NEW] Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB (cine_db)'))
    .catch(err => console.error('MongoDB connection error:', err));

// [MODIFY] GET /api/movies - Fetch from MongoDB
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// [MODIFY] POST /api/recommend - Search & Filter with MongoDB
app.post('/api/recommend', async (req, res) => {
    try {
        const { genre, minRating, searchQuery, logSearch } = req.body; // [MODIFY] Extract logSearch

        // [MODIFY] Log Search Query ONLY if explicit AND has meaningful length > 2
        if (logSearch && searchQuery && searchQuery.trim().length > 2) {
            await SearchLog.create({
                term: searchQuery.trim(),
                genre_filter: genre
            });
            console.log(`[LOGGED] Search term: "${searchQuery}"`);
        }

        let query = {};

        // 1. SEARCH LOGIC (Priority 1: GLOBAL SEARCH)
        if (searchQuery && searchQuery.trim().length > 0) {
            const regex = new RegExp(searchQuery.trim(), 'i'); // Case-insensitive regex
            query.title = { $regex: regex };
        } else {
            // 2. BROWSE LOGIC (Only if NOT searching)
            if (genre && genre !== 'All') {
                query.genre = { $regex: genre, $options: 'i' }; // Flexible genre match
            }
        }

        // 3. RATING LOGIC (Global Priority)
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        const recommendations = await Movie.find(query).sort({ rating: -1 });

        console.log(`[RECOMMEND] Query via MongoDB -> Found ${recommendations.length} movies.`);
        res.json(recommendations);

    } catch (err) {
        console.error("Error in recommendation:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export for Vercel (Serverless)
module.exports = app;

// Only listen if run directly (local dev)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
