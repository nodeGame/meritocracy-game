/**
 * # Treatment conditions for meritocracy game. 
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Contains helper functions to create Gaussian noise.
 *
 * http://www.nodegame.org
 * ---
 */

// Share through channel.require
var node = module.parent.exports.node;

var treatments = {};
module.exports = treatments;

var groupNames = ['einstein', 'knuth', 'turing', 'feynmann'];

// Noise variance. High and low stands for "meritocracy", not for noise.
var NOISE_HIGH = 2;
var NOISE_LOW = 4;

// Number of coins for each player at the beginning of each round
var INIT_NB_COINS = 10;

function shuffleArray(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

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

function averageContribution(pv, cv) {
    return pv + cv.value.contribution;
}

function averageDemand(pv, cv) {
    return pv + cv.value.demand;
}

/**
 * Computes average contribution and demand for each group
 *
 * @param  {NDDB} receivedData Data received from clients 
 * @return {array} Contains average values for each group.
 */
function getGroupValues(receivedData) {
    var groupValues = {},
    group,
    name,
    groupContrib,
    groupDemand;

    for (name in groupNames) {
        if (groupNames.hasOwnProperty(name)) {
            name = groupNames[name];
            group = receivedData.selexec('group', '=', name).fetch();
            groupContrib = group.reduce(averageContribution, 0) / group.length;
            groupDemand = group.reduce(averageDemand, 0) / group.length;
            groupValues[name] = [groupContrib, groupDemand];
        }
    }
    
    return groupValues;
}

/**
 * Returns and saves payoff in memory
 *
 * @param  {array} groups       contains values for each group/player
 * @param  {array} position     position of current player
 * @param  {object} p            player object
 * @param  {object} currentStage current stage
 * @return {int}              payoff
 */
function getPayoff(groups, position, p, currentStage) {
    var payoff, group;

    group = groups[position[0]];
    payoff = group.reduce(function(prev, curr) {
        return prev + curr[0];
    }, 0);
    payoff = payoff / 2;
    payoff = INIT_NB_COINS - group[position[1]][0] + payoff;
    node.game.memory.add('payoff', payoff, p.id, currentStage);
    return payoff;
}

/**
 * Returns position of player in ranking
 * @param  {array} ranking contains players' ids
 * @param  {object} p       player object
 * @return {array}         first group, then position in group
 */
function getPosition(ranking, p) {
    var position = [];
    position[0] = Math.floor(ranking.indexOf(p.id) / 4);
    position[1] = ranking.indexOf(p.id) % 4;
    return position;
}

/**
 * Assigns a group to each player
 * @param {array} ranking  Array of players' ids
 */
function groupMatching(ranking) {
    var iter,
    group,
    person;
    for (iter = 0; iter < ranking.length; iter++) {
        group = Math.floor(iter / 4);
        group = groupNames[group];
        person = node.game.pl.id.update(ranking[iter], {
            group: group
        });
    }
}

/**
 * Returns group averages and values for players in same group.
 * @param  {object} player       player from receivedData
 * @param  {NDDB} receivedData Data received from client
 * @param  {object} p            player object
 * @param  {array} groupValues  averages of each group
 * @return {object}              contains groupBars and playerBars
 */
function getGroupsPlayerBars(player, receivedData, p, groupValues) {
    var playersBars = [],
    groupsBars = [],
    allPlayers,
    group,
    otherGroups;
    
    player = [player.value.contribution, player.value.demand];

    allPlayers = receivedData.selexec('group', '=', p.group).fetch();
    playersBars.push(player);
    for (player in allPlayers) {
        player = allPlayers[player];
        if (player.player !== p.id) {
            playersBars.push([player.value.contribution, player.value.demand]);
        }
    }

    group = groupValues[p.group];
    groupsBars.push(group);
    otherGroups = groupNames;
    for (group in otherGroups) {
        group = otherGroups[group];
        if (p.group !== group) {
            groupsBars.push(groupValues[group]);
        }
    }
    return {
        players: playersBars,
        groups: groupsBars,
    };
}

/**
 * Divides a ranking array into 4 groups. NOT GROUP MATCHING
 * @param  {array} groups contains contribution and demand of players
 * @return {array}        contains arrays, which contains contribution
 */
function getGroups(groups) {
    var iter,
    subGroup = [];
    groups = groups.map(function(e) {
        return [e.contribution];
    });
    for (iter = 0; iter < groups.length / 4; iter++) {
        subGroup[iter] = groups.slice(4 * iter, 4 * iter + 4);
    }
    return subGroup;
}

/**
 * Create Noise on contribution. 
 * @param  {NDDB} receivedData Received data from client
 * @return {NDDB}              Received data, with noise field
 */
function createNoise(receivedData, variance) {
    var contrib, iter;
    for (iter in receivedData.db) {
        contrib = receivedData.db[iter].value.contribution;
        receivedData.db[iter].value.noiseContribution = contrib +
            gauss(0, variance);
    }
    return receivedData;
}

/**
 * Send and saves received values for each player.
 */
function emitPlayersResults(p, receivedData, self, groupValues, ranking,
                             currentStage, groups, noiseRanking) {
    var groupsBars = [],
    playersBars = [],
    finalBars,
    player,
    payoff,
    timeup,
    noiseContribution,
    position;

    player = receivedData.select('player', '=', p.id).execute().first();
    timeup = player.value.isTimeOut;
    noiseContribution = player.value.noiseContribution;
    playersBars = self.getGroupsPlayerBars(player, receivedData, p,
                                           groupValues);
    groupsBars = playersBars.groups;
    playersBars = playersBars.players;
    position = self.getPosition(ranking, p);
    payoff = self.getPayoff(groups, position, p, currentStage);
    node.game.savePlayerValues(
        p,
        playersBars,
        payoff,
        currentStage,
        groupsBars,
        groupValues,
        timeup,
        ranking,
        noiseRanking,
        noiseContribution);
    finalBars = [groups, position, payoff];
    node.say('results', p.id, finalBars);
}

// STARTING THE TREATMENTS.

// EXO PERFECT.
treatments.exo_perfect = {

    groupMatching: groupMatching,
    getGroupValues: getGroupValues,
    getPayoff: getPayoff,
    getPosition: getPosition,
    getGroupsPlayerBars: getGroupsPlayerBars,
    getGroups: getGroups,
    emitPlayersResults: emitPlayersResults,

    sendResults: function() {
        var groupValues,
        currentStage = node.game.getCurrentGameStage(),
        previousStage = node.game.plot.previous(currentStage),
        ranking,
        receivedData,
        self = this,
        groups;

        receivedData = node.game.memory.selexec('stage', '=', previousStage);

        ranking = receivedData
            .sort('value.contribution')
            .reverse()
            .fetchValues(['player', 'value']);
        

        groups = ranking.value;
        ranking = ranking.player;
        noiseRanking = ranking;
        groups = this.getGroups(groups);
        this.groupMatching(ranking);

        // Compute average contrib and demand in each group.
        groupValues = this.getGroupValues(receivedData);

        node.game.pl.each(function(p) {
            self.emitPlayersResults(
                p,
                receivedData,
                self,
                groupValues,
                ranking,
                currentStage,
                groups,
                noiseRanking);
        });
        return true;
    },
};


// EXO HIGH.
treatments.exo_high = {

    createNoise: createNoise,
    groupMatching: groupMatching,
    getGroupValues: getGroupValues,
    getPayoff: getPayoff,
    getPosition: getPosition,
    getGroupsPlayerBars: getGroupsPlayerBars,
    getGroups: getGroups,
    emitPlayersResults: emitPlayersResults,

    sendResults: function() {
        var groupValues,
        currentStage = node.game.getCurrentGameStage(),
        previousStage = node.game.plot.previous(currentStage),
        receivedData,
        ranking,
        noiseRanking,
        self = this,
        groups;

        receivedData = node.game.memory.selexec('stage', '=', previousStage);

        ranking = receivedData
            .sort('value.contribution')
            .reverse()
            .fetchValues('player').player;

        receivedData = this.createNoise(receivedData, NOISE_HIGH);

        noiseRanking = receivedData
            .sort('value.noiseContribution')
            .reverse()
            .fetchValues(['player', 'value']);
        
        groups = this.getGroups(noiseRanking.value);
        noiseRanking = noiseRanking.player;
        this.groupMatching(noiseRanking);
        groupValues = this.getGroupValues(receivedData);

        node.game.pl.each(function(p) {
            self.emitPlayersResults(
                p,
                receivedData,
                self,
                groupValues,
                ranking,
                currentStage,
                groups,
                noiseRanking);
        });
        return true;
    },
};

// EXO LOW.
treatments.exo_low = {

    createNoise: createNoise,
    groupMatching: groupMatching,
    getGroupValues: getGroupValues,
    getPayoff: getPayoff,
    getPosition: getPosition,
    getGroupsPlayerBars: getGroupsPlayerBars,
    getGroups: getGroups,
    emitPlayersResults: emitPlayersResults,

    sendResults: function() {
        var groupValues,
        currentStage = node.game.getCurrentGameStage(),
        previousStage = node.game.plot.previous(currentStage),
        receivedData,
        ranking,
        noiseRanking,
        self = this,
        groups;

        receivedData = node.game.memory.selexec('stage', '=', previousStage);

        ranking = receivedData
            .sort('value.contribution')
            .reverse()
            .fetchValues('player').player;

        receivedData = this.createNoise(receivedData, NOISE_LOW);

        noiseRanking = receivedData
            .sort('value.noiseContribution')
            .reverse()
            .fetchValues(['player', 'value']);

        groups = this.getGroups(noiseRanking.value);
        noiseRanking = noiseRanking.player;
        this.groupMatching(noiseRanking);
        groupValues = this.getGroupValues(receivedData);

        node.game.pl.each(function(p) {
            self.emitPlayersResults(
                p,
                receivedData,
                self,
                groupValues,
                ranking,
                currentStage,
                groups,
                noiseRanking);
        });
        return true;
    },
};

// EXO RANDO.
treatments.random = {

    groupMatching: groupMatching,
    getGroupValues: getGroupValues,
    getPayoff: getPayoff,
    getPosition: getPosition,
    getGroupsPlayerBars: getGroupsPlayerBars,
    getGroups: treatments.getGroups,
    emitPlayersResults: emitPlayersResults,

    sendResults: function() {
        var groupValues,
        currentStage = node.game.getCurrentGameStage(),
        previousStage = node.game.plot.previous(currentStage),
        ranking,
        noiseRanking,
        receivedData,
        self = this,
        groups;

        receivedData = node.game.memory.selexec('stage', '=', previousStage);

        ranking = receivedData
            .sort('value.contribution')
            .reverse()
            .fetchValues(['player', 'value']);
        
        ranking = shuffleArray(ranking);
        groups = ranking.value;
        ranking = ranking.player;
        noiseRanking = ranking;
        groups = this.getGroups(groups);
        this.groupMatching(ranking);
        groupValues = this.getGroupValues(receivedData);

        node.game.pl.each(function(p) {
            self.emitPlayersResults(
                p,
                receivedData,
                self,
                groupValues,
                ranking,
                currentStage,
                groups,
                noiseRanking);
        });
        return true;
    },
};

// EXO ENDO.
treatments.endo = {

    groupMatching: groupMatching,
    getGroupValues: getGroupValues,
    getPayoff: getPayoff,
    getPosition: getPosition,
    getGroupsPlayerBars: getGroupsPlayerBars,
    getGroups: getGroups,
    emitPlayersResults: emitPlayersResults,

    sendResults: function() {
        var groupValues,
        currentStage = node.game.getCurrentGameStage(),
        previousStage = node.game.plot.previous(currentStage),
        receivedData,
        ranking,
        noiseRanking,
        self = this,
        groups;

        receivedData = node.game.memory.selexec('stage', '=', previousStage);

        ranking = receivedData
            .sort('value.contribution')
            .reverse()
            .fetchValues(['player', 'value']);
        
        groups = ranking.value;
        ranking = ranking.player;
        noiseRanking = ranking;
        groups = this.getGroups(groups);
        this.groupMatching(ranking);
        groupValues = this.getGroupValues(receivedData);

        node.game.pl.each(function(p) {
            self.emitPlayersResults(
                p,
                receivedData,
                self,
                groupValues,
                ranking,
                currentStage,
                groups,
                noiseRanking);
        });
        return true;
    },
};

// BLACKBOX.
treatments.blackbox = treatments.exo_perfect;