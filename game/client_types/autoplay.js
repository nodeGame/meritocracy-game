/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

 const ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;
    let node = gameRoom.node;

    var stager;

    let game = gameRoom.getClientType('player');
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            var _cb, stepObj, id;
            stepObj = this.getCurrentStepObj();
            // Invoking original callback.
            _cb = stepObj._cb;
            _cb.call(this);

            id = stepObj.id;

            // Actions in Specific steps.

            if (id === 'quiz' || id === 'questionnaire') {
                node.widgets.lastAppended.setValues();
            }
            else if (id === 'bid') {
                node.on('PLAYING', function() {
                    node.timer.random.exec(function() {
                        node.game.timer.doTimeUp();
                    });
                });
            }

            if (id !== 'end') {
                node.timer.random(2000).done();
            }
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};
