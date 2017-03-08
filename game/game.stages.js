/**
 * # Game stages definition file
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    stager
        .next('instructions')
        .next('quiz')
        .repeat('game', settings.REPEAT)
        .next('questionnaire')
        .next('end')
        .gameover();

    
    stager.extendStage('game', {
        steps: ['bid', 'results']
    });


    // Modifty the stager to skip some stages.

    stager.skip('instructions');
    stager.skip('quiz');
    // stager.skip('game');

    return stager.getState();
};
