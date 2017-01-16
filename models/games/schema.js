'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema({}, { strict: false });
const Model = Mongoose.model('Games', Schema);

module.exports = Model;
