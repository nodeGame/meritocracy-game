/**
 * # Game stages definition file
 * Copyright(c) 2018 Stefano Balietti
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
        .step('bid')
        .step('results')
    
        .next('questionnaire')
    
        .next('end')

        .gameover();

    


    // Modify the stager to skip some stages.

    // stager.skip('instructions');
    stager.skip('quiz');
    // stager.skip('game');
    // stager.skip('questionnaire');

    return stager.getState();
};
