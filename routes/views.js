'use strict';

const Moment = require('moment');
const Underscore = require('underscore');

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

        const record = response.result.toJSON()
        const date = Moment(record.date).format("dddd, MMMM Do YYYY");
        const startTime = Moment(record.startTime).utcOffset("-05:00").format("h:mm:ss a");
        const endTime = Moment(record.endTime).utcOffset("-05:00").format("h:mm:ss a");
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
    const date = request.payload.date;
    const teamAway = request.payload.teamAway;
    const teamHome = request.payload.teamHome;
    const gameId = [date, teamAway, teamHome].join('-');
    const quarter = request.payload.quarter;

    const minutes = 11 - request.payload.minutes;
    const seconds = 60 - request.payload.seconds;

    request.server.inject('/api/boxscores?findClosestToTime=true&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds, function (response) {

        let viewObject = {
            title: 'Boxscore',
            error: true
        };

        if (response.result && response.result.length > 0) {
            const record = response.result[0].toJSON();
            viewObject.message = record;
            viewObject.lastQuarter = Underscore.last(record.gameboxscore.quarterSummary.quarter);
            viewObject.lastScoringPlay = Underscore.last(viewObject.lastQuarter.scoring.scoringPlay);
        }

        reply.view('boxscore', viewObject);
    });
};

module.exports = [
    { 
        method: 'GET', 
        path: '/boxscoreform', 
        handler: boxscoreFormHandler 
    },
    { 
        method: 'POST', 
        path: '/boxscore', 
        handler: boxscoreHandler 
    },
    { 
        method: 'GET', 
        path: '/creategameform', 
        handler: createGameFormHandler 
    },
    { 
        method: 'POST', 
        path: '/game', 
        handler: gameFormHandler 
    }
];
