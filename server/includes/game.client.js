/**
 * # Client code for Ultimatum Game
 * Copyright(c) 2013 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
 *
 * http://www.nodegame.org
 * ---
 */

var ngc = module.parent.exports.ngc;
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

var stager = new Stager();
var game = {};

//Number Of required players to play the game:
var nbRequiredPlayers = 2;

module.exports = game;

// GLOBALS

game.globals = {};

// INIT and GAMEOVER

stager.setOnInit(function() {
    var that = this;
    var waitingForPlayers;
    node.game.INIT_NB_COINS = 10;
    node.game.oldContribDemand = [
        [
            [
                [0],
                [0],
                [0],
                [0]
            ],
            [
                [0],
                [0],
                [0],
                [0]
            ],
            [
                [0],
                [0],
                [0],
                [0]
            ],
            [
                [0],
                [0],
                [0],
                [0]
            ],
        ],
        [0, 2],
        0,
    ];

    // Change so that roomtype is set as decided in game.room
    node.game.roomType = node.env('roomType');

    console.log('INIT PLAYER!');

    // Hide the waiting for other players message.
    waitingForPlayers = W.getElementById('waitingForPlayers');
    waitingForPlayers.innerHTML = '';
    waitingForPlayers.style.display = 'none';

    // Set up the main screen:
    // - visual timer widget,
    // - visual state widget,
    // - state display widget,
    // - iframe of play,
    // - player.css
    W.setupFrame('PLAYER');

    this.other = null;

    node.on('BID_DONE', function(contribution, demand, isTimeOut) {
        // TODO: check this timer obj.
        node.game.timer.stop();
        W.getElementById('submitOffer').disabled = 'disabled';
        node.set('bid', {
            demand: demand,
            contribution: contribution,
            isTimeOut: isTimeOut
        });
        console.log(' Your contribution: ' + contribution + '.');
        console.log(' Your demand: ' + demand + '.');
        W.getElementById('demand').value = demand;
        W.getElementById('contribution').value = contribution;
        node.done();
    });

    this.updateResults = function() {
        var group, player, iter, jter, div, subdiv, color, save;
        var values = node.game.oldContribDemand,
        showDemand = !! values[0][0][0][1];
        var barsDiv = W.getElementById('barsResults'),
        payoffSpan = W.getElementById('payoff');
        node.game.bars = document.getElementById('mainframe').contentWindow.bars;
        barsDiv.innerHTML = '';
        for (iter = 0; iter < values[0].length; iter++) {
            group = values[0][iter];
            div = document.createElement('div');
            div.classList.add('groupContainer');
            for (jter = 0; jter < group.length; jter++) {
                color = values[1][0] === iter && values[1][1] === jter ? [undefined, '#9932CC'] : ['#DEB887', '#A52A2A'];
                player = group[jter];
                subdiv = document.createElement('div');
                node.game.bars.createBar(subdiv, player[0] * 10, color[0], player[0]);
                if (showDemand) {
                    subdiv.classList.add('playerContainer');
                    node.game.bars.createBar(subdiv, player[1] * 10, color[1], player[1]);
                }
                div.appendChild(subdiv);
            }
            barsDiv.appendChild(div);
        }
        save = node.game.INIT_NB_COINS - values[0][values[1][0]][values[1][1]][0];
        payoffSpan.innerHTML = save + ' + ' + (+values[2] - save) + ' = ' + values[2];
    };

    this.randomAccept = function(offer, other) {
        var accepted = Math.round(Math.random());
        console.log('randomaccept');
        console.log(offer + ' ' + other);
        if (accepted) {
            node.emit('RESPONSE_DONE', 'ACCEPT', offer, other);
            W.write(' You accepted the offer.');
        }
        else {
            node.emit('RESPONSE_DONE', 'REJECT', offer, other);
            W.write(' You rejected the offer.');
        }
    };

    this.isValidContribution = function(n) {
        if (!n) {
            return false;
        }
        n = parseInt(n, 10);
        return !isNaN(n) && isFinite(n) && n >= 0 && n <= 10;
    };

    this.isValidDemand = function(n) {
        if (!n) {
            return false;
        }
        n = parseInt(n, 10);
        return !isNaN(n) && isFinite(n) && n >= 0 && n <= 10;
    };

});

stager.setOnGameOver(function() {
    // Do something.
});

///// STAGES and STEPS

//////////////////////////////////////////////
// nodeGame hint:
//
// Pages can be preloaded with this method:
//
// W.preCache()
//
// It loads the content from the URIs given in an array parameter, and the next
// time W.loadFrame() is used with those pages, they can be loaded from memory.
//
// W.preCache calls the function given as the second parameter when it's done.
//
/////////////////////////////////////////////
function precache() {
    W.lockFrame('Loading...');
    W.preCache([
        '/meritocracy/html/instructions.html',
        '/meritocracy/html/quiz.html',
        // '/meritocracy/html/bidder.html',  // these two are cached by following
        // '/meritocracy/html/resp.html',    // loadFrame calls (for demonstration)
        '/meritocracy/html/postgame.html',
        '/meritocracy/html/ended.html'
    ], function() {
        // Pre-Caching done; proceed to the next stage.
        node.done();
    });
}

function instructions() {
    var that = this;

    //////////////////////////////////////////////
    // nodeGame hint:
    //
    // The W object takes care of all
    // visual operation of the game. E.g.,
    //
    // W.loadFrame()
    //
    // loads an HTML file into the game screen,
    // and the execute the callback function
    // passed as second parameter.
    //
    /////////////////////////////////////////////

    W.loadFrame('/meritocracy/html/instructions.html', function() {

        var b = W.getElementById('read');
        b.onclick = function() {
            node.done();
        };

        ////////////////////////////////////////////////
        // nodeGame hint:
        //
        // node.env executes a function conditionally to
        // the environments defined in the configuration
        // options.
        //
        // If the 'auto' environment was set to TRUE,
        // then the function will be executed
        //
        ////////////////////////////////////////////////
        node.env('auto', function() {

            //////////////////////////////////////////////
            // nodeGame hint:
            //
            // Emit an event randomly in a time interval
            // from 0 to 2000 milliseconds
            //
            //////////////////////////////////////////////
            node.timer.randomEmit('DONE', 2000);
        });


        if (/low|high/g.test(node.game.roomType)) {
            W.getElementById('lowhigh').style.display = 'inline';
        } 
        else {
            W.getElementById(node.game.roomType).style.display = 'inline';
        }

    });

    console.log('Instructions');
}

function quiz() {
    var quizpage;
    page = /low|high/g.test(node.game.roomType) ?
        '/meritocracy/html/quiz.exo_high_low.html' :
        '/meritocracy/html/quiz.' + node.game.roomType + '.html';

    W.loadFrame(quizpage);
    
    console.log('Quiz');
}

function showResults(values) {

    W.loadFrame('/meritocracy/html/results.html', function() {
        node.on.data('results', function(values) {
            var contrib;
            console.log('Received results.');
            values = !!values ? values.data : node.game.oldContribDemand;
            node.game.oldContribDemand = values;

            this.updateResults();
            contrib = +values[0][values[1][0]][values[1][1]][0],
            demand = +values[0][values[1][0]][values[1][1]][1];
            W.getElementById('yourContrib').innerHTML = contrib;
            W.getElementById('yourDemand').innerHTML = demand;
            b = W.getElementById('submitOffer');
            b.onclick = function() {
                node.done();
            };
        });
    });
}

function meritocracy() {

    node.game.timer.stop();

    var that = this;

    //////////////////////////////////////////////
    // nodeGame hint:
    //
    // W.loadFrame takes an optional third 'options' argument which can
    // be used to request caching of the displayed frames (see the end
    // of the following function call). The caching mode can be set with
    // two fields: 'loadMode' and 'storeMode'.
    //
    // 'loadMode' specifies whether the frame should be reloaded
    // regardless of caching (loadMode = 'reload') or whether the frame
    // should be looked up in the cache (loadMode = 'cache', default).
    // If the frame is not in the cache, it is always loaded from the
    // server.
    //
    // 'storeMode' says when, if at all, to store the loaded frame. By
    // default the cache isn't updated (storeMode = 'off'). The other
    // options are to cache the frame right after it has been loaded
    // (storeMode = 'onLoad') and to cache it when it is closed, that
    // is, when the frame is replaced by other contents (storeMode =
    // 'onClose'). This last mode preserves all the changes done while
    // the frame was open.
    //
    /////////////////////////////////////////////
    W.loadFrame('/meritocracy/html/bidder.html', function() {
        var toHide, iter;
        var b, options, other;
        var values, oldContrib, payoff, save, groupReturn;
        
        values = node.game.oldContribDemand,
        oldContrib = +values[0][values[1][0]][values[1][1]][0],
        payoff = values[2],
        save = node.game.INIT_NB_COINS - oldContrib,
        groupReturn = payoff - save;

        // Re-enable input.
        W.getElementById('submitOffer').disabled = '';
        // Clear previous errors.
        W.getElementById('divErrors').innerHTML = '';

        // Clear contribution and demand inputs.
        W.getElementById('demand').value = '';
        W.getElementById('contribution').value = '';

        // Shows previous round if round number is not 1.
        if (node.game.getCurrentGameStage().round !== 1) {
            W.getElementById('previous-round-info').style.display = 'block';
        }

        // Updates display for current round.
        W.getElementById('yourPB').innerHTML = save;
        W.getElementById('yourOldContrib').innerHTML = oldContrib;
        W.getElementById('yourReturn').innerHTML = groupReturn;
        W.getElementById('yourPayoff').innerHTML = payoff;


        // Hides Demand if room type is not endo.
        W.getElementById('demandBox').style.display = 
            node.game.roomType === 'endo' ? 'block' : 'none';

        // Shows the correct helper text depending on game type.
        if (node.game.roomType === 'blackbox') {
            toHide = W.getFrameDocument()
                .getElementsByClassName('other-game-type');
        }
        else {
            toHide = W.getFrameDocument()
                .getElementsByClassName('blackbox-game-type');
        }
        for (iter = 0; iter < toHide.length; iter++) {
            toHide[iter].style.display = 'none';
        }

        // Start the timer after an offer was received.
        options = {
            milliseconds: 30000,
            timeup: function() {
                node.emit('BID_DONE', J.randomInt(0,10), J.randomInt(0,10),
                          other);
            }
        };
        node.game.timer.restart(options);

        b = W.getElementById('submitOffer');

        // AUTOPLAY.
        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.emit('BID_DONE', J.randomInt(0,10), J.randomInt(0,10),
                          other);
            }, 4000);
        });

        // TIMEUP.
        node.on('TIMEUP', function() {
            var isTimeOut, contrib;
            
            console.log('TIMEUP !');
            isTimeOut = false;
            contrib = parseInt(W.getElementById('contribution').value),
            demand = parseInt(W.getElementById('demand').value),
            values = node.game.oldContribDemand,
            oldContrib = +values[0][values[1][0]][values[1][1]][0],
            oldDemand = +values[0][values[1][0]][values[1][1]][1];

            if (isNaN(contrib) || contrib === oldContrib) {
                isTimeOut = true;
                if (isNaN(contrib) && node.game.getCurrentGameStage().round === 1) {
                    contrib = Math.round(Math.random() * 10);
                }
                else if (isNaN(contrib)) {
                    contrib = oldContrib;
                }
            }

            if (isNaN(demand) || demand === oldDemand) {
                isTimeOut = true;
                if (isNaN(demand) && node.game.getCurrentGameStage().round === 1) {
                    demand = Math.round(Math.random() * 10);
                }
                else if (isNaN(demand)) {
                    demand = oldDemand;
                }
            }

            contrib = that.isValidDemand(contrib) ? contrib : +oldContrib;
            demand = that.isValidDemand(demand) ? demand : +oldDemand;


            node.emit('BID_DONE', contrib, demand, isTimeOut);
        });

        b.onclick = function() {
            var errorP, contrib, demand;
            contrib = parseInt(W.getElementById('contribution').value),
            demand = parseInt(W.getElementById('demand').value);

            if (!that.isValidContribution(contrib) 
                || !that.isValidDemand(demand)) {

                errorP = document.createElement('p');
                errorP.innerHTML = 'Please enter a number between 0 and 10.';
                W.getElementById('divErrors').appendChild(errorP);
                return;
            }
            node.emit('BID_DONE', contrib, demand, false);
        };

    }, {
        cache: {
            loadMode: 'cache',
            storeMode: 'onClose'
        }
    });

    console.log('Meritocracy');
}

function postgame() {
    W.loadFrame('/meritocracy/html/postgame.html', function() {
        node.env('auto', function() {
            node.timer.randomEmit('DONE');
        });
    });
    console.log('Postgame');
}

function endgame() {
    W.loadFrame('/meritocracy/html/ended.html', function() {
        node.on.data('WIN', function(msg) {
            W.write('Your bonus in this game is: ' + msg.data || 0);
        });
    });

    console.log('Game ended');
}

function clearFrame() {
    node.emit('INPUT_DISABLE');
    return true;
}

function notEnoughPlayers() {
    node.game.pause();
    W.lockFrame('The other player disconnected. We are now waiting to see if ' +
                ' he or she reconnects. If not the game will be terminated.');
}

// Add all the stages into the stager.

//////////////////////////////////////////////
// nodeGame hint:
//
// A minimal stage must contain two properties:
//
// - id: a unique name for the stage
// - cb: a callback function to execute once
//     the stage is loaded.
//
// When adding a stage / step into the stager
// there are many additional options to
// configure it.
//
// Properties defined at higher levels are
// inherited by each nested step, that in turn
// can overwrite them.
//
// For example if a step is missing a property,
// it will be looked into the enclosing stage.
// If it is not defined in the stage,
// the value set with _setDefaultProperties()_
// will be used. If still not found, it will
// fallback to nodeGame defaults.
//
// The most important properties are used
// and explained below.
//
/////////////////////////////////////////////

// A step rule is a function deciding what to do when a player has
// terminated a step and entered the stage level _DONE_.
// Other stepRules are: SOLO, SYNC_STAGE, SYNC_STEP, OTHERS_SYNC_STEP.
// In this case the client will wait for command from the server.
stager.setDefaultStepRule(stepRules.WAIT);

stager.addStage({
    id: 'precache',
    cb: precache,
    // `minPlayers` triggers the execution of a callback in the case
    // the number of players (including this client) falls the below
    // the chosen threshold. Related: `maxPlayers`, and `exactPlayers`.
    minPlayers: [nbRequiredPlayers, notEnoughPlayers],
    syncOnLoaded: true,
    done: clearFrame
});

stager.addStage({
    id: 'instructions',
    cb: instructions,
    minPlayers: [nbRequiredPlayers, notEnoughPlayers],
    syncOnLoaded: true,
    timer: 600000,
    done: clearFrame
});

stager.addStage({
    id: 'quiz',
    cb: quiz,
    minPlayers: [nbRequiredPlayers, notEnoughPlayers],
    syncOnLoaded: true,
    // `timer` starts automatically the timer managed by the widget VisualTimer
    // if the widget is loaded. When the time is up it fires the DONE event.
    // It accepts as parameter:
    //  - a number (in milliseconds),
    //  - an object containing properties _milliseconds_, and _timeup_
    //     the latter being the name of the event to fire (default DONE)
    // - or a function returning the number of milliseconds.
    timer: 6000000,
    done: clearFrame
});

stager.addStep({
    id: 'bid',
    cb: meritocracy,
    done: clearFrame,
    timer: {
        milliseconds: 10000,
        timeup: 'TIMEUP'
    }
});

stager.addStep({
    id: 'results',
    cb: showResults,
    timer: 10000
});

stager.addStage({
    id: 'meritocracy',
    steps: ['bid', 'results'],
    minPlayers: [nbRequiredPlayers, notEnoughPlayers],
    // `syncOnLoaded` forces the clients to wait for all the others to be
    // fully loaded before releasing the control of the screen to the players.
    // This options introduces a little overhead in communications and delay
    // in the execution of a stage. It is probably not necessary in local
    // networks, and it is FALSE by default.
    syncOnLoaded: true,
});

stager.addStage({
    id: 'endgame',
    cb: endgame,
    // `done` is a callback function that is executed as soon as a
    // _DONE_ event is emitted. It can perform clean-up operations (such
    // as disabling all the forms) and only if it returns true, the
    // client will enter the _DONE_ stage level, and the step rule
    // will be evaluated.
    done: clearFrame
});

stager.addStage({
    id: 'questionnaire',
    cb: postgame,
    timer: 60000
});


// Now that all the stages have been added,
// we can build the game plot

var REPEAT = 20;

stager.init()
// .next('precache')
// .next('instructions')
// .next('quiz')
    .repeat('meritocracy', REPEAT)
// .next('questionnaire')
// .next('endgame')
    .gameover();

// We serialize the game sequence before sending it.
game.plot = stager.getState();

// Let's add the metadata information.
game.metadata = {
    name: 'meritocracy',
    version: '0.0.1',
    session: 1,
    description: 'no descr'
};

// Other settings, optional.
game.settings = {
    publishLevel: 2
};
game.env = {
    auto: false
};
game.verbosity = 100;