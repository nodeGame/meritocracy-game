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
        var rank = ranking.indexOf(p.id),
            noiseRank = noiseRanking.indexOf(p.id);
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

        sortContribution: function(o1, o2) {
            if (o1.value.contribution > o2.value.contribution) {
                return 1;
            }
            if (o1.value.contribution < o2.value.contribution) {
                return 2;
            }
            return 0;
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

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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

        sortContribution: node.game.blackbox.sortContribution,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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

        sortContribution: node.game.blackbox.sortContribution,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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
        getGroupValues: node.game.blackbox.getGroupValues,

        sortContribution: node.game.blackbox.sortContribution,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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

    node.game.exo_low = {
        getGroupValues: node.game.blackbox.getGroupValues,

        sortContribution: node.game.blackbox.sortContribution,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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
    
    node.game.exo_perfect = {
        getGroupValues: node.game.blackbox.getGroupValues,

        sortContribution: node.game.blackbox.sortContribution,

        getPayoff: node.game.blackbox.getPayoff,

        sendResults: function() {
            var groupValues,
                currentStage = node.game.getCurrentGameStage(),
                previousStage = node.game.plot.previous(currentStage),
                ranking,
                noiseRanking,
                self = this;

            var receivedData = node.game.memory.select('stage', '=', previousStage).execute();

            receivedData.globalComparator = this.sortContribution;

            ranking = receivedData.reverse().fetchValues('player').player;
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