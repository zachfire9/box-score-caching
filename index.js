const Hapi = require('hapi');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Underscore = require('underscore');

const Config = require('./config');
const Routes = require('./routes');

const server = new Hapi.Server();

server.connection({ port: 8080 });

mongoUri = Config.get('/mongoUri');

server.on('stop', function () { Mongoose.disconnect(); });

Mongoose.connection.on('error', function(err) {
    server.log(['plugin', 'error', 'mongoose'], "Mongoose error: " + (err.stack || err));
    throw err;
});

Mongoose.connection.on('open', function() {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose connected to " + mongoUri);
});

Mongoose.connection.on('close', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose disconnected from " + mongoUri);
});

Mongoose.connection.on('reconnected', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose reconnected to " + mongoUri);
});

Mongoose.connection.on('timeout', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose timeout: " + (err.stack || err));
});

Mongoose.set('debug', true);

server.log(['plugin', 'info', 'mongoose'], "Mongoose connecting to " + mongoUri);
Mongoose.connect(mongoUri);

server.route(Routes);

const createGameFormHandler = function (request, reply) {

    reply.view('creategameform', {
        title: 'Create Game',
    });
};

const gameFormHandler = function (request, reply) {

    const payload = {
        season: request.payload.season,
        date: request.payload.date,
        team: request.payload.team
    };

    const req = { method: 'POST', url: '/api/games', payload: payload };

    request.server.inject(req, function (response) {
        console.log(response.result);
        const record = response.result.toJSON()
        const date = Moment(record.date).format("dddd, MMMM Do YYYY");
        const startTime = Moment(record.startTime).format("h:mm:ss a");
        const endTime = Moment(record.endTime).format("h:mm:ss a");
        reply.view('game', {
            title: 'Game',
            date: date,
            startTime: startTime,
            endTime: endTime
        });
    });
};

const boxscoreFormHandler = function (request, reply) {

    reply.view('boxscoreform', {
        title: 'Boxscore',
    });
};

const boxscoreHandler = function (request, reply) {

    const season = request.payload.season;
    const gameId = request.payload.gameId;
    const quarter = request.payload.quarter;
    const minutes = request.payload.minutes;
    const seconds = request.payload.seconds;

    request.server.inject('/api/boxscores?season=' + season + '&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds, function (response) {
        const record = response.result.toJSON()
        const lastQuarter = Underscore.last(record.gameboxscore.quarterSummary.quarter);
        const lastScoringPlay = Underscore.last(lastQuarter.scoring.scoringPlay);
        reply.view('boxscore', {
            title: 'Boxscore',
            message: record,
            lastQuarter: lastQuarter,
            lastScoringPlay: lastScoringPlay
        });
    });
};

server.register(require('vision'), (err) => {

    if (err) {
        console.log("Failed to load vision.");
    }

    server.views({
        engines: { jade: require('jade') },
        path: __dirname + '/templates',
        compileOptions: {
            pretty: true
        }
    });

    server.route({ method: 'GET', path: '/boxscoreform', handler: boxscoreFormHandler });
    server.route({ method: 'POST', path: '/boxscore', handler: boxscoreHandler });
    server.route({ method: 'GET', path: '/creategameform', handler: createGameFormHandler });
    server.route({ method: 'POST', path: '/game', handler: gameFormHandler });
});

server.register({
    register: require('./plugins/box-score-polling'),
    options: {
        pollingEnabled: Config.get('/pollingEnabled')
    }
}, (err) => {

    if (err) {
        console.log("Failed to load box-score-polling.");
    }
});

server.register({
    register: require('good'),
    options: {
        reporters: {
            console: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: 'good-console'
            }, 'stdout']
        }
    }
}, (err) => {

    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start((err) => {

        if (err) {
            throw err;
        }
        server.log(['server', 'info'], 'Server started on port: ' + server.info.port);
    });
});
