const Confidence = require('confidence');

const criteria = {
    env: process.env.NODE_ENV
};

const config = {
    feed: process.env.FEED || 'https://www.mysportsfeeds.com/api/feed/sample/pull/nba/2015-2016-regular/game_boxscore.json'
};

const store = new Confidence.Store(config);

exports.get = function (key) {

    return store.get(key, criteria);
};
