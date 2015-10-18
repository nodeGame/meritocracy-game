var J = require('JSUS').JSUS;
var SUBGROUP_SIZE = 4;
var groupNames = ['1','2','3','4'];

// Group Matching for ENDO condition
function endoGroupMatching(sortedContribs) {
    var i, j;
    var bars, ranking, groups, compatibility;
    var noGroup, alreadyTaken, temp;
    var entryI, entryJ, gId;
    var len, limit;

    // Helper variables.
    noGroup = [];
    alreadyTaken = {};

    // Main output.
    groups = [];
    bars = [];
    ranking = [];
    compatibility = [];
    
    gId = -1;
    len = sortedContribs.length;
    limit = len - SUBGROUP_SIZE;

    for (i = 0; i < len; i++) {

        entryI = sortedContribs[i];
        if (alreadyTaken[entryI.player]) continue;

        // Last elements should already had formed a group, if it was possible.
        if (i > limit) {
            noGroup.push(entryI);
            continue;
        }

        // Base object. New entries will be added here, if compatible.
        temp = {
            groups: [entryI],
            ranking: [entryI.player],
            bars: [[entryI.contribution, entryI.demand]],
            minContrib: entryI.contribution,
            maxDemand: entryI.demand
        };

        // Check if a group can be made with remaining entries. Entries with
        // higher contributions have been checked already.
        for (j = (i + 1); j < len; j++) {
            // Check this entry.
            entryJ = sortedContribs[j];
            if (alreadyTaken[entryJ.player]) continue;            


            // Since contributions are sorted we don't check further.
            if (entryJ.contribution < temp.maxDemand) {          
                noGroup.push(entryI);
                break;
            }
            
            // Entry is compatible.
            if (entryJ.demand <= temp.minContrib) {

                // Add entryJ to the current temp group.
                temp.groups.push(entryJ);
                temp.ranking.push(entryJ.player);
                temp.bars.push([entryJ.contribution, entryJ.demand]);

                // Update requirements for the group.                
                temp.minContrib = Math.min(temp.minContrib, 
                                           entryJ.contribution);
                temp.maxDemand = Math.max(temp.maxDemand, entryJ.demand);

                // Check if we have enough compatible players in group.
                if (temp.groups.length >= SUBGROUP_SIZE) {
                    // Update group-id counter.
                    ++gId;

                    // Add the group the main output.
                    groups.push(temp.groups);
                    ranking = ranking.concat(temp.ranking);
                    bars.push(temp.bars);
                    compatibility[gId] = 1;
                    
                    // Mark all entries as taken.
                    for (j = 0; j < SUBGROUP_SIZE; j++) {
                        entryJ = temp.groups[j];
                        alreadyTaken[entryJ.player] = entryJ.player;
                        entryJ.group = groupNames[gId];
                    }                
                    break;
                }
                
            }
        
            // We don't have enough players left to try to complete the group.
            else if ((len - (j+1)) < (SUBGROUP_SIZE - temp.groups.length)) {
                // Mark entryI as without group.
                noGroup.push(entryI);
                break;
            }
        }        
    }
 
    if (noGroup.length) {
        // Creating random groups from entries in no group.
        noGroup = J.shuffle(noGroup);        
        for (i = 0; i < noGroup.length; i++) {
            if (i % SUBGROUP_SIZE == 0) {
                ++gId;
                groups[gId] = [];
                bars[gId] = [];
            }
            entryJ = noGroup[i];
            entryJ.group = groupNames[gId];
            groups[gId].push(entryJ);
            ranking.push(entryJ.player);
            bars[gId].push([entryJ.contribution, entryJ.demand]);
            compatibility[gId] = 0;
        }
    }

    return {
        groups: groups,
        ranking: ranking,
        bars: bars,
        compatibility: compatibility
    };
}


var items = [
    {
        player: 1,
        value: {
            contribution: 10,
            demand: 10,
        }
    },

    {
        player: 2,
        value: {
            contribution: 10,
            demand: 5,
        }
    },

    {
        player: 3,
        value: {
            contribution: 8,
            demand: 4,
        }
    },

    {
        player: 4,
        value: {
            contribution: 8,
            demand: 9,
        }
    },

    {
        player: 5,
        value: {
            contribution: 8,
            demand: 3,
        }
    },

    {
        player: 6,
        value: {
            contribution: 6,
            demand: 6,
        }
    },

    {
        player: 7,
        value: {
            contribution: 6,
            demand: 6,
        }
    },

   {
        player: 8,
        value: {
            contribution: 5,
            demand: 5,
        }
    },

   {
        player: 9,
        value: {
            contribution: 5,
            demand: 1,
        }
    },

   {
        player: 10,
        value: {
            contribution: 4,
            demand: 1,
        }
    },

   {
        player: 11,
        value: {
            contribution: 3,
            demand: 2,
        }
    },

   {
        player: 12,
        value: {
            contribution: 3,
            demand: 10,
        }
    },

   {
        player: 13,
        value: {
            contribution: 3,
            demand: 2,
        }
    },

   {
        player: 14,
        value: {
            contribution: 1,
            demand: 0,
        }
    },

  {
        player: 15,
        value: {
            contribution: 1,
            demand: 0,
        }
    },

  {
        player: 16,
        value: {
            contribution: 0,
            demand: 0,
        }
    }

];

// NO GROUP: 1,4,7,8,12,14,15,16

// 2,3,5,6
// 9,10,11,13

var items = [
    {
        player: 1,
        value: {
            contribution: 10,
            demand: 0,
        }
    },

    {
        player: 2,
        value: {
            contribution: 10,
            demand: 6,
        }
    },

    {
        player: 3,
        value: {
            contribution: 9,
            demand: 3,
        }
    },

    {
        player: 4,
        value: {
            contribution: 8,
            demand: 9,
        }
    },

    {
        player: 5,
        value: {
            contribution: 7,
            demand: 4,
        }
    },

    {
        player: 6,
        value: {
            contribution: 3,
            demand: 6,
        }
    },

    {
        player: 7,
        value: {
            contribution: 8,
            demand: 6,
        }
    },

   {
        player: 8,
        value: {
            contribution: 8,
            demand: 8,
        }
    },

   {
        player: 9,
        value: {
            contribution: 2,
            demand: 6,
        }
    },

   {
        player: 10,
        value: {
            contribution: 6,
            demand: 8,
        }
    },

   {
        player: 11,
        value: {
            contribution: 3,
            demand: 5,
        }
    },

   {
        player: 12,
        value: {
            contribution: 5,
            demand: 6,
        }
    },

   {
        player: 13,
        value: {
            contribution: 1,
            demand: 7,
        }
    },

   {
        player: 14,
        value: {
            contribution: 3,
            demand: 9,
        }
    },

  {
        player: 15,
        value: {
            contribution: 3,
            demand: 3,
        }
    },

  {
        player: 16,
        value: {
            contribution: 0,
            demand: 9,
        }
    }

];


var a = endoGroupMatching(items);

console.log(a);

return;


/**
 * Generates random numbers with Normal Gaussian distribution.
 *
 * User must specify the expected mean, and standard deviation a input 
 * parameters.
 *
 * Implements the Polar Method by Knuth, "The Art Of Computer
 * Programming", p. 117.
 * 
 * @param {number} mu The mean of the distribution
 * param {number} sigma The standard deviation of the distribution
 * @return {number} A random number following a Normal Gaussian distribution
 */
var nextNormal = (function() {

    var oldMu, oldSigma;    
    var x2, multiplier, genReady;    

    return function(mu, sigma) {
        
        var x1, u1, u2, v1, v2, s;
        
        if ('number' !== typeof mu) {
            throw new TypeError('nextNormal: mu must be number.');
        }
        if ('number' !== typeof sigma) {
            throw new TypeError('nextNormal: sigma must be number.');
        }

        if (mu !== oldMu || sigma !== oldSigma) {
            genReady = false;
            oldMu = mu;
            oldSigma = sigma;
        }

        if (genReady) {     
            genReady = false;
            return (sigma * x2) + mu;
        }
        
        u1 = Math.random();
        u2 = Math.random();
        
        // Normalize between -1 and +1.
        v1 = (2 * u1) - 1;
        v2 = (2 * u2) - 1; 
        
        s = (v1 * v1) + (v2 * v2);
        
        // Condition is true on average 1.27 times, 
        // with variance equal to 0.587.
        if (s >= 1) {
            return nextNormal(mu, sigma);
        }
        
        multiplier = Math.sqrt(-2 * Math.log(s) / s);
            
        x1 = v1 * multiplier;
        x2 = v2 * multiplier;
        
        genReady = true;
        
        return (sigma * x1) + mu;
            
    }
})();


/**
 * Generates random numbers with LogNormal distribution.
 *
 * User must specify the expected mean, and standard deviation of the
 * underlying gaussian distribution as input parameters.
 * 
 * @param {number} mu The mean of the gaussian distribution
 * @param {number} sigma The standard deviation of the gaussian distribution
 * @return {number} A random number following a LogNormal distribution
 *
 * @see nextNormal 
 */
function nextLogNormal(mu, sigma) {
    if ('number' !== typeof mu) {
        throw new TypeError('nextLogNormal: mu must be number.');
    }
    if ('number' !== typeof sigma) {
        throw new TypeError('nextLogNormal: sigma must be number.');
    }
    return Math.exp(nextNormal(mu, sigma));
}

/**
 * Generates random numbers with Exponential distribution.
 *
 * User must specify the lambda the _rate parameter_ of the distribution.
 * The expected mean of the distribution is equal to `Math.pow(lamba, -1)`. 
 * 
 * @param {number} lambda The rate parameter
 * @return {number} A random number following an Exponential distribution
 *
 * @see nextNormal 
 */
function nextExponential(lambda) {
    if ('number' !== typeof lambda) {
        throw new TypeError('nextExponential: lambda must be number.');
    }
    if (lambda <= 0) {
        throw new TypeError('nextExponential: lambda must be greater than 0.');
    }
    return - Math.log(1 - Math.random()) / lambda;
}

function nextGamma(alpha, k) {
    var intK, kDiv, alphaDiv;
    var u1, u2, u3;
    var x, i, len, tmp;

    if ('number' !== typeof alpha) {
        throw new TypeError('nextGamma: alpha must be number.');
    }
    if ('number' !== typeof k) {
        throw new TypeError('nextGamma: k must be number.');
    }
    if (alpha < 1) {
        throw new TypeError('nextGamma: alpha must be greater than 1.');
    }
    if (k < 1) {
        throw new TypeError('nextGamma: k must be greater than 1.');
    }

    u1 = Math.random();
    u2 = Math.random();
    u3 = Math.random();

    intK = Math.floor(k) + 3;
    kDiv = 1 / k;
    
    alphaDiv = 1 / alpha;

    x = 0;
    for (i = 3 ; ++i < intK ; ) {
        x += Math.log(Math.random());
    }

    x *= - alphaDiv; 

    tmp = Math.log(u3) * 
        (Math.pow(u1, kDiv) /
         ((Math.pow(u1, kDiv) + Math.pow(u2, 1 / (1 - k)))));
    
    tmp *=  - alphaDiv;
        
    return x + tmp;
}

function nextBinomial(p, trials) {
    var counter, sum;

    if ('number' !== typeof p) {
        throw new TypeError('nextBinomial: p must be number.');
    }
    if ('number' !== typeof trials) {
        throw new TypeError('nextBinomial: trials must be number.');
    }
    if (p < 0 || p > 1) {
        throw new TypeError('nextBinomial: p must between 0 and 1.');
    }
    if (trials < 1) {
        throw new TypeError('nextBinomial: trials must be greater than 0.');
    }
    
    counter = 0;
    sum = 0;
        
    while(counter < trials){
	if (Math.random() < p) {	
	    sum += 1;
        }
	counter++;
    }
	      
    return sum;
}



debugger



mean = function(theArray) {
var sum = 0, length = theArray.length;
for(var i=0;i<length;i++) {
sum += theArray[i];
}
return sum/length;
}

std = function(theArray) {
var arithmeticMean = mean(theArray);
var sum = 0, length = theArray.length;
for(var i=0;i<length;i++) {
sum += Math.pow(theArray[i]-arithmeticMean, 2);
}
return Math.pow(sum/length, 0.5);
}
debugger
var a = [];
var N = 10000
var i, len;
i = -1, len = N
for ( ; ++i < len ; ) {
    a.push(nextGamma(2, 6));
}

//i = -1;
//for ( ; ++i < len ; ) {
//    a[i] = Math.log(a[i]);
//}

console.log(mean(a));
console.log(std(a));

// console.log(a)