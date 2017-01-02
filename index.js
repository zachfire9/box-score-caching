const Hapi = require('hapi');
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

const boxscoreHandler = function (request, reply) {

    const season = request.query.season;
    const gameId = request.query.gameId;
    const quarter = request.query.quarter;
    const minutes = request.query.minutes;
    const seconds = request.query.seconds;

    request.server.inject('/api/boxscore?season=' + season + '&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds, function (response) {
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

    server.route({ method: 'GET', path: '/boxscore', handler: boxscoreHandler });
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
