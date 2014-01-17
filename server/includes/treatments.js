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
var treatment = module.parent.exports.treatment;
var settings = module.parent.exports.settings;

var ENDO = treatment === 'endo';

var treatments = {};
module.exports = treatments;


// Noise variance. High and low stands for "meritocracy", not for noise.
var NOISE_HIGH = settings.NOISE_HIGH;
var NOISE_LOW = settings.NOISE_LOW;

var GROUP_SIZE = settings.GROUP_SIZE;

var GROUP_ACCOUNT_DIVIDER = settings.GROUP_ACCOUNT_DIVIDER;

var groupNames = settings.GROUP_NAMES;

// Number of coins for each player at the beginning of each round
var INITIAL_COINS = settings.INITIAL_COINS;

function shuffleArray(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var gauss = (function () {
    var space = null;
    return function (mu, sigma) {
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
            }
            else {
                M = Math.sqrt(2.0 * Math.log(S) / S);
            }
            space = V * M;
            result = mu + sigma * M * U;
        }
        else {
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

// Functions used in map-reduce.

function averageContribution(pv, cv) {
    return pv + cv.value.contribution;
}

function averageDemand(pv, cv) {
    return pv + cv.value.demand;
}

function computeGroupAccount(prev, curr) {
    return prev + curr[0];
}

// If two contributions are exactly the same, then they are randomly ordered.
function sortContributions(c1, c2) {
    if (c1.value.contribution > c2.value.contribution) return -1;
    if (c1.value.contribution < c2.value.contribution) return 1;
    if (Math.random() <= 0.5) return -1;
    return 1;
}

// If two demands are exactly the same, then they are randomly ordered.
function sortDemands(c1, c2) {
    if (c1.value.demand > c2.value.demand) return -1;
    if (c1.value.demand < c2.value.demand) return 1;
    if (Math.random() <= 0.5) return -1;
    return 1;
}

// If two contributions are exactly the same, then they are randomly ordered.
function sortNoisyContributions(c1, c2) {
    if (c1.value.noisyContribution > c2.value.noisyContribution) return -1;
    if (c1.value.noisyContribution < c2.value.noisyContribution) return 1;
    if (Math.random() <= 0.5) return -1;
    return 1;
}


/**
 * Returns payoff
 *
 * @param  {array} groups       contains values for each group/player
 * @param  {array} position     position of current player
 * @param  {object} currentStage current stage
 * @return {int}              payoff
 */
function getPayoff(bars, position) {
    var payoff, group;
    group = bars[position[0]];
    payoff = group.reduce(computeGroupAccount, 0);
    payoff = payoff / GROUP_ACCOUNT_DIVIDER;
    payoff = INITIAL_COINS - group[position[1]][0] + payoff;
    return payoff;
}


/**
 * Splits a sorted array of contributions objects into four groups
 *
 * Computes the ranking, i.e. the list of player ids from top to bottom.
 *
 * @param {array} ranking The sorted array of contribution objects
 * @return {object} Object containing the ranking and groups
 */
function doGroupMatching(sortedContribs) {
    var i, len, groups, entry, ranking, bars;
    var gId, gName;

    len = sortedContribs.length;
    groups = [];
    ranking = [];
    bars = [];
    gId = -1;
    for (i = 0; i < len; i++) {
        if (i % GROUP_SIZE == 0) {
            ++gId;
            groups[gId] = [];
        }
        entry = sortedContribs[i];
        entry.group = groupNames[gId];

        groups[gId].push(entry);
        ranking.push(entry.player);
        bars.push([entry.value.contribution, entry.value.demand]);
    }
    return {
        groups: groups,
        ranking: ranking,
        bars: [bars]
    };
}

function computeGroupStats(groups) {
    var i, len, group;
    var j, lenJ, entry;
    var out, groupName;

    var cSumSquared, dSumSquared, cSum, dSum, df;
    out = {};
    i = -1, len = groups.length;
    for (; ++i < len;) {
        group = groups[i];
        groupName = groupNames[i];
        j = -1, lenJ = group.length;

        cSum = 0,
        cSumSquared = 0;

        dSum = 0;
        dSumSquared = 0;

        for (; ++j < lenJ;) {
            entry = groups[i][j].value;

            cSum += entry.contribution;
            cSumSquared = Math.pow(entry.contribution, 2);

            if (ENDO) {
                dSum += entry.demand;
                dSumSquared = Math.pow(entry.demand, 2);
            }
        }

        df = lenJ - 1;

        out[groupName] = {
            avgContr: cSum / lenJ,
            stdContr: df <= 1 ? 'NA' : Math.sqrt((cSumSquared - (Math.pow(cSum, 2) / lenJ)) / df)
        };

        if (ENDO) {
            out[groupName].avgDemand = dSum / lenJ;
            out[groupName].stdDemand = df <= 1 ? 'NA' :
                Math.sqrt((dSumSquared - (Math.pow(dSum, 2) / lenJ)) / df);
        }
        else {
            out[groupName].avgDemand = 'NA';
            out[groupName].stdDemand = 'NA';
        }
    }
    return out;
}

/**
 * Create Noise on contribution.
 * @param  {NDDB} receivedData Received data from client
 * @return {NDDB}              Received data, with noise field
 */
function createNoise(receivedData, variance) {
    var contrib, iter;
    var i, len;
    i = -1, len = receivedData.db.length;
    for (; ++i < len;) {
        contrib = receivedData.db[i].contribution;
        receivedData.db[i].noisyContribution = contrib +
            gauss(0, variance);
    }
    return receivedData;
}

/**
 * Send and saves received values for each player.
 */
function emitPlayersResults(pId, bars, position, payoff) {
    var finalBars;
    finalBars = [bars, position, payoff];
    node.say('results', pId, finalBars);
}

// Saves the outcome of a round to database, and communicates it to the clients.
function finalizeRound(currentStage, bars,
    groupStats, groups, ranking, noisyGroupStats,
    noisyGroups, noisyRanking) {

    var i, len, j, lenJ, contribObj,
        pId, positionInNoisyRank, playerPayoff;

    // Save the results at the group level.
    node.game.saveRoundResults(ranking, groupStats,
        noisyRanking, noisyGroupStats);

    // Save the results for each player, and notify him.
    i = -1, len = noisyGroups.length;
    for (; ++i < len;) {
        j = -1, lenJ = noisyGroups[i].length;
        for (; ++j < lenJ;) {
            contribObj = noisyGroups[i][j];

            // Position in Rank (array of group id, position within group).
            positionInNoisyRank = [i, j];
            pId = contribObj.player;

            playerPayoff = getPayoff(bars, positionInNoisyRank);

            node.game.savePlayerValues(contribObj, playerPayoff,
                positionInNoisyRank,
                ranking,
                noisyRanking,
                groupStats,
                currentStage);

            emitPlayersResults(pId, bars, positionInNoisyRank,
                playerPayoff);
        }
    }
}


// STARTING THE TREATMENTS.

// EXO PERFECT.
treatments.exo_perfect = {

    sendResults: function () {
        var currentStage, previousStage,
            receivedData,
            sortedContribs,
            matching,
            ranking, groups, groupStats,
            noisyRanking, noisyGroups, noisyGroupStats,
            bars;

        currentStage = node.game.getCurrentGameStage();
        previousStage = node.game.plot.previous(currentStage);

        receivedData = node.game.memory.stage[previousStage];

        sortedContribs = receivedData
            .sort(sortContributions)
            .fetch();

        // Original Ranking (without noise).
        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        ranking = matching.ranking;
        // Array of array of contributions objects.
        groups = matching.groups;
        // Compute average contrib and demand in each group.
        groupStats = computeGroupStats(groups);

        // Add Noise (not in this case).
        noisyRanking = ranking;
        noisyGroups = groups;
        noisyGroupStats = groupStats;

        // Bars for display in clients.
        bars = matching.bars;

        // Save to db, and sends results to players.
        finalizeRound(currentStage, bars,
            groupStats, groups, ranking,
            noisyGroupStats, noisyGroups, noisyRanking);
    }
};


// EXO HIGH.
treatments.exo_high = {

    sendResults: function () {
        var currentStage, previousStage,
            receivedData,
            sortedContribs,
            matching,
            ranking, groups, groupStats,
            noisyRanking, noisyGroups, noisyGroupStats,
            bars;

        currentStage = node.game.getCurrentGameStage();
        previousStage = node.game.plot.previous(currentStage);

        receivedData = node.game.memory.stage[previousStage];

        sortedContribs = receivedData
            .sort(sortContributions)
            .fetch();

        // Original Ranking (without noise).
        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        ranking = matching.ranking;
        // Array of array of contributions objects.
        groups = matching.groups;
        // Compute average contrib and demand in each group.
        groupStats = computeGroupStats(groups);

        // Add Noise.
        receivedData = createNoise(receivedData, NOISE_LOW);

        sortedContribs = receivedData
            .sort(sortNoisyContributions)
            .fetch();

        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        noisyRanking = matching.ranking;
        // Array of array of contributions objects.
        noisyGroups = matching.groups;
        // Compute average contrib and demand in each group.
        noisyGroupStats = computeGroupStats(noisyGroups);

        // Bars for display in clients.
        bars = matching.bars;

        // Save to db, and sends results to players.
        finalizeRound(currentStage, bars,
            groupStats, groups, ranking,
            noisyGroupStats, noisyGroups, noisyRanking);
    }
};

// EXO LOW.
treatments.exo_low = {
    sendResults: function () {
        var currentStage, previousStage,
            receivedData,
            sortedContribs,
            matching,
            ranking, groups, groupStats,
            noisyRanking, noisyGroups, noisyGroupStats,
            bars;

        currentStage = node.game.getCurrentGameStage();
        previousStage = node.game.plot.previous(currentStage);

        receivedData = node.game.memory.stage[previousStage];

        sortedContribs = receivedData
            .sort(sortContributions)
            .fetch();

        // Original Ranking (without noise).
        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        ranking = matching.ranking;
        // Array of array of contributions objects.
        groups = matching.groups;
        // Compute average contrib and demand in each group.
        groupStats = computeGroupStats(groups);

        // Add Noise.
        receivedData = createNoise(receivedData, NOISE_HIGH);

        sortedContribs = receivedData
            .sort(sortNoisyContributions)
            .fetch();

        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        noisyRanking = matching.ranking;
        // Array of array of contributions objects.
        noisyGroups = matching.groups;
        // Compute average contrib and demand in each group.
        noisyGroupStats = computeGroupStats(noisyGroups);

        // Bars for display in clients.
        bars = matching.bars;

        // Save to db, and sends results to players.
        finalizeRound(currentStage, bars,
            groupStats, groups, ranking,
            noisyGroupStats, noisyGroups, noisyRanking);
    }
};

// EXO RANDO.
treatments.random = {
    sendResults: function () {
        var currentStage, previousStage,
            receivedData,
            sortedContribs,
            matching,
            ranking, groups, groupStats,
            noisyRanking, noisyGroups, noisyGroupStats,
            bars;

        currentStage = node.game.getCurrentGameStage();
        previousStage = node.game.plot.previous(currentStage);

        receivedData = node.game.memory.stage[previousStage];

        // Shuffle contributions randomly.
        sortedContribs = receivedData
            .shuffle()
            .fetch();

        // Original Ranking (without noise).
        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        ranking = matching.ranking;
        // Array of array of contributions objects.
        groups = matching.groups;
        // Compute average contrib and demand in each group.
        groupStats = computeGroupStats(groups);

        // Add Noise (not in this case).
        noisyRanking = ranking;
        noisyGroups = groups;
        noisyGroupStats = groupStats;

        // Bars for display in clients.
        bars = matching.bars;

        // Save to db, and sends results to players.
        finalizeRound(currentStage, bars,
            groupStats, groups, ranking,
            noisyGroupStats, noisyGroups, noisyRanking);
    }
};

// EXO ENDO. (TODO)
treatments.endo = {
    /*
     * TODO: (In a function treatments.endo.endoMatching())
     * - Take player with lowest demand and 3 players with lowest contrib, that matches this lowest demand.
     * - They form a group
     * - Take nest lowest demand and repeat line 1 3x.
     */
    endoGroupMatching: function (sortedContribs, sortedDemands) {

    },

    sendResults: function () {
        var currentStage, previousStage,
            receivedData,
            sortedContribs,
            matching,
            ranking, groups, groupStats,
            noisyRanking, noisyGroups, noisyGroupStats,
            bars;

        currentStage = node.game.getCurrentGameStage();
        previousStage = node.game.plot.previous(currentStage);

        receivedData = node.game.memory.stage[previousStage];

        sortedContribs = receivedData
            .sort(sortContributions)
            .fetch();

        sortedDemands = receivedData
            .sort(sortDemands)
            .fetch();

        treatments.endoGroupMatching(sortedContribs, sortedDemands);


        // Original Ranking (without noise).
        matching = doGroupMatching(sortedContribs);

        // Array of sorted player ids, from top to lowest contribution.
        ranking = matching.ranking;
        // Array of array of contributions objects.
        groups = matching.groups;
        // Compute average contrib and demand in each group.
        groupStats = computeGroupStats(groups);

        // Add Noise (not in this case).
        noisyRanking = ranking;
        noisyGroups = groups;
        noisyGroupStats = groupStats;

        // Bars for display in clients.
        bars = matching.bars;

        // Save to db, and sends results to players.
        finalizeRound(currentStage, bars,
            groupStats, groups, ranking,
            noisyGroupStats, noisyGroups, noisyRanking);
    };

    // BLACKBOX.
    treatments.blackbox = treatments.exo_perfect;


    // NOT USED AT THE MOMENT



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
     * Divides a ranking array into 4 groups. NOT GROUP MATCHING
     * @param  {array} groups contains contribution and demand of players
     * @return {array}        contains arrays, which contains contribution
     */
    function getGroups(groups) {
        var i, len, subGroup, gId;
        len = groups.length;
        subGroup = [];
        gId = -1;
        for (i = 0; i < len; i++) {
            if (i % GROUP_SIZE == 0) {
                ++gId;
                subGroup[gId] = [];
            }
            subGroup[gId].push([groups[i].contribution]);
        }
        return subGroup;
    }