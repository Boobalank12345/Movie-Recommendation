const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Movie = require('./models/Movie');
require('dotenv').config();

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cine_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB (cine_db) for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

const seedMovies = async () => {
    try {
        // Read movies.json
        const moviesPath = path.join(__dirname, 'movies.json');
        const data = fs.readFileSync(moviesPath, 'utf8');
        const movies = JSON.parse(data);

        // Clear existing data
        await Movie.deleteMany({});
        console.log('Cleared existing movies from database.');

        // Insert new data
        await Movie.insertMany(movies);
        console.log(`Successfully seeded ${movies.length} movies into 'cine_db'.`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.connection.close();
    }
};

seedMovies();
