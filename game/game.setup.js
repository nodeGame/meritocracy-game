/**
 * # Game setup
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * The file includes settings for the nodeGame client instance
 *
 * This settings are then used to call `node.setup('nodegame')` and its
 * remote version.
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(settings, stages) {

    var setup = {};

    //auto: true = automatic run, auto: false = user input
    setup.env = {
        auto: false
    };

    setup.debug = true;

    setup.verbosity = 1;

    setup.window = {
        promptOnleave: !setup.debug
    }

    return setup;
};
