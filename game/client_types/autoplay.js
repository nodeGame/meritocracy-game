/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

 var ngc =  require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var game, stager;

    game = gameRoom.getClientType('player');
    game.env.auto = true;
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
            if (id === 'bid') {
                node.timer.randomExec(function() {
                    var validation, validInputs;
                    validation = node.game.checkInputs();
                    validInputs = node.game.correctInputs(validation);
                    node.emit('BID_DONE', validInputs, false);
                }, 4000);
            }
            else {
                if (id === 'quiz' || id === 'questionnaire') {
                    node.widgets.lastAppended.setValues();
            
                    
                    if (id !== 'end') {
                        node.timer.randomDone(2000);
                    }
                }
            }
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};
