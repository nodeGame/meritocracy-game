/**
 * # Logic code for Meritocracy Game
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

var path = require('path');
var fs   = require('fs-extra');

var Database = require('nodegame-db').Database;

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var GameStage = ngc.GameStage;
var J = ngc.JSUS;


module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var dk = require('descil-mturk')();

    var EXCHANGE_RATE = settings.EXCHANGE_RATE;

    // Variable registered outside of the export function are shared among all
    // instances of game logics.
    var counter = settings.SESSION_ID;

    // Group names.
    var groupNames = settings.GROUP_NAMES;

    var DUMP_DIR, DUMP_DIR_JSON, DUMP_DIR_CSV;
    var ngdb, mdb;

    var treatments;
    var client;
    var nbRequiredPlayers;

    // Preparing storage: FILE or MONGODB.
    if (settings.DB === 'FILE') {
        DUMP_DIR = channel.getGameDir() + '/data/' + counter + '/';
        DUMP_DIR_JSON = DUMP_DIR + 'json/';
        DUMP_DIR_CSV = DUMP_DIR + 'csv/';

        // Recursively create directories..
        fs.mkdirsSync(DUMP_DIR_JSON);
        fs.mkdirsSync(DUMP_DIR_CSV);
    }
    else {

        ngdb = new Database(node);
        mdb = ngdb.getLayer('MongoDB', {
            dbName: 'meritocracy_db',
            collectionName: 'user_data'
        });

        mdb.connect(function() {});

        node.on.data('questionnaire', function(msg) {
            var saveObject = {
                session: node.nodename,
                condition: treatmentName,
                stage: msg.stage,
                player: msg.from,
                created: msg.created,
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
                condition: treatmentName,
                stage: msg.stage,
                player: msg.from,
                created: msg.created,
                quiz: msg.data
            };
            mdb.store(saveObject);
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
                condition: treatmentName,
                stage: currentStage,
                player: p.player,
                group: p.group,
                contribution: p.contribution,
                demand: null === p.demand ? "NA" : p.demand,
                noisyContribution: noisyContribution,
                payoff: payoff,
                groupAvgContr: finalGroupStats.avgContr,
                groupStdContr: finalGroupStats.stdContr,
                groupAvgDemand: finalGroupStats.avgDemand,
                groupStdDemand: finalGroupStats.stdDemand,
                rankBeforeNoise: ranking.indexOf(p.id) + 1,
                rankAfterNoise: noisyRanking.indexOf(p.id) + 1,
                timeup: p.isTimeOut
            });
        };

        node.game.saveRoundResults = function(ranking, groupStats,
                                              noisyRanking, noisyGroupStats) {
            mdb.store({
                session: node.nodename,
                condition: treatmentName,
                ranking: ranking,
                noisyRanking: noisyRanking,
                groupAverages: groupStats,
                noisyGroupAverages: noisyGroupStats
            });
        };
    }


    // Outgoing messages will be saved.
    node.socket.journalOn = true;

    // Players required to be connected at the same (NOT USED).
    nbRequiredPlayers = gameRoom.runtimeConf.MIN_PLAYERS;

    // Require treatments file.
    treatments = channel.require(__dirname + '/includes/treatments.js', {
        node: node,
        settings: settings,
        dk: dk
    }, true);

    stager.setDefaultProperty('minPlayers', [ gameRoom.game.waitroom.GROUP_SIZE ]);

    // Event handler registered in the init function are always valid.
    stager.setOnInit(function() {
        console.log('********************** meritocracy room ' + counter++);

        // Keep tracks of results sent to players in case of disconnections.
        node.game.savedResults = {};

        // "STEPPING" is the last event emitted before the stage is updated.
        node.on('STEPPING', function() {
            var currentStage, db, file;

            currentStage = node.game.getCurrentGameStage();

            if (settings.DB === 'FILE') {
                // We do not save stage 0.0.0.
                // Morever, If the last stage is equal to the current one,
                // we are re-playing the same stage cause of a reconnection.
                // In this case we do not update the database, or save files.
                if (!GameStage.compare(currentStage, new GameStage())) {
                    return;
                }
                // Update last stage reference.
                node.game.lastStage = currentStage;

                db = node.game.memory.stage[currentStage];

                if (db && db.size()) {
                    try {
                        file = DUMP_DIR + 'memory_' + currentStage;

                        // Saving results to FS.
                        db.save(file + '.csv', { flags: 'w' });
                        db.save(file + '.json');

                        console.log('Round data saved ', currentStage);
                    }
                    catch(e) {
                        console.log('OH! An error occurred while saving: ',
                                    currentStage, ' ', e);
                    }
                }
            }

            console.log(node.nodename, ' - Round:  ', currentStage);
        });

        // Add session name to data in DB.
        node.game.memory.on('insert', function(o) {
            o.session = node.nodename;
        });

//         // Register player disconnection, and wait for him...
//         node.on.pdisconnect(function(p) {
//             console.log('Warning: one player disconnected! ', p.id);
//
//             channel.registry.updateClient(p.id, {
//                 disconnected: true,
//                 stage: p.stage
//             });
//
//             // We don't care in the questionnaire
//             if (node.game.getCurrentGameStage().stage < 5) {
//
//                 // If we do not have other disconnected players,
//                 // start the procedure.
//                 if (!J.size(node.game.disconnected)) {
//                     node.say('notEnoughPlayers', 'ALL');
//
//                     this.countdown = setTimeout(function() {
//                         var i;
//                         console.log('Countdown fired. Player/s did not reconnect.');
//                         for (i in node.game.disconnected) {
//                             if (node.game.disconnected.hasOwnProperty(i)) {
//                                 channel.registry.updateClient(i, {
//                                     kickedOut: true
//                                 });
//                             }
//                         }
//                         // Clear list of temporarily disconnected players.
//                         node.game.disconnected = {};
//
//                         node.remoteCommand('resume', 'ALL');
//                     }, 30000);
//                 }
//             }
//
//             // delete node.game.memory.stage[node.game.getCurrentGameStage()];
//             node.game.disconnected[p.id] = '';
//         });
//
//
//         // Reconnections must be handled by the game developer.
//         node.on.preconnect(function(p) {
//             var code, curStage, state, i, len;
//
//             console.log('Oh...somebody reconnected!', p);
//             code = channel.registry.getClient(p.id);
//
//             if (!code) {
//                 console.log('game.logic: reconnecting player not found in ' +
//                             'code db: ' + p.id);
//                 return;
//             }
//             if (!code.disconnected) {
//                 console.log('game.logic: reconnecting player that was not ' +
//                             'marked disconnected: ' + p.id);
//                 return;
//             }
//
//             if (code.kickedOut) {
//                 node.redirect('html/disconnected.htm', code);
//                 console.log('game.logic: kicked out player tried to ' +
//                             'reconnect: ' + p.id);
//                 return;
//             }
//
//             curStage = node.game.getCurrentGameStage();
//
//             delete node.game.disconnected[p.id];
//
//             // If all disconnected players reconnected...
//             if (!J.size(node.game.disconnected)) {
//                 // Delete countdown game.
//                 clearTimeout(this.countdown);
//             }
//
//             // Mark code as connected.
//             code.disconnected = false;
//
//
//             // Clear any message in the buffer from.
//             // node.remoteCommand('erase_buffer', 'ALL');
//
//             // Notify other player he is back.
//             // TODO: add it automatically if we return TRUE? It must be done
//             // both in the alias and the real event handler
//             node.game.pl.each(function(player) {
//                 node.socket.send(node.msg.create({
//                     target: 'PCONNECT',
//                     data: p,
//                     to: player.id
//                 }));
//             });
//
//             // Send currently connected players to reconnecting.
//             node.socket.send(node.msg.create({
//                 target: 'PLIST',
//                 data: node.game.pl.db,
//                 to: p.id
//             }));
//
//             // We could slice the game plot, and send just what we need
//             // however here we resend all the stages, and move their game plot.
//             console.log('** Player reconnected: ' + p.id + ' **');
//             // Setting metadata, settings, and plot.
//             node.remoteSetup('game_metadata',  p.id, client.metadata);
//             node.remoteSetup('game_settings', p.id, client.settings);
//             node.remoteSetup('plot', p.id, client.plot);
//             node.remoteSetup('env', p.id, client.env);
//             node.remoteSetup('env', p.id, {
//                 treatment: treatmentName
//             });
//
//
//             // It is not added automatically.
//             // TODO: add it automatically if we return TRUE? It must be done
//             // both in the alias and the real event handler
//             node.game.pl.add(p);
//
//             // Do something.
//             // Resend state to connected player.
//             // node.remoteCommand('goto_step', p.id, curStage);
//
//             // Start the game on the reconnecting client.
//             node.remoteCommand('start', p.id, {
//                 startStage: node.game.plot.previous(curStage)
//             });
//
//             state = node.socket.journal.stage[curStage];
//
//             if (state && state.size()) {
//                 state = state.selexec('to', '=', p.id).fetch();
//
//                 if (state) {
//                     i = -1, len = state.length;
//                     for ( ; ++i < len ; ) {
//                         node.socket.send(state[i]);
//                     }
//                 }
//             }
//
//             // If all disconnected players reconnected...
//             if (!J.size(node.game.disconnected)) {
//
//                 // Will send all the players to current stage
//                 // (also those who were there already).
//                 // node.game.gotoStep(node.player.stage);
//
//
//                 // Unpause ALL players
//                 // TODO: add it automatically if we return TRUE? It must be done
//                 // both in the alias and the real event handler
//                 node.game.pl.each(function(player) {
//                     if (player.id !== p.id) {
//                         node.remoteCommand('resume', player.id);
//                     }
//                 });
//             }
//             else {
//                 node.say('notEnoughPlayers', p.id);
//             }
//             console.log('init');
//         });

    });

    // Extends Stages and Steps where needed.

    stager.extendStep('results', {
        init: function() {
            this.savedResults = {};
        },
        cb: function() {
            // Computes the values for all players and all groups,
            // sends them to the clients, and save results into database.
            treatments[treatmentName].sendResults();
            return true;
        },
        // Callback executed when a clients reconnects.
        reconnect: function(p) {
            setTimeout(function() {
                // Send results (make sure that client is ready).
                node.say('results', p.id, node.game.savedResults[p.id]);                
            }, 200);
        }
    });

    stager.extendStep('end', {
        cb: function() {
            var code, exitcode, accesscode;
            var bonusFile, bonus, csvString;

            console.log('endgame');

            bonusFile = DUMP_DIR + 'bonus.csv';

            console.log('FINAL PAYOFF PER PLAYER');
            console.log('***********************');

            bonus = node.game.pl.map(function(p) {
                code = channel.registry.getClient(p.id);
                if (!code) {
                    console.log('ERROR: no code in endgame:', p.id);
                    return ['NA', 'NA'];
                }

                accesscode = code.AccessCode;
                exitcode = code.ExitCode;

                code.win =  Number((code.win || 0) / EXCHANGE_RATE).toFixed(2);
                code.win = parseFloat(code.win, 10);

                // TODO. Improve this.
                if (settings.auth === 'MTURK') {
                    dk.checkOut(accesscode, exitcode, code.win);
                }

                channel.registry.checkOut(p.id);

                node.say('WIN', p.id, {
                    win: code.win,
                    exitcode: code.ExitCode
                });

                console.log(p.id, ': ',  code.win, code.ExitCode);
                return [
                    p.id, code.ExitCode, code.win, node.game.gameTerminated
                ];
            });

            console.log('***********************');
            console.log('Game ended');


            bonus = [["access", "exit", "bonus", "terminated"]].concat(bonus);
            csvString = bonus.join("\r\n");
            fs.writeFile(bonusFile, csvString, function(err) {
                if (err) {
                    console.log('ERROR: could not save the bonus file: ',
                                DUMP_DIR + 'bonus.csv');
                    console.log(err);
                }
            });
        }
    });

    return {
        nodename: 'lgc' + counter,
        plot: stager.getState()
    };

};
