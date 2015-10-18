/**
 * # Game stages definition file
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    stager.addStep({
        id: 'bid',
        cb: function() {}
    });
    stager.addStep({
        id: 'results',
        cb: function() {}
    });

    stager.addStage({
        id: 'game',
        steps: ['bid', 'results']
    });

    stager
        .next('instructions')
        // .next('quiz')
        .repeat('game', settings.REPEAT)
        .next('questionnaire')
        .next('end')
        .gameover();


    // Precache stage removed.

    // Modifty the stager to skip some stages.

    // stager.skip('instructions');
    // stager.skip('quiz');

    return stager.getState();
};
