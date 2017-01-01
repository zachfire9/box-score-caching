const Mongoose = require('mongoose');
const Schema = Mongoose.Schema({}, { strict: false });
const Model = Mongoose.model('Game', Schema);

module.exports = Model;