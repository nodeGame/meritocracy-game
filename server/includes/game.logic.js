/**
 * # Logic code for Meritocracy Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Info:
 * Matching, and stepping can be done in different ways. It can be
 * centralized, and the logic tells the clients when to step, or
 * clients can synchronize themselves and step automatically.
 *
 * In this game, the logic is synchronized with the clients. The logic
 * will send automatically game-commands to start and step
 * through the game plot whenever it enters a new game step.
 *
 * http://www.nodegame.org
 * ---
 */

var path = require('path');

var Database = require('nodegame-db').Database;

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var GameStage = ngc.GameStage;
var J = ngc.JSUS;

var stager = new Stager();

// Variable registered outside of the export function are shared among all
// instances of game logics.
var counter = 0;

var settings = require(__dirname + '/game.shared.js');

var EXCHANGE_RATE = settings.EXCHANGE_RATE;

// Variable registered outside of the export function are shared among all
// instances of game logics.
var counter = settings.SESSION_ID;

// Group names.
var groupNames = settings.GROUP_NAMES;

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running. 
module.exports = function(node, channel, gameRoom) {

    var DUMP_DIR, DUMP_DIR_JSON, DUMP_DIR_CSV;
    DUMP_DIR = path.resolve(__dirname, '..', 'data') + '/' + counter + '/';
    DUMP_DIR_JSON = DUMP_DIR + 'json/';
    DUMP_DIR_CSV = DUMP_DIR + 'csv/';

    // Recursively create directories, sub-trees and all.
    J.mkdirSyncRecursive(DUMP_DIR_JSON, 0777);
    J.mkdirSyncRecursive(DUMP_DIR_CSV, 0777);

    console.log(gameRoom.runtimeConf);
    console.log('=====================');

    // outgoing messages will be saved.
    node.socket.journalOn = true;

    var nbRequiredPlayers = gameRoom.runtimeConf.MIN_PLAYERS;

    // Client game to send to reconnecting players.
    var client = channel.require(__dirname + '/game.client', { ngc: ngc });
    
    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, '..', 'descil.conf.js');
    var dk = require('descil-mturk')(confPath);

    function codesNotFound() {
        if (!dk.codes.size()) {
            throw new Error('game.logic: no codes found.');
        }
    }

    if (settings.AUTH === 'MTURK') {
        dk.getCodes(codesNotFound);
    }
    else {
        dk.readCodes(codesNotFound);
    }

    var treatment = gameRoom.group;

    // Not so nice. We need to delete the cache, because treatments is
    // using an old node object otherwise.
    // TODO: find a better way.
    // See http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
    delete require.cache[require.resolve(__dirname + '/treatments.js')]
    var treatments = channel.require(__dirname + '/treatments.js', {
        node: node,
        treatment: treatment,
        groupNames: groupNames,
        dk: dk,
        SUBGROUP_SIZE: gameRoom.runtimeConf.SUBGROUP_SIZE
    });

    var ngdb = new Database(node);
    var mdb = ngdb.getLayer('MongoDB', {
        dbName: 'meritocracy_db',
        collectionName: 'user_data'
    });

    mdb.connect(function() {});

    node.on.data('questionnaire', function(msg) {
        var saveObject = {
            session: node.nodename,
            condition: treatment,
            stage: currentStage,
            player: msg.from,
            created: e.created,
            gameName: msg.data.gameName,
            additionalComments: msg.data.comments,
            alreadyParticipated: msg.data.socExp,
            strategyChoice: msg.data.stratChoice,
            strategyComments: msg.data.stratComment
        };
        mdb.store(saveObject);
    });

    node.on.data('QUIZ', function(msg) {
        var saveObject = {
            session: node.nodename,
            condition: treatment,
            stage: msg.stage,
            player: msg.from,
            created: msg.created,
            quiz: msg.data
        };
        mdb.store(saveObject);
    });

    node.on.data('timestep', function(msg) {
        var saveObject = {
            session: node.nodename,
            condition: treatment,
            stage: msg.stage,
            player: msg.from,
            timeElapsed: msg.data.time,
            timeup: msg.data.timeup
        };
        mdb.store(saveObject);
    });

    function doMatch() {
        var g, bidder, respondent, data_b, data_r;

        g = node.game.pl.shuffle();
        bidder = g.first();
        respondent = g.last();

        data_b = {
            role: 'bidder',
            other: respondent.id
        };
        data_r = {
            role: 'respondent',
            other: bidder.id
        };
        // Send a message to each player with their role
        // and the id of the other player.
        node.say('BIDDER', bidder.id, data_b);
        node.say('RESPONDENT', respondent.id, data_r);
        console.log('Matching completed.');
    }

    // Event handler registered in the init function are always valid.
    stager.setOnInit(function() {
        console.log('********************** meritocracy room ' + counter+++' **********************');


        
        // Players that disconnected temporarily.
        node.game.disconnected = {};

        // "STEPPING" is the last event emitted before the stage is updated.
        node.on('STEPPING', function() {
            var currentStage, db, p, gain;

            currentStage = node.game.getCurrentGameStage();

//            // We do not save stage 0.0.0. 
//            // Morever, If the last stage is equal to the current one, we are
//            // re-playing the same stage cause of a reconnection. In this
//            // case we do not update the database, or save files.
//            if (!GameStage.compare(currentStage, new GameStage())) {
//                return;
//            }
//            // Update last stage reference.
//            node.game.lastStage = currentStage;
// 
//            db = node.game.memory.stage[currentStage];
// 
//            if (db && db.size()) {
//                try {
//                    // Saving results to FS.
//                    node.fs.saveMemory('csv', DUMP_DIR + 'memory_' + currentStage +
//                                       '.csv', { flags: 'w' }, db);
//                    node.fs.saveMemory('json', DUMP_DIR + 'memory_' + currentStage +
//                                       '.nddb', null, db);        
// 
//                    console.log('Round data saved ', currentStage);
//                }
//                catch(e) {
//                    console.log('OH! An error occurred while saving: ',
//                                currentStage);
//                }
//            }
            
            console.log(node.nodename, ' - Round:  ', currentStage);
        });

        node.game.savePlayerValues = function(p, payoff, positionInNoisyRank,
            ranking, noisyRanking,
            groupStats,
            currentStage) {

            var noisyContribution, finalGroupStats;

            noisyContribution = 'undefined' === typeof p.noisyContribution ?
                'NA' : p.noiseContribution;

            finalGroupStats = groupStats[groupNames[positionInNoisyRank[0]]];

            mdb.store({
                session: node.nodename,
                condition: treatment,
                stage: currentStage,
                player: p.player,
                group: p.group,
                contribution: p.value.contribution,
                demand: null === p.value.demand ? "NA" : p.value.demand,
                noisyContribution: noisyContribution,
                payoff: payoff,
                groupAvgContr: finalGroupStats.avgContr,
                groupStdContr: finalGroupStats.stdContr,
                groupAvgDemand: finalGroupStats.avgDemand,
                groupStdDemand: finalGroupStats.stdDemand,
                rankBeforeNoise: ranking.indexOf(p.id) + 1,
                rankAfterNoise: noisyRanking.indexOf(p.id) + 1,
                timeup: p.value.isTimeOut
            });
        };

        node.game.saveRoundResults = function(ranking, groupStats,
            noisyRanking, noisyGroupStats) {
            mdb.store({
                session: node.nodename,
                condition: treatment,
                ranking: ranking,
                noisyRanking: noisyRanking,
                groupAverages: groupStats,
                noisyGroupAverages: noisyGroupStats
            });
        };

// THIS WAS HERE BEFORE: delete if not needed.
//         node.game.memory.on('insert', function(data) {
//             data.group = node.game.pl.selexec('id', '=', data.player).first().group;
//         });

        // Add session name to data in DB.
        node.game.memory.on('insert', function(o) {
            o.session = node.nodename;
        });

        // Register player disconnection, and wait for him...
        node.on.pdisconnect(function(p) {
            console.log('Warning: one player disconnected! ', p.id);

            dk.updateCode(p.id, {
                disconnected: true,
                stage: p.stage
            });
               
            // We don't care in the questionnaire
            if (node.game.getCurrentGameStage().stage < 5) {

                // If we do not have other disconnected players, 
                // start the procedure.
                if (!J.size(node.game.disconnected)) {
                    node.say('notEnoughPlayers', 'ALL');        
                    
                    this.countdown = setTimeout(function() {
                        var i;
                        console.log('Countdown fired. Player/s did not reconnect.');
                        lostPlayers = 0;
                        for (i in node.game.disconnected) {
                            if (node.game.disconnected.hasOwnProperty(i)) {
                                dk.updateCode(i, {
                                    kickedOut: true
                                });
                            }
                        }
                        // Clear list of temporarily disconnected players.
                        node.game.disconnected = {};

                        node.remoteCommand('resume', 'ALL');
                    }, 30000);
                }
            }

            // delete node.game.memory.stage[node.game.getCurrentGameStage()];
            node.game.disconnected[p.id] = '';
        });


        // Reconnections must be handled by the game developer.
        node.on.preconnect(function(p) {
            var code, curStage, state, i, len;

            console.log('Oh...somebody reconnected!', p);
            code = dk.codeExists(p.id);

            if (!code) {
                console.log('game.logic: reconnecting player not found in ' +
                            'code db: ' + p.id);
                return;
            }
            if (!code.disconnected) {
                console.log('game.logic: reconnecting player that was not ' +
                            'marked disconnected: ' + p.id);
                return;
            }

            if (code.kickedOut) {
                node.redirect('html/disconnected.htm', code);
                console.log('game.logic: kicked out player tried to ' + 
                            'reconnect: ' + p.id);
                return;
            }

            curStage = node.game.getCurrentGameStage();

            delete node.game.disconnected[p.id];

            // If all disconnected players reconnected...
            if (!J.size(node.game.disconnected)) {
                // Delete countdown game.
                clearTimeout(this.countdown);
            }

            // Mark code as connected.
            code.disconnected = false;

            
            // Clear any message in the buffer from.
            // node.remoteCommand('erase_buffer', 'ALL');

            // Notify other player he is back.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.each(function(player) {                
                node.socket.send(node.msg.create({
                    target: 'PCONNECT',
                    data: p,
                    to: player.id
                }));
            });
            
            // Send currently connected players to reconnecting.
            node.socket.send(node.msg.create({
                target: 'PLIST',
                data: node.game.pl.db,
                to: p.id
            }));

            // We could slice the game plot, and send just what we need
            // however here we resend all the stages, and move their game plot.
            console.log('** Player reconnected: ' + p.id + ' **');
	    // Setting metadata, settings, and plot.
            node.remoteSetup('game_metadata',  p.id, client.metadata);
	    node.remoteSetup('game_settings', p.id, client.settings);
	    node.remoteSetup('plot', p.id, client.plot);
            node.remoteSetup('env', p.id, client.env);
            node.remoteSetup('env', p.id, {
                treatment: node.env('roomType')
            });


            // It is not added automatically.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.add(p);

            // Do something.
            // Resend state to connected player.
            // node.remoteCommand('goto_step', p.id, curStage);
            
            // Start the game on the reconnecting client.
            node.remoteCommand('start', p.id, {
                startStage: node.game.plot.previous(curStage)
            });

            state = node.socket.journal.stage[curStage];
            
            if (state && state.size()) {
                state = state.selexec('to', '=', p.id).fetch();

                if (state) {
                    i = -1, len = state.length;
                    for ( ; ++i < len ; ) {
                        node.socket.send(state[i]);
                    }
                }
            }

            // If all disconnected players reconnected...
            if (!J.size(node.game.disconnected)) {

                // Will send all the players to current stage
                // (also those who were there already).
                // node.game.gotoStep(node.player.stage);
            

                // Unpause ALL players
                // TODO: add it automatically if we return TRUE? It must be done
                // both in the alias and the real event handler
                node.game.pl.each(function(player) {
                    if (player.id !== p.id) {
                        node.remoteCommand('resume', player.id);
                    }
                });                
            }
            else {
                node.say('notEnoughPlayers', p.id);
            }
            console.log('init');
        });
    });

    // Event handler registered in the init function are always valid.
    stager.setOnGameOver(function() {
        console.log('************** GAMEOVER ' + gameRoom.name + '****************');
        // TODO: update database.
        channel.destroyGameRoom(gameRoom.name);
    });

    // Game Types Objects definition

    // Functions
    function precache() {
        console.log('Pre-Cache');
    }

    function instructions() {
        // debugger
        console.log('Instructions');
    }

    function quiz() {
        console.log('Quiz');
    }

    function meritocracy() {
        // debugger
        console.log('Ultimatum');
        doMatch();
    }

    function questionnaire() {
        console.log('questionnaire');
    }

    function endgame() {
        var code, exitcode, accesscode;
        var bonusFile, bonus;

        console.log('endgame');
        
        bonusFile = DUMP_DIR + 'bonus.csv';

        console.log('FINAL PAYOFF PER PLAYER');
        console.log('***********************');

        bonus = node.game.pl.map(function(p) {
            // debugger
            code = dk.codes.id.get(p.id);
            if (!code) {
                console.log('ERROR: no code in endgame:', p.id);
                return ['NA', 'NA'];
            }

            accesscode = code.AccessCode;
            exitcode = code.ExitCode;

            code.win =  Number((code.win || 0) / EXCHANGE_RATE).toFixed(2);
            code.win = parseFloat(code.win, 10);

            dk.checkOut(accesscode, exitcode, code.win);

	    node.say('WIN', p.id, {
                win: code.win,
                exitcode: code.ExitCode
            });

            console.log(p.id, ': ',  code.win, code.ExitCode);
            return [p.id, code.ExitCode, code.win, node.game.gameTerminated];
        });

        console.log('***********************');
        console.log('Game ended');

        try {
            node.fs.writeCsv(bonusFile, bonus, {
                headers: ["access", "exit", "bonus", "terminated"]
            });
        } 
        catch(e) {
            console.log('ERROR: could not save the bonus file: ', 
                        DUMP_DIR + 'bonus.csv');
        }
    }

    // Set default step rule.
    stager.setDefaultStepRule(stepRules.OTHERS_SYNC_STEP);

    // Adding the stages. We can later on define the rules and order that
    // will determine their execution.
    stager.addStage({
        id: 'precache',
        cb: precache,
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions,
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz,
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStep({
        id: 'bid',
        cb: function() {
            console.log('bid');
            return true;
        },
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStep({
        id: 'results',
        cb: function() {
            // Computes the values for all players and all groups,
            // sends them to the clients, and save results into database.
            treatments[treatment].sendResults();
            return true;
        },
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'meritocracy',
        steps: ['bid', 'results'],
        // minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'questionnaire',
        cb: questionnaire
    });

    stager.addStage({
        id: 'endgame',
        cb: endgame
    });

    // Building the game plot.

    // Here we define the sequence of stages of the game (game plot).
    stager
        .init()
        .next('precache')
        .next('instructions')
        .next('quiz')
        .repeat('meritocracy', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
    .gameover();

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        game_metadata: {
            name: 'meritocracy',
            version: '0.0.1'
        },
        game_settings: {
            // Will not publish any update of stage / stageLevel, etc.
            publishLevel: 0,
            // Will send a start / step command to ALL the clients when
            // the logic will start / step through the game.
            // This option requires that the game plots of the clients
            // and logic are symmetric or anyway compatible.
            syncStepping: true
        },
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),
        // If debug is false (default false), exception will be caught and
        // and printed to screen, and the game will continue.
        debug: settings.DEBUG,
        // Controls the amount of information printed to screen.
        verbosity: 0,
        // nodeGame enviroment variables.
        env: {
            auto: settings.AUTO
        }
    };

};