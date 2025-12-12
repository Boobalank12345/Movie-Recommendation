const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Legacy ID from JSON
    title: { type: String, required: true },
    genre: { type: String, required: true },
    rating: { type: Number, required: true },
    description: { type: String, required: true },
    poster: { type: String, required: true }
});

module.exports = mongoose.model('Movie', movieSchema);
