/**
 * # Waiting Room for Meritocracy Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles incoming connections, matches them, sets the Meritocracy game
 * in each client, move them in a separate gaming room, and start the game.
 * ---
 */
module.exports = function(node, channel, room) {

    var path = require('path');

    var J = require('JSUS').JSUS;

    // Load shared settings.
    var settings = require(__dirname + '/includes/game.shared.js');

    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, 'descil.conf.js');

    // Load the code database.
    var dk = require('descil-mturk')(confPath);
    function codesNotFound() {
        if (!dk.codes.size()) {
            throw new Error('game.room: no codes found.');
        }
        // Add a ref to the node obj.
        node.dk = dk;
    }

    if (settings.AUTH === 'MTURK') {
        dk.getCodes(codesNotFound);
    }
    else {
        dk.readCodes(codesNotFound);
    }

    // If NO authorization is found, local codes will be used,
    // and assigned automatically.
    var noAuthCounter = -1;

    // Used to rotate treatments.
    var treatmentCounter = -1;

    // Loads the database layer. If you do not use an external database
    // you do not need these lines.
    var Database = require('nodegame-db').Database;
    var ngdb = new Database(node);
    var mdb = ngdb.getLayer('MongoDB');

    // Load the nodegame-client object.
    var ngc = require('nodegame-client');

    // Creates a Stager object. It will be used to define the sequence of
    // stages for this waiting rooms.
    var stager = new node.Stager();

    // Loading the logic rules that will be used in each sub-gaming room.
    var logicPath = __dirname + '/includes/game.logic';

    // Creating the array for association between room and their logic
    var roomLogics = {
        blackbox: {
            group: 'blackbox',
            logicPath: logicPath,
        }, 
        endo: {
            group: 'endo',
            logicPath: logicPath,
        }, 
        random: {
            group: 'random',
            logicPath: logicPath,
        }, 
        exo_low: {
            group: 'exo_low',
            logicPath: logicPath,
        }, 
        exo_high: {
            group: 'exo_high',
            logicPath: logicPath,
        }, 
        exo_perfect: {
            group: 'exo_perfect',
            logicPath: logicPath,
        }
    };

    // Assigns a treatment condition to a group.
    function decideRoom(treatment) {
        ++treatmentCounter;
        if ('undefined' === typeof treatment) {            
            treatment = J.randomInt(0,settings.TREATMENTS.length);
            treatment = settings.TREATMENTS[treatment];
        }
        else {
            if (treatmentCounter === 0) {
                treatment = 'exo_perfect';
            }
            else if (treatmentCounter === 1) {
                treatment = 'exo_high';
            }
            else {
                treatment = 'exo_low';
            }
            
        }
        // Implement logic here.
        return roomLogics[treatment];
    }

    // You can share objects with the included file. Include them in the
    // object passed as second parameter.
    var client = channel.require(__dirname + '/includes/game.client', {
        ngc: ngc,
        settings: settings
    });

    var clientWait = channel.require(__dirname + '/includes/wait.client', {
        ngc: ngc,
        settings: settings
    });

    // Creating a unique game stage that will handle all incoming connections. 
    stager.addStage({
        id: 'waiting',
        cb: function () {
            // Returning true in a stage callback means execution ok.
            return true;
        }
    });

    // Creating an authorization function for the players.
    // This is executed before the client the PCONNECT listener.
    channel.player.authorization(function(header, cookies, room) {
        var code, player, token;

        if (settings.AUTH === 'NO') {
            return true;
        }

        playerId = cookies.player;
        token = cookies.token;

        console.log('game.room: checking auth.');
        
        // Weird thing.
        if ('string' !== typeof playerId) {
            console.log('no player: ', player)
            return false;
        }

        // Weird thing.
        if ('string' !== typeof token) {
            console.log('no token: ', token)
            return false;
        }
        
        code = dk.codeExists(token);
        
        // Code not existing.
	if (!code) {
            console.log('not existing token: ', token);
            return false;
        }
        
        // Code in use.
        //  usage is for LOCAL check, IsUsed for MTURK
	if (code.usage || code.IsUsed) {
            if (code.disconnected) {
                return true;
            }
            else {
                console.log('token already in use: ', token);
                return false;
            }
	}

        // Client Authorized
        return true;

    });

    // Assigns Player Ids based on cookie token. Must return a string.
    channel.player.clientIdGenerator(function(headers, cookies, validCookie, 
                                              ids, info) {
        var code;
        if (settings.AUTH === 'NO') {
            code = dk.codes.db[++noAuthCounter].AccessCode;
            dk.incrementUsage(code);
            return code;
        }

        // Return the id only if token was validated.
        // More checks could be done here to ensure that token is unique in ids.
        if (cookies.token && validCookie) {
            return cookies.token;
        }
    });

    // Creating an init function.
    // Event listeners registered here are valid for all the stages of the game.
    stager.setOnInit(function() {
        var counter = 0;
        var COUNTDOWN_MILLISECONDS = settings.COUNTDOWN_MILLISECONDS;
        var COUNTDOWN_AT_POOL_SIZE = settings.COUNTDOWN_AT_POOL_SIZE;
        var POOL_SIZE = settings.POOL_SIZE;
        var GROUP_SIZE = settings.GROUP_SIZE;

        // Countdown
        var countdown;

        // Starts the countdown on (if that is the case) and notify the players.
        // If countdown is already started, just send the time left to the
        // new client (pId).
        function startCountdown(nPlayers, pId) {
            // If COUNTDOWN option is on check whether we should start it.
            if ('undefined' !== typeof COUNTDOWN_AT_POOL_SIZE &&
                nPlayers >= COUNTDOWN_AT_POOL_SIZE) {                    
                if (!countdown) {
                    // Need to specify update, otherwise update = milliseconds.
                    countdown = node.timer.createTimer({
                        milliseconds: COUNTDOWN_MILLISECONDS,
                        update: 1000,
                        timeup: 'DISPATCH'
                    });
                    // Send countdown to client for the first time to ALL.
                    node.say('countdown', 'ALL',  countdown.timeLeft);
                    countdown.start();
                }
                else {
                    // Countdown already existing. Send it to the new client.
                    node.say('countdown', pId, countdown.timeLeft);
                }                
            }            
        }

        // Stops the countdown (if that is the case) and notify all players.
        function stopCountdown(success) {
            // If COUNTDOWN option is on check whether we should start it.
            if ('undefined' !== typeof COUNTDOWN_AT_POOL_SIZE) {            
                if (countdown && 
                    room.clients.player.size() < COUNTDOWN_AT_POOL_SIZE) {
                    // Timer must be destroyed to clear event listeners.
                    node.timer.destroyTimer(countdown);
                    countdown = null;
                    // Send countdown to client.
                    node.say('countdownStop', 'ALL', !success);
                }                
            }
        }

        function adjustGameSettings(nPlayers) {            
            var mySettings;
            mySettings = {
                MIN_PLAYERS: settings.MIN_PLAYERS,
                SUBGROUP_SIZE: settings.SUBGROUP_SIZE,
                GROUP_SIZE: nPlayers >= 16 ? settings.GROUP_SIZE : nPlayers
            };

            // Settings are kept default.
            return mySettings;

            if (nPlayers !== 16) {
                if (nPlayers === 15) {
                    mySettings.SUBGROUP_SIZE = 5;
                    mySettings.GROUP_SIZE = 15;
                }
                else if (nPlayers >= 12) {
                    mySettings.GROUP_SIZE = 12;
                }
                else if (nPlayers >= 9) {
                    mySettings.GROUP_SIZE = 9;
                    mySettings.SUBGROUP_SIZE = 3;
                }
            }
            return mySettings;            
        }

        // references...
        this.room = room;
        this.channel = channel;

        console.log('********Waiting Room Created*****************');

        function connectingPlayer(p) {
            var nPlayers;
            console.log('-----------Player connected ' + p.id);

            
            if (settings.AUTH === 'MTURK') {
                dk.checkIn(p.id);
            }

            nPlayers = room.clients.player.size();

            console.log('CONNECTED PLAYERS: ', nPlayers);
            console.log('------------------------------');

            // Send the client the waiting stage.
            node.remoteSetup('game_metadata', p.id, clientWait.metadata);
            node.remoteSetup('plot', p.id, clientWait.plot);
            node.remoteCommand('start', p.id);

            node.say('waitingRoom', 'ALL', {
                poolSize: POOL_SIZE,
                nPlayers: nPlayers,
                atLeastPlayers: COUNTDOWN_AT_POOL_SIZE
            });

            // Wait to have enough clients connected.
            if (nPlayers < POOL_SIZE) {
                startCountdown(nPlayers, p.id);
            }
            else {
                node.emit('DISPATCH');
            }
        }


        // This callback is executed whenever a previously disconnected
        // players reconnects.
        node.on.preconnect(function (p) {
            console.log('Oh...somebody reconnected in the waiting room!', p);
            // Notify other player he is back.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            // TODO: Cannot use to: ALL, because this includes the reconnecting
            // player.
            node.game.pl.each(function(player) {
                node.socket.send(node.msg.create({
                    target: 'PCONNECT',
                    data: p,
                    to: player.id
                }));
            });

            node.socket.send(node.msg.create({
                target: 'PLIST',
                data: node.game.pl.db,
                to: p.id
            }));
            
            node.game.pl.add(p);
            connectingPlayer(p);
        });

        // This must be done manually for now (maybe will change in the future).
        node.on.mreconnect(function (p) {
            node.game.ml.add(p);
        });

        // This callback is executed when a player connects to the channel.
        node.on.pconnect(connectingPlayer);

        // This callback is executed when a player disconnects from the channel.
        node.on.pdisconnect(function(p) {            
            // Also check if it should be stopped.
            stopCountdown();

            // Client really disconnected (not moved into another game room).
            if (channel.registry.clients.disconnected.get(p.id)) {
                // Free up the code.
                dk.decrementUsage(p.id);
            }            
        });


        node.on('DISPATCH', function() {
            var gameRoom, wRoom, tmpPlayerList, assignedRoom;
            var nPlayers, i, len;
            var runtimeConf;

            // Also check if it should be stopped.
            stopCountdown(true);

            // PlayerList object of waiting players.
            wRoom = room.clients.player;
            nPlayers = wRoom.size();

            console.log('-----------We have enough players: ' + nPlayers);

            runtimeConf = adjustGameSettings(nPlayers);

            
            i = -1, len = Math.floor(nPlayers / runtimeConf.GROUP_SIZE);
            for (; ++i < len;) {

                // Doing the random matching.
                tmpPlayerList = wRoom.shuffle().limit(runtimeConf.GROUP_SIZE);

                //Assigning a game room to this list of players
                assignedRoom = decideRoom(settings.CHOSEN_TREATMENT);
                runtimeConf.roomType = assignedRoom.group;

                // Creating a sub gaming room.
                // The object must contains the following information:
                // - clients: a list of players (array or PlayerList)
                // - logicPath: the path to the file containing the logic (string)
                // - channel: a reference to the channel of execution (ServerChannel)
                // - group: a name to group together multiple game rooms (string)
                gameRoom = channel.createGameRoom({
                    group: assignedRoom.group,
                    clients: tmpPlayerList,
                    channel: channel,
                    logicPath: assignedRoom.logicPath,
                    runtimeConf: runtimeConf
                });

                // Setting metadata, settings, and plot.
                tmpPlayerList.each(function (p) {
                    // Clearing the waiting stage.
                    node.remoteCommand('stop', p.id);
                    // Setting the actual game.
                    node.remoteSetup('game_metadata', p.id, client.metadata);
                    node.remoteSetup('game_settings', p.id, client.settings);
                    node.remoteSetup('plot', p.id, client.plot);
                    node.remoteSetup('env', p.id, client.env);
                    node.remoteSetup('env', p.id, {
                        roomType: assignedRoom.group
                    });
                });


                // Start the logic.
                gameRoom.startGame();
            }

            // TODO: node.game.pl.size() is unchanged.
            // We need to check with wRoom.size()
            nPlayers = room.clients.player.size();
            if (nPlayers) {
                // If there are some players left out of the matching, notify
                // them that they have to wait more.
                wRoom.each(function(p) {
                    node.say('waitingRoom', p.id, {
                        poolSize: POOL_SIZE,
                        nPlayers: nPlayers,
                        retry: true
                    });
                });
            }
        });

    });

    // This function will be executed once node.game.gameover() is called.
    stager.setOnGameOver(function () {
        console.log('^^^^^^^^^^^^^^^^GAME OVER^^^^^^^^^^^^^^^^^^');
    });

    // Defining the game structure:
    // - init: must always be there. It corresponds to the `setOnInit` function.
    // - loop: without a second argument, loops forever on the same function.
    // Other possibilities are: .next(), .repeat(), .gameover().
    // @see node.Stager
    stager
        .init()
        .loop('waiting');

    // Returns all the information about this waiting room.
    return {
        nodename: 'wroom',
        game_metadata: {
            name: 'wroom',
            version: '0.1.0'
        },
        game_settings: {
            publishLevel: 0
        },
        plot: stager.getState(),
        // If debug is true, the ErrorManager will throw errors 
        // also for the sub-rooms.
        debug: settings.DEBUG,
        verbosity: 0,
        publishLevel: 2
    };
};