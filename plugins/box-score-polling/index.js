'use strict';

const Later = require('later');
const Moment = require('moment');

exports.register = function (server, options, next) {

    if (options.pollingEnabled) {
        const getGames =  function () {

            server.methods.getGames(server, Moment().utc().format('x'), (err, result) => {

                if (err) {
                    server.log('error', err);
                    return next();
                }

                server.log('info', result);
                return next();
            });
        };

        const schedule = Later.parse.text(options.pollingSchedule);
        Later.setInterval(getGames, schedule);
    }

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
