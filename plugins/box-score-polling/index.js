'use strict';

const Later = require('later');
const Moment = require('moment');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../../config');

exports.register = function (server, options, next) {

    if (options.pollingEnabled) {
        const schedule = Later.parse.text(options.pollingSchedule);
        const timer = Later.setInterval(getGames, schedule);

        function getGames() {

            server.methods.getGames(server, Moment().utc().format('x'), function (err, result) {

                if (err) {
                    server.log('error', err);
                    return next();
                }

                server.log('info', result);
                return next();
            });
        };        
    }

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
