const Mongoose = require('mongoose');
const Schema = Mongoose.Schema({}, { strict: false });
const Model = Mongoose.model('Boxscore', Schema);

module.exports = Model;