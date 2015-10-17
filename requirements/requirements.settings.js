/**
 * # Requirements settings
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // If enabled a Requirements room will be created in the channel,
    // and all incoming connections will be tested there.
    enabled: true, // [false] Default: TRUE.

    // Path the requirement room logic.
    logicPath: './requirements.room.js',

    // Future option. Not available now. Path to login page in `public/`
    page: 'requirements.htm',
    
    // Optional. Maximum time to pass the tests of all requirements.
    maxExecTime: 8000,

    // Optional. Which browsers are excluded.
    excludeBrowsers: {
        browser: 'netscape'
    }

};