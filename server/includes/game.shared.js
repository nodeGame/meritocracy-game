/**
 * # Shared settings for meritocracy game. 
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = {

    // Group settings.

    // How many players have to connect before a random subset is drawn.
    POOL_SIZE: 16,
    // How many players in each group ( must be <= POOL_SIZE).
    GROUP_SIZE: 16,
    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 16,

    // Game settings.
    TREATMENTS: ['blackbox', 'endo', 'random', 
                'exo_low', 'exo_high', 'exo_perfect'],

    // Which treatment to play.
    // Leave undefined for a randomly chosen treatment.
    CHOSEN_TREATMENT: 'endo', 

    // How many times the meritocracy stage is repeated.
    REPEAT: 20,
    // Names of the groups.
    GROUP_NAMES: ['1', '2', '3', '4'],
    // How many player in each group.
    SUBGROUP_SIZE: 4,
    
    // Noise variance. High and low "meritocracy".
    NOISE_HIGH: 2,
    NOISE_LOW: 4,

    // Payment settings.
    GROUP_ACCOUNT_DIVIDER: 2,
    INITIAL_COINS: 10,

    // DEBUG.
    DEBUG: true,

    // AUTO-PLAY.
    AUTO: true

};