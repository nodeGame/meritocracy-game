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
    else if (settings.AUTH === 'LOCAL') {
        dk.readCodes(codesNotFound);
    }

    var treatment = gameRoom.group;

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

    node.on.data('questionnaire', function(e) {
        var saveObject = {
            from: e.from,
            created: e.created,
            id: e.id,
            session: e.session,
            additionalComments: e.data.comments,
            participationSocExp: e.data.socExp,
            suggestedGameName: e.data.gameName,
            strategyChoice: e.data.stratChoice,
            strategyComments: e.data.strategyComments,
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

        // Number of required players.

        // "STEPPING" is the last event emitted before the stage is updated.
        node.on('STEPPING', function() {
            var currentStage, db, p, gain;

            currentStage = node.game.getCurrentGameStage();

            // We do not save stage 0.0.0. 
            // Morever, If the last stage is equal to the current one, we are
            // re-playing the same stage cause of a reconnection. In this
            // case we do not update the database, or save files.
            if (!GameStage.compare(currentStage, new GameStage())) {
                return;
            }
            // Update last stage reference.
            node.game.lastStage = currentStage;

            db = node.game.memory.stage[currentStage];

            if (db && db.size()) {
                try {
                    // Saving results to FS.
                    node.fs.saveMemory('csv', DUMP_DIR + 'memory_' + currentStage +
                                       '.csv', { flags: 'w' }, db);
                    node.fs.saveMemory('json', DUMP_DIR + 'memory_' + currentStage +
                                       '.nddb', null, db);        

                    console.log('Round data saved ', currentStage);
                }
                catch(e) {
                    console.log('OH! An error occurred while saving: ',
                                currentStage);
                }
            }
      
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
                session: gameRoom.name,
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
                session: gameRoom.name,
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
            
            delete node.game.memory.stage[node.game.getCurrentGameStage()];

            dk.updateCode(p.id, {
                disconnected: true,
                stage: p.stage
            });
        });


        // Reconnections must be handled by the game developer.
        node.on.preconnect(function(p) {
             var code;
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
            
            // Mark code as connected.
            code.disconnected = false;

            // Delete countdown to terminate the game.
            clearTimeout(this.countdown);

            // Clear any message in the buffer from.
            node.remoteCommand('erase_buffer', 'ALL');

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

            // Start the game on the reconnecting client.
            node.remoteCommand('start', p.id);
            // Pause the game on the reconnecting client, will be resumed later.
            // node.remoteCommand('pause', p.id);

            // It is not added automatically.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.add(p);

            // Will send all the players to current stage
            // (also those who were there already).
            node.game.gotoStep(node.player.stage);
            
            setTimeout(function() {
                // Pause the game on the reconnecting client, will be resumed later.
                // node.remoteCommand('pause', p.id);
                // Unpause ALL players
                // TODO: add it automatically if we return TRUE? It must be done
                // both in the alias and the real event handler
                node.game.pl.each(function(player) {
                    if (player.id !== p.id) {
                        node.remoteCommand('resume', player.id);
                    }
                });
                // The logic is also reset to the same game stage.
            }, 100);
            // Unpause ALL players
            // node.remoteCommand('resume', 'ALL');
        });

        console.log('init');
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

    function notEnoughPlayers() {
        console.log('Warning: not enough players!!');

        this.countdown = setTimeout(function() {
            console.log('Countdown fired. Going to Step: questionnaire.');
            node.remoteCommand('resume', 'ALL');
            // if syncStepping = false
            //node.remoteCommand('goto_step', 5);
            node.game.gotoStep(new GameStage('5'));
        }, 30000);
    }

    // Set default step rule.
    stager.setDefaultStepRule(stepRules.OTHERS_SYNC_STEP);

    // Adding the stages. We can later on define the rules and order that
    // will determine their execution.
    stager.addStage({
        id: 'precache',
        cb: precache,
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions,
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz,
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStep({
        id: 'bid',
        cb: function() {
            console.log('bid');
            return true;
        },
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStep({
        id: 'results',
        cb: function() {
            // Computes the values for all players and all groups,
            // sends them to the clients, and save results into database.
            treatments[treatment].sendResults();
            return true;
        },
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
    });

    stager.addStage({
        id: 'meritocracy',
        steps: ['bid', 'results'],
        minPlayers: [nbRequiredPlayers, notEnoughPlayers]
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