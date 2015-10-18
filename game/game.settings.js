/**
 * # Game settings definition file
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * The variables in this file will be sent to each client and saved under:
 *
 *   `node.game.settings`
 *
 * The name of the chosen treatment will be added as:
 *
 *    `node.game.settings.treatmentName`
 *
 * http://www.nodegame.org
 * ---
 */


module.exports = {

    // Variables shared by all treatments.

    // Session counter.
    SESSION_ID: 12,

    // Numnber of game rounds repetitions.
    // TODO: if the value is changed the QUIZ page needs to be updated.
    REPEAT: 4,

    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 4,

    // TODO REMOVE. Game settings.
    TREATMENTS: ['blackbox', 'endo', 'random',
        'exo_low', 'exo_high', 'exo_perfect'
    ],

    // Which treatment to play.
    // Leave undefined for a randomly chosen treatment.
    CHOSEN_TREATMENT: 'exo_low',

    GROUP_NAMES: ['1', '2', '3', '4'],
    // How many player in each group. *
    SUBGROUP_SIZE: 4,

    // Noise standard deviation. High and low "meritocracy".
    NOISE_HIGH: 1.4142,
    NOISE_LOW: 2,

    // Payment settings. *
    GROUP_ACCOUNT_DIVIDER: 2,
    INITIAL_COINS: 20,

    // Divider ECU / DOLLARS *
    EXCHANGE_RATE: 266,

    // Show up fee.
    showupFee: 1, // 27.07 -> 1.2

    // Conversion rate ECU to DOLLARS.
    exchangeRate: 0.001,

    timer: {

        instr1: 90000,
        instr2: 60000,
        quiz: 90000,
        decision: function() {
            if (this.getCurrentGameStage().round === 1) return 45000;
            return 15000;
        },
        results: function() {
            if (this.getCurrentGameStage().round === 1) return 20000;
            return 8000;
        }

    },



    // DEBUG.
    DEBUG: false,

    // AUTO-PLAY.
    AUTO: true,

    // DATABASE.
    DB: 'FILE', // FILE, MONGODB

    // AUTHORIZATION.
    AUTH: 'NO', // MTURK, LOCAL, NO.

    // end to remove.

    // Treatments definition.

    treatments: {
        blackbox: {
            group: 'blackbox'
        }, 
        endo: {
            group: 'endo'
        }, 
        random: {
            group: 'random'
        }, 
        exo_low: {
            group: 'exo_low'
        }, 
        exo_high: {
            group: 'exo_high'
        }, 
        exo_perfect: {
            group: 'exo_perfect'
        }
    }
};
