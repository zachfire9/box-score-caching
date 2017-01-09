'use strict';

const Boxscore = require('./boxscore');
const Game = require('./game');
const Views = require('./views');

module.exports = [].concat(Boxscore, Game, Views);
