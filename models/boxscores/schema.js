'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema({}, { strict: false });
const Model = Mongoose.model('Boxscores', Schema);

module.exports = Model;
