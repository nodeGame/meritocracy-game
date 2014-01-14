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

var settings = module.parent.exports.settings;

//Number Of required players to play the game:
var nbRequiredPlayers = settings.MIN_PLAYERS;

module.exports = game;

// GLOBALS

game.globals = {};

// INIT and GAMEOVER

stager.setOnInit(function() {
    var that = this;
    var waitingForPlayers;
    node.game.INITIAL_COINS = node.env('INITIAL_COINS');
    node.game.oldContribDemand = null;

    // Change so that roomtype is set as decided in game.room.
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

    node.on('BID_DONE', function(bid, isTimeOut) {
        node.game.timer.stop();
        W.getElementById('submitOffer').disabled = 'disabled';
        node.set('bid', {
            demand: bid.demand,
            contribution: bid.contrib,
            isTimeOut: isTimeOut
        });
        console.log(' Your contribution: ' + bid.contrib + '.');
        console.log(' Your demand: ' + bid.demand + '.');
        node.done();
    });

    this.shouldCheckDemand = function() {
        return node.env('roomType') === "endo";
    };

    this.getPreviousChoice = function() {
        var values;
        // Old contribution and demand for all players.
        values = node.game.oldContribDemand;
        return {
            contrib: +values[0][values[1][0]][values[1][1]][0],
            demand: +values[0][values[1][0]][values[1][1]][1]
        };
    };

    this.getPreviousPayoff = function() {
        return node.game.oldContribDemand[2];
    };

    // Takes in input the results of _checkInputs_ and correct eventual
    // mistakes. If in the first round a random value is chosen, otherwise
    // the previous decision is repeated. It also updates the screen.
    this.correctInputs = function(checkResults) {
        var contrib, demand, previousChoice;
        var errorC, errorD;

        if (checkResults.success) {
            contrib = parseInt(W.getElementById('contribution').value, 10);
            demand = parseInt(W.getElementById('demand').value, 10);
        } else {
            previousChoice = node.game.getPreviousChoice();

            if (checkResults.errContrib) {

                if (node.game.getCurrentGameStage().round === 1) {
                    contrib = JSUS.randomInt(-1, 10);
                } else {
                    contrib = previousChoice.contrib;
                }
                errorC = document.createElement('p');
                errorC.innerHTML = 'Your contribution was set to ' + contrib;
                W.getElementById('divErrors').appendChild(errorC);
                W.getElementById('contribution').value = contrib;
            }

            // In ENDO we check the demand too.
            if (checkResults.errDemand) {

                if (node.game.getCurrentGameStage().round === 1) {
                    demand = JSUS.randomInt(-1, 10);
                } else {
                    demand = previousChoice.demand;
                }
                errorD = document.createElement('p');
                errorD.innerHTML = 'Your demand was set to ' + demand;
                W.getElementById('divErrors').appendChild(errorD);
                W.getElementById('demand').value = demand;
            }
        }

        return {
            contrib: contrib,
            demand: demand
        };
    };

    // Retrieves and checks the current input for contribution, and for
    // demand (if requested). Returns an object with the results of the 
    // validation. It also displays a message in case errors are found.
    this.checkInputs = function() {
        var contrib, demand, values;
        var divErrors, errorC, errorD;

        divErrors = W.getElementById('divErrors');

        // Clear previous errors.
        divErrors.innerHTML = '';

        // Always check the contribution.
        contrib = W.getElementById('contribution').value;

        if (!node.game.isValidContribution(contrib)) {
            errorC = document.createElement('p');
            errorC.innerHTML = 'Invalid contribution. ' +
                'Please enter a number between 0 and 10.';
            divErrors.appendChild(errorC);
        }

        // In ENDO we check the demand too.
        if (node.game.shouldCheckDemand()) {

            demand = W.getElementById('demand').value;

            if (!node.game.isValidDemand(demand)) {
                errorD = document.createElement('p');
                errorD.innerHTML = 'Invalid demand. ' +
                    'Please enter a number between 0 and 10.';
                divErrors.appendChild(errorD);
            }
        }

        return {
            success: !(errorC || errorD),
            errContrib: !! errorC,
            errDemand: !! errorD
        };
    };

    // This function is called to create the bars.
    this.updateResults = function() {
        var group, player, iter, jter, div, subdiv, color, save,
            values, barsDiv, showDemand, payoffSpan;

        values = node.game.oldContribDemand;
        showDemand = !! values[0][0][0][1];

        barsDiv = W.getElementById('barsResults');
        payoffSpan = W.getElementById('payoff');

        barsDiv.innerHTML = '';

        bars = W.getFrameWindow().bars;

        for (iter = 0; iter < values[0].length; iter++) {
            group = values[0][iter];
            div = document.createElement('div');
            div.classList.add('groupContainer');
            for (jter = 0; jter < group.length; jter++) {
                color = values[1][0] === iter && values[1][1] === jter ? [undefined, '#9932CC'] : ['#DEB887', '#A52A2A'];
                player = group[jter];
                subdiv = document.createElement('div');
                bars.createBar(subdiv, player[0] * 10, color[0], player[0]);

                if (showDemand) {
                    subdiv.classList.add('playerContainer');
                    bars.createBar(subdiv, player[1] * 10, color[1], player[1]);
                }
                div.appendChild(subdiv);
            }
            barsDiv.appendChild(div);
        }

        save = node.game.INITIAL_COINS - values[0][values[1][0]][values[1][1]][0];
        payoffSpan.innerHTML = save + ' + ' + (+values[2] - save) + ' = ' + values[2];
    };

    this.isValidContribution = function(n) {
        n = parseInt(n, 10);
        return !isNaN(n) && isFinite(n) && n >= 0 && n <= 10;
    };

    this.isValidDemand = function(n) {
        n = parseInt(n, 10);
        return !isNaN(n) && isFinite(n) && n >= 0 && n <= 10;
    };

    this.fitPage2Treatment = function(treatment) {
        var iter, toHide;
        // Hides Demand if room type is not endo.
        W.getElementById('demandBox').style.display =
            treatment === 'endo' ? '' : 'none';

        // Shows the correct helper text depending on game type.
        if (treatment === 'blackbox') {
            toHide = W.getFrameDocument()
                .getElementsByClassName('other-game-type');
        } else {
            toHide = W.getFrameDocument()
                .getElementsByClassName('blackbox-game-type');
        }

        for (iter = 0; iter < toHide.length; iter++) {
            toHide[iter].style.display = 'none';
        }
    };

    this.displaySummaryPrevRound = function(treatment) {
        var oldChoice, oldContrib, oldDemand, payoff, save, groupReturn;

        // Shows previous round if round number is not 1.
        if (node.game.getCurrentGameStage().round !== 1) {

            oldChoice = node.game.getPreviousChoice();
            oldContrib = oldChoice.contrib;
            payoff = node.game.getPreviousPayoff();
            save = node.game.INITIAL_COINS - oldContrib;
            groupReturn = payoff - save;

            W.getElementById('previous-round-info').style.display = 'block';
            // Updates display for current round.
            W.getElementById('yourPB').innerHTML = save;
            W.getElementById('yourOldContrib').innerHTML = oldContrib;
            W.getElementById('yourReturn').innerHTML = groupReturn;
            W.getElementById('yourPayoff').innerHTML = payoff;

            if (treatment === 'endo') {
                oldDemand = oldChoice.demand;
                W.getElementById('yourOldDemand').innerHTML = oldDemand;
            } else {
                W.getElementById('summaryPreviousDemand').style.display = 'none';
            }
        }
    };

});

stager.setOnGameOver(function() {
    // Do something.
});

///// STAGES and STEPS


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

    W.loadFrame('/meritocracy/html/instructions.html', function() {

        var b = W.getElementById('read');
        b.onclick = function() {
            node.done();
        };

        if (/low|high/g.test(node.game.roomType)) {
            W.getElementById('lowhigh').style.display = 'inline';
        } else {
            W.getElementById(node.game.roomType).style.display = 'inline';
        }

        node.env('auto', function() {
            node.timer.randomEmit('DONE', 2000);
        });

    });

    console.log('Instructions');
}

function quiz() {
    var quizpage;
    quizpage = /low|high/g.test(node.game.roomType) ?
        '/meritocracy/html/quiz.exo_high_low.html' :
        '/meritocracy/html/quiz.' + node.game.roomType + '.html';

    W.loadFrame(quizpage, function() {
        node.env('auto', function() {
            node.timer.randomEmit('DONE', 2000);
        });
    });

    console.log('Quiz');
}

function showResults(values) {

    W.loadFrame('/meritocracy/html/results.html', function() {
        node.on.data('results', function(values) {
            var treatment, b, demand;
            treatment = node.env('roomType');

            console.log('Received results.');
            values = !! values ? values.data : node.game.oldContribDemand;
            node.game.oldContribDemand = values;

            node.game.fitPage2Treatment(treatment);

            if (treatment === 'endo') {
                demand = +values[0][values[1][0]][values[1][1]][1];
                W.getElementById('yourOldDemand').innerHTML = demand;
            }

            this.updateResults();

            b = W.getElementById('submitOffer');
            b.onclick = function() {
                node.done();
            };
        });
    });
}

function bid() {

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
        var treatment;

        treatment = node.env('roomType');

        node.game.displaySummaryPrevRound(treatment);

        // Re-enable input.
        W.getElementById('submitOffer').disabled = '';
        // Clear previous errors.
        W.getElementById('divErrors').innerHTML = '';

        // Clear contribution and demand inputs.
        W.getElementById('demand').value = '';
        W.getElementById('contribution').value = '';

        // Customize the page for the different treatments.
        node.game.fitPage2Treatment(treatment);

        b = W.getElementById('submitOffer');

        // AUTOPLAY.
        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.emit('BID_DONE', JSUS.randomInt(-1, 10),
                    JSUS.randomInt(-1, 10), other);
            }, 4000);
        });

        // TIMEUP.
        node.on('TIMEUP', function() {
            var validation;
            console.log('TIMEUP !');
            validation = node.game.checkInputs();
            validInputs = node.game.correctInputs(validation);
            node.emit('BID_DONE', validInputs, true);
        });

        b.onclick = function() {
            var validation;
            validation = node.game.checkInputs();
            if (!validation.success) return;
            validInputs = node.game.correctInputs(validation);
            node.emit('BID_DONE', validInputs, false);
        };

    });

    console.log('Meritocracy: bid page.');
}

function postgame() {
    W.loadFrame('/meritocracy/html/postgame.html', function() {

        node.env('auto', function() {
            node.timer.randomEmit('DONE');
        });

        var b = W.getElementById('comment_done');
        b.onclick = function() {
            debugger;
            var iter,
                T = W.getFrameDocument(),
                gameName = T.getElementById('game-name').value,
                stratComment = T.getElementById('strategy-comment').value,
                socExp = T.getElementsByName('played-other-experiment'),
                stratChoice = T.getElementsByName('followed-strategy-choice'),
                comments = T.getElementById('comment').value;

            // Getting values of form.
            for (iter = 0; iter < socExp.length; iter++) {
                if (socExp[iter].checked) {
                    socExp = socExp[iter].value;
                    break;
                }
            }

            for (iter = 0; iter < stratChoice.length; iter++) {
                if (stratChoice[iter].checked) {
                    stratChoice = stratChoice[iter].value;
                    break;
                }
            }

            // Checking if values are correct.
            if (['0', '1'].indexOf(socExp.toString()) === -1) {
                W.getElementById('divErrors').innerHTML =
                    '<p>Please select an answer for each question with *.</p>';
                return false;
            }

            if (['random',
                'egoist',
                'team',
                'other'
            ].indexOf(stratChoice) === -1) {
                W.getElementById('divErrors').innerHTML =
                    '<p>Please select an answer for question 3.</p>';
                return false;
            }

            if (gameName === '') {
                W.getElementById('divErrors').innerHTML =
                    '<p>Please give a game name at question 1.</p>';
                return false;
            }

            console.log({
                gameName: gameName,
                socExp: socExp,
                stratChoice: stratChoice,
                comments: comments,
                stratComment: stratComment
            });

            // Sending values to server.
            node.set('questionnaire', {
                gameName: gameName,
                socExp: socExp,
                stratChoice: stratChoice,
                comments: comments,
                stratComment: stratComment
            });

            alert('Thank you very much. Game Ended.');
            node.done();

        };
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
    cb: bid,
    done: clearFrame,
    timer: {
        milliseconds: 200000,
        timeup: 'TIMEUP'
    }
});

stager.addStep({
    id: 'results',
    cb: showResults,
    timer: 1000000
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
//    .next('precache')
//.next('instructions')
//    .next('quiz')
//.repeat('meritocracy', REPEAT)
.next('questionnaire')
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
    auto: settings.AUTO,
    INITIAL_COINS: settings.INITIAL_COINS
};
game.verbosity = 100;