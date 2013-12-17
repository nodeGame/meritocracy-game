/**
 * # Logic code for Ultimatum Game
 * Copyright(c) 2013 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
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
// Variable _node_ is shared by the requiring module
// (game.room.js) through `channel.require` method.
var ngdb = new Database(module.parent.exports.node);
var mdb = ngdb.getLayer('MongoDB', {
    dbName: 'meritocracy_db',
    collectionName: 'user_data'
});
mdb.connect(function() {});
// debugger;
// 
var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var GameStage = ngc.GameStage;
var J = ngc.JSUS;

var stager = new Stager();

// Variable registered outside of the export function are shared among all
// instances of game logics.
var counter = 0;
var MIN_PLAYERS = 2;
var PLAYING_STAGE = 2;

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running. 
module.exports = function(node, channel, gameRoom) {

    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, '..', 'descil.conf.js');
    var dk = require('descil-mturk')(confPath);
    //    dk.getCodes(function() {
    //        if (!dk.codes.size()) {
    //            throw new Error('game.logic: no codes found.');
    //        }
    //    });
    dk.readCodes(function() {
        if (!dk.codes.size()) {
            throw new Errors('requirements.room: no codes found.');
        }
    });

    function savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking) {
        var rank = ranking.indexOf(p.id) + 1,
            noiseRank = noiseRanking.indexOf(p.id) + 1;
        mdb.store({
            player: p.id,
            group: p.group,
            contribution: playersBars[0][0],
            demand: playersBars[0][1],
            payoff: payoff,
            stage: currentStage,
            sameGroupValues: playersBars,
            groupAverage: groupsBars[0],
            groupValues: groupValues,
            timeup: timeup,
            rank: rank,
            noiseRank: noiseRank,
            playersRanking: ranking,
            playersRankingNoise: noiseRanking,
            nodename: node.nodename,
            condition: node.game.roomType,
        });
    }

    var gauss = (function() {
        var space = null;
        return function(mu, sigma) {
            var result = 0.0,
                U = 0.0,
                V = 0.0,
                S = 0.0,
                M;
            if (space === null) {
                while (true) {
                    U = Math.random() * 2 - 1; // [0, 2) -> (-1, 2]
                    V = Math.random() * 2 - 1;
                    S = U * U + V * V;
                    if (S < 1 || S !== 0) {
                        break;
                    }
                }
                if (S < 1) {
                    M = Math.sqrt(-2.0 * Math.log(S) / S);
                } else {
                    M = Math.sqrt(2.0 * Math.log(S) / S);
                }
                space = V * M;
                result = mu + sigma * M * U;
            } else {
                result = space * sigma + mu;
                space = null;
            }
            return result;
        };
    })();

    // var gauss = function(mu, sigma) {
    //     var interval_low = -1.0,
    //         interval_high = 1.0,
    //         step = 0.001,
    //         SIZE = parseInt(parseInt(interval_high - interval_low) / step),
    //         numbers = [],
    //         result;
    //     for (var i = 0; i < SIZE; i++) {
    //         result = Math.exp(-Math.pow(interval_low + (i * step) - mu, 2) / (2 * Math.pow(sigma, 2)));
    //         result = (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * result;
    //         numbers.push(result);
    //     }
    //     return numbers;
    // };
    // 
    // function NormSInv(p) {
    //     var a1 = -39.6968302866538,
    //         a2 = 220.946098424521,
    //         a3 = -275.928510446969;
    //     var a4 = 138.357751867269,
    //         a5 = -30.6647980661472,
    //         a6 = 2.50662827745924;
    //     var b1 = -54.4760987982241,
    //         b2 = 161.585836858041,
    //         b3 = -155.698979859887;
    //     var b4 = 66.8013118877197,
    //         b5 = -13.2806815528857,
    //         c1 = -7.78489400243029E-03;
    //     var c2 = -0.322396458041136,
    //         c3 = -2.40075827716184,
    //         c4 = -2.54973253934373;
    //     var c5 = 4.37466414146497,
    //         c6 = 2.93816398269878,
    //         d1 = 7.78469570904146E-03;
    //     var d2 = 0.32246712907004,
    //         d3 = 2.445134137143,
    //         d4 = 3.75440866190742;
    //     var p_low = 0.02425,
    //         p_high = 1 - p_low;
    //     var q, r;
    //     var retVal;

    //     if ((p < 0) || (p > 1)) {
    //         alert("NormSInv: Argument out of range.");
    //         retVal = 0;
    //     } else if (p < p_low) {
    //         q = Math.sqrt(-2 * Math.log(p));
    //         retVal = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    //     } else if (p <= p_high) {
    //         q = p - 0.5;
    //         r = q * q;
    //         retVal = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    //     } else {
    //         q = Math.sqrt(-2 * Math.log(1 - p));
    //         retVal = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    //     }

    //     return retVal;
    // }

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

        node.game.roomType = gameRoom.group;

        var disconnected;
        disconnected = {};

        node.game.groupNames = ['einstein', 'knuth', 'turing', 'feynmann'];
        node.game.memory.on('insert', function(data) {
            data.group = node.game.pl.selexec('id', '=', data.player).first().group;
        });

        // Reconnections must be handled by the game developer.
        node.on.preconnect(function(p) {
            console.log('Oh...somebody reconnected!', p);
            if (disconnected[p.id]) {
                // Delete countdown to terminate the game.
                clearTimeout(this.countdown);
                // Notify other player he is back.
                node.socket.send(node.msg.create({
                    target: 'PCONNECT',
                    data: p,
                    to: 'ALL'
                }));
                delete disconnected[p.id];
            } else {
                // Player was not authorized, redirect to a warning page.
                node.redirect('/meritocracy/unauth.htm', p.id);
            }

        });

        // Register player disconnection, and wait for him...
        node.on.pdisconnect(function(p) {
            disconnected[p.id] = {
                id: p.id,
                stage: p.stage
            };
        });

        // Update the Payoffs
        node.on.data('response', function(msg) {
            var resWin, bidWin, code, response;
            response = msg.data;

            if (!response) {
                // TODO handle error.
                return;
            }

            if (response.response === 'ACCEPT') {
                resWin = parseInt(response.value);
                bidWin = 100 - resWin;

                // Respondent payoff.
                code = dk.codes.id.get(msg.from);
                if (!code) {
                    console.log('AAAH code not found!');
                    return;
                }

                code.win = (!code.win) ? resWin : code.win + resWin;
                console.log('Added to respondent ' + msg.from + ' ' +
                    response.value + ' ECU');

                // Bidder payoff
                code = dk.codes.id.get(response.from);

                if (!code) {
                    console.log('AAAH code not found for respondent 2!');
                    return;
                }

                code.win = (!code.win) ? bidWin : code.win + bidWin;
                console.log('Added to bidder ' + response.from + ' ' +
                    bidWin + ' ECU');
            }
        });

        console.log('init');
    });

    // Event handler registered in the init function are always valid.
    stager.setOnGameOver(function() {
        console.log('************** GAMEOVER ' + gameRoom.name + '****************');
        // TODO: update database.
        channel.destroyGameRoom(gameRoom.name);
    });

    // Game Types Objects

    node.game.blackbox = {
        getGroupValues: function(receivedData) {
            var groupValues = {},
                averageContribution,
                averageDemand,
                group,
                name,
                groupContrib,
                groupDemand;

            averageContribution = function(pv, cv) {
                return pv + cv.value.contribution;
            };

            averageDemand = function(pv, cv) {
                return pv + cv.value.demand;
            };

            for (name in node.game.groupNames) {
                name = node.game.groupNames[name];
                group = receivedData.select('group', '=', name).execute().fetch();
                groupContrib = group.reduce(averageContribution, 0) / 4;
                groupDemand = group.reduce(averageDemand, 0) / 4;
                groupValues[name] = [groupContrib, groupDemand];
            }

            return groupValues;
        },

        getPayoff: function(groupsBars, allPlayers, currentStage, p) {
            var payoff = (2 * groupsBars[0][0]) / allPlayers.length;
            node.game.memory.add('payoff', payoff, p.id, currentStage);
            return payoff;
        },

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;
            noiseRanking = ranking;

            groupValues = this.getGroupValues(receivedData);

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

    node.game.random = {
        getGroupValues: node.game.blackbox.getGroupValues,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;
            noiseRanking = ranking;

            groupValues = this.getGroupValues(receivedData);

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

    node.game.endo = {
        getGroupValues: node.game.blackbox.getGroupValues,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;
            noiseRanking = ranking;

            groupValues = this.getGroupValues(receivedData);

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

    node.game.exo_high = {
        normDistrNoise: function() {
            return gauss(2, 3);
        },

        getGroupValues: node.game.blackbox.getGroupValues,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this,
                iter;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;

            groupValues = this.getGroupValues(receivedData);

            for (iter in receivedData.db){
                receivedData.db[iter].value.noiseContribution = receivedData.db[iter].value.contribution + this.normDistrNoise();
            }
            noiseRanking = receivedData.sort('value.noiseContribution').reverse().fetchValues('player').player;

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

    node.game.exo_low = {
        normDistrNoise: function() {
            return gauss(1, 3);
        },

        getGroupValues: node.game.blackbox.getGroupValues,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this,
                iter;

            debugger;
            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;

            groupValues = this.getGroupValues(receivedData);

            for (iter in receivedData.db){
                receivedData.db[iter].value.noiseContribution = receivedData.db[iter].value.contribution + this.normDistrNoise();
            }
            noiseRanking = receivedData.sort('value.noiseContribution').reverse().fetchValues('player').player;

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

    node.game.exo_perfect = {
        getGroupValues: node.game.blackbox.getGroupValues,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            ranking = receivedData.sort('value.contribution').reverse().fetchValues('player').player;
            noiseRanking = ranking;

            groupValues = this.getGroupValues(receivedData);

            node.game.pl.each(function(p) {
                var groupsBars = [],
                    playersBars = [],
                    finalBars,
                    player,
                    allPlayers,
                    group,
                    otherGroups,
                    payoff,
                    timeup;

                player = receivedData.select('player', '=', p.id).execute().first();
                timeup = player.value.isTimeOut;
                player = [player.value.contribution, player.value.demand];

                allPlayers = receivedData.select('group', '=', p.group).execute().fetch();
                playersBars.push(player);
                for (player in allPlayers) {
                    player = allPlayers[player];
                    if (player.player !== p.id) {
                        playersBars.push([player.value.contribution, player.value.demand]);
                    }
                }

                group = groupValues[p.group];
                groupsBars.push(group);
                otherGroups = node.game.groupNames;
                for (group in otherGroups) {
                    group = otherGroups[group];
                    if (p.group !== group) {
                        groupsBars.push(groupValues[group]);
                    }
                }

                payoff = self.getPayoff(groupsBars, allPlayers, currentStage, p);
                savePlayerValues(p, playersBars, payoff, currentStage, groupsBars, groupValues, timeup, ranking, noiseRanking);
                finalBars = [playersBars, groupsBars, payoff];
                node.say('results', p.id, finalBars);
            });
        },
    };

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
        console.log('endgame');

        console.log('FINAL PAYOFF PER PLAYER');
        console.log('***********************');

        node.game.pl.each(function(p) {
            // debugger
            code = dk.codes.id.get(p.id);
            if (!code) {
                console.log('ERROR: no code in endgame:', p.id);
                return;
            }

            accesscode = code.AccessCode;
            exitcode = code.ExitCode;
            code.win = (code.win || 0) / 1000;
            dk.checkOut(accesscode, exitcode, code.win);
            node.say('WIN', p.id, code.win);
            console.log(p.id, ': ' + code.win);
        });

        console.log('***********************');

        console.log('Game ended');
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
        minPlayers: [2, notEnoughPlayers]
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions,
        minPlayers: [2, notEnoughPlayers]
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz,
        minPlayers: [2, notEnoughPlayers]
    });

    stager.addStep({
        id: 'bid',
        cb: function() {
            console.log('bid');
            var i = 0;
            node.game.pl.each(function(p) {
                p.group = node.game.groupNames[i % 4];
                // p.group = node.game.groupNames[0];
                i += 1;
            });
            return true;
        },
        minPlayers: [2, notEnoughPlayers]
    });

    stager.addStep({
        id: 'results',
        cb: function() {
            // Get values for each group
            node.game[node.game.roomType].sendResults();
        },
        minPlayers: [2, notEnoughPlayers]
    });

    stager.addStage({
        id: 'meritocracy',
        steps: ['bid', 'results'],
        minPlayers: [2, notEnoughPlayers]
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
    var REPEAT = 20;

    // Here we define the sequence of stages of the game (game plot).
    stager
        .init()
    // .next('precache')
    // .next('instructions')
    // .next('quiz')
    .repeat('meritocracy', REPEAT)
    // .next('questionnaire')
    // .next('endgame')
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
        debug: true,
        // Controls the amount of information printed to screen.
        verbosity: 0,
        // nodeGame enviroment variables.
        env: {
            auto: false
        }
    };

};