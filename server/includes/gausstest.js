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
var nextNormal = (function(mu, sigma) {

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