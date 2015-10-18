/**
 * # Game stages definition file
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    stager.addStep({
        id: 'instr1',
        cb: function() {}
    });
    stager.addStep({
        id: 'instr2',
        cb: function() {}
    });
    stager.addStep({
        id: 'decision',
        cb: function() {}
    });
    stager.addStep({
        id: 'results',
        cb: function() {}
    });

    stager.addStage({
        id: 'instructions',
        steps: ['instr1', 'instr2']
    });

    stager.addStage({
        id: 'game',
        steps: ['decision', 'results']
    });

    stager
        .next('instructions')
        .next('quiz')
        .repeat('game', settings.REPEAT)
        .next('end')
        .gameover();


    // Modifty the stager to skip some stages.

    // stager.skip('instructions');
    // stager.skip('quiz');

    return stager.getState();
};
