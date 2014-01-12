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
    POOL_SIZE: 2,
    // How many players in each group ( must be <= POOL_SIZE).
    GROUP_SIZE: 2,
    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 2,

    // Game settings.
    REPEAT: 20,
    GROUP_NAMES: ['1', '2', '3', '4'],
    
    // Noise variance. High and low "meritocracy".
    NOISE_HIGH: 2,
    NOISE_LOW: 4,

    // Payment settings.
    GROUP_ACCOUNT_DIVIDER: 2,
    INITIAL_COINS: 10,

    // DEBUG.
    DEBUG: true,

    // AUTO-PLAY.
    AUTO: false

};