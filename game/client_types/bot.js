/**
 * # Bot type implementation
 * Copyright(c) 2018 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

const ngc = require('nodegame-client');
const J = ngc.JSUS;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;
    let logic = gameRoom.node;

    stager.extendAllSteps(function(o) {
        o.cb = function() {
            let node, stepObj, id;
            stepObj = this.getCurrentStepObj();
            id = stepObj.id;
            node = this.node;

            // We do not actually play.

            if (id === 'bid') {
                node.on('PLAYING', function() {
                    node.timer.random.exec(function() {
                        node.done({
                            contribution: J.randomInt(-1, 20),
                            demamd: J.randomInt(-1, 20)
                        });
                    });
                });
            }
            else {
                node.timer.random(2000).done();
            }
        };
        return o;
    });
};
