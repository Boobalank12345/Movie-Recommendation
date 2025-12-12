const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
    term: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    genre_filter: { type: String } // Captures if a genre was selected during search
});

module.exports = mongoose.model('SearchLog', searchLogSchema);
