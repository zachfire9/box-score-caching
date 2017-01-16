'use strict';

const Boom = require('boom');

const BoxscoresModel = require('../models/boxscores/schema');

module.exports = [
    {
        method: 'POST',
        path: '/api/boxscores',
        config: {
            description: 'CREATE boxscore',
            notes: 'Adds a new boxscore to the collection.',
            tags: ['api']
        },
        handler: function (request, reply) {

            const payload = request.payload;
            const boxscore = new BoxscoresModel(payload);
            boxscore.save((err, result) => {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badImplementation());
                }

                return reply(result);
            });
        }
    },
    {
        method: 'GET',
        path: '/api/boxscores',
        config: {
            description: 'READ boxscores',
            notes: 'Returns all the boxscores and filters by search options in the querystring.',
            tags: ['api']
        },
        handler: function (request, reply) {

            let query = request.query;

            if (query.findClosestToTime) {
                let currentTime = 0;
                const quarter = parseInt(query.quarter);
                const minutes = parseInt(query.minutes);
                const seconds = parseInt(query.seconds);
                delete query.findClosestToTime;
                delete query.quarter;
                delete query.minutes;
                delete query.seconds;

                if (quarter === 1) {
                    currentTime = minutes + (seconds / 60);
                }
                else {
                    currentTime = ((quarter - 1) * 12) + minutes + (seconds / 60);
                }

                query.currentTime = { '$lte': currentTime };
                // Return results in descending order.
                query = { $query: query, $orderby: { currentTime : -1 } };
            }

            BoxscoresModel.find(query, (err, boxscoreRecord) => {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badImplementation());
                }

                return reply(boxscoreRecord);
            });
        }
    },
    {
        method: 'GET',
        path: '/api/boxscores/{boxscoreId}',
        config: {
            description: 'READ boxscore by ID',
            notes: 'Returns the boxscore with the associated ID and filters by search options in the querystring.',
            tags: ['api']
        },
        handler: function (request, reply) {

            const query = request.query;
            query._id = request.params.boxscoreId;

            BoxscoresModel.find(query, (err, boxscoreRecord) => {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badImplementation());
                }

                return reply(boxscoreRecord);
            });
        }
    }
];
