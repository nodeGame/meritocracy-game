/**
 * # Bot type implementation
 * Copyright(c) 2018 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var J = ngc.JSUS;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    stager.extendAllSteps(function(o) {
        o.cb = function() {
            var node, stepObj, id;
            stepObj = this.getCurrentStepObj();
            id = stepObj.id;
            node = this.node;

            // We do not actually play.

            if (id === 'bid') {
                node.on('PLAYING', function() {
                    node.timer.randomExec(function() {
                        node.done({
                            contribution: J.randomInt(-1, 20),
                            demamd: J.randomInt(-1, 20)
                        });
                    });
                });
            }
            else {
                node.timer.randomDone(2000);
            }
        };
        return o;
    });
};
