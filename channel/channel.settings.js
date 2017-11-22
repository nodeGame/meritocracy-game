/**
 * # Channel settings
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * The channel is divided into two internal servers: player and admin.
 * Each of those grants different privileges upon connection.
 *
 * The options for player and admin server are specified by the
 * `playerServer` and `adminServer` properties here.
 *
 * If they share the same options, then just a string with
 * the name of the two different connection endpoints must be specified.
 *
 * If different options apply to each server, `playerServer` and `adminServer`
 * they must be specified as configuration objects, with the name of
 * the _endpoint_ specified as a key in the object.
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // By default the name of the channel is the name of the game,
    // as found in the package.json file. This means that files will
    // be served from the address http://myserver/gameName/
    // Here you can add aliases to enable urls like: http://myserver/alias/
    // alias: [ 'experiment' ],

    // Name of the endpoint for socket.io player connections
    playerServer: 'meritocracy',

    // Name of the endpoint for the socket.io admin connections
    adminServer: 'meritocracy/admin',

    // All options below are shared by player and admin servers.

    // Default verbosity for node instances running in the channel,
    // e.g.: logics, bots, etc.
    verbosity: 100,

    // If TRUE, players can invoke GET commands on admins.
    getFromAdmins: true,

    // Unauthorized clients will be redirected here.
    // (defaults: "/pages/accessdenied.htm")
    // accessDeniedUrl: 'unauth.htm',

    // By default player actions are notified to admins only. Force
    // notification to other players connected in the same game room:
    notify: {

        // When a player connects / disconnects.
        onConnect: false,

        // When a player changes a stage / step.
        onStageUpdate: false,

        // When the 'LOADED' stageLevel is fired (useful to sync players)
        onStageLoadedUpdate: false,

        // When any change of stageLevel happens (e.g. INIT, CALLBACK_EXECUTED)
        // Notice: generates a bit overhead of messages.
        onStageLevelUpdate: false,

    },

    // If TRUE, only one TAB per browser will be allowed.
    enableReconnections: true

};
