/**
 * # Player code for Meritocracy Game
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game = {};
    
    // Variable here are available to all stages.
    stager.setDefaultGlobals({
        // Total number of players in group.
        totPlayers: gameRoom.game.waitroom.GROUP_SIZE,
    });

    stager.setOnInit(function() {
        var header, frame;
        var COINS;

        console.log('INIT PLAYER!');

        COINS = node.game.settings.INITIAL_COINS;
        node.game.oldContrib = null;
        node.game.oldDemand = null;
        node.game.oldPayoff = null;

        // Setup page: header + frame.
        header = W.generateHeader();
        frame = W.generateFrame();

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);

        // Check if treatment is Endo.
        this.isEndo = function() {
            return node.game.settings.treatmentName === "endo";
        };

        // Valid Bid and Demand.
        this.isValidDemand = this.isValidContribution = function(n) {
            return false !== JSUS.isInt(n, -1, (COINS + 1));
        };
 
        // BID_DONE.
        node.on('BID_DONE', function(bid, isTimeOut) {
            // node.game.timer.stop();
            W.getElementById('submitOffer').disabled = 'disabled';

            node.game.oldContrib = bid.contrib;
            node.game.oldDemand = bid.demand;

            // console.log(' Your contribution: ' + bid.contrib + '.');
            // console.log(' Your demand: ' + bid.demand + '.');
            
            node.done({
                key: 'bid',
                demand: bid.demand,
                contribution: bid.contrib
            });
        });


        // Takes in input the results of _checkInputs_ and correct eventual
        // mistakes. If in the first round a random value is chosen, otherwise
        // the previous decision is repeated. It also updates the screen.
        this.correctInputs = function(checkResults) {
            var contrib, demand;
            var errorC, errorD;

            if (checkResults.success) {
                contrib = parseInt(W.getElementById('contribution').value, 10);

                if (node.game.isEndo()) {
                    demand = parseInt(W.getElementById('demand').value, 10);
                }
            }
            else {

                if (checkResults.errContrib) {

                    if (!node.game.oldContrib) {
                        contrib = JSUS.randomInt(-1, 20);
                    }
                    else {
                        contrib = node.game.oldContrib;
                    }
                    errorC = document.createElement('p');
                    errorC.innerHTML = 'Your contribution was set to ' + contrib;
                    W.getElementById('divErrors').appendChild(errorC);
                    W.getElementById('contribution').value = contrib;
                }

                // In ENDO we check the demand too.
                if (checkResults.errDemand) {

                    if (!node.game.oldDemand) {
                        demand = JSUS.randomInt(-1, 20);
                    }
                    else {
                        demand = node.game.oldDemand;
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
            var contrib, demand;
            var divErrors, errorC, errorD;

            divErrors = W.getElementById('divErrors');

            // Clear previous errors.
            divErrors.innerHTML = '';

            // Always check the contribution.
            contrib = W.getElementById('contribution').value;

            if (!node.game.isValidContribution(contrib)) {
                errorC = document.createElement('p');
                errorC.innerHTML = 'Invalid contribution. ' +
                    'Please enter a number between 0 and ' + COINS;
                divErrors.appendChild(errorC);
            }

            // In ENDO we check the demand too.
            if (node.game.isEndo()) {

                demand = W.getElementById('demand').value;

                if (!node.game.isValidDemand(demand)) {
                    errorD = document.createElement('p');
                    errorD.innerHTML = 'Invalid demand. ' +
                        'Please enter a number between 0 and ' + COINS;
                    divErrors.appendChild(errorD);
                }
            }

            return {
                success: !(errorC || errorD),
                errContrib: !!errorC,
                errDemand: !!errorD
            };
        };

        // This function is called to create the bars.
        this.updateResults = function(barsValues) {
            var group, player, i, j, div, subdiv, color, save;
            var barsDiv, showDemand;
            var text, groupHeader, groupHeaderText, groupNames;
            var payoffSpan, bars;

            // Notice: _barsValues_ array:
            // 0: array: contr, demand
            // 1: array: group, position in group
            // 2: payoff
            // 3: array: groups are compatible or not (only endo)

            groupNames = node.game.settings.GROUP_NAMES;

            showDemand = node.game.isEndo();

            console.log(barsValues);
            console.log(showDemand);

            barsDiv = W.getElementById('barsResults');
            payoffSpan = W.getElementById('payoff');

            barsDiv.innerHTML = '';

            bars = W.getFrameWindow().bars;

            for (i = 0; i < barsValues[0].length; i++) {
                group = barsValues[0][i];
                div = document.createElement('div');
                div.classList.add('groupContainer');
                groupHeader = document.createElement('h4');
                groupHeaderText = 'Group ' + groupNames[i];
                if (showDemand) {
                    groupHeaderText += barsValues[3][i] ? ' (' : ' (not ';
                    groupHeaderText += 'compatible)';
                }
                groupHeader.innerHTML = groupHeaderText;
                barsDiv.appendChild(div);
                div.appendChild(groupHeader);
                for (j = 0; j < group.length; j++) {

                    player = group[j];

                    // It is me?
                    if (barsValues[1][0] === i && barsValues[1][1] === j) {
                        color = [undefined, '#9932CC'];
                        text = ' YOU <img src="imgs/arrow.jpg" style="height:15px;"/>';                       
                    }
                    else {
                        color = ['#DEB887', '#A52A2A'];
                        text = '';
                    }
                    
                    // This is the DIV actually containing the bar
                    subdiv = document.createElement('div');
                    div.appendChild(subdiv);
                    bars.createBar(subdiv, player[0], 20, color[0], text);

                    // TODO: adapt 'YOU'.
                    if (showDemand) {
                        subdiv.classList.add('playerContainer');
                        text = '';
                        // It is me?
                        if (barsValues[1][0] === i && barsValues[1][1] === j) {
                            text = 'YOU <-----';
                        }
                        bars.createBar(subdiv, player[1], 20, color[1], text);
                    }
                    // Was here
                    // div.appendChild(subdiv);
                }
                // Was here
                // barsDiv.appendChild(div);
            }

            node.game.oldPayoff = +barsValues[2]; // final payoff

            // How many coins player put in personal account.
            save = COINS - node.game.oldContrib;
            payoffSpan.innerHTML = save + ' + ' + (barsValues[2] - save) +
                ' = ' + node.game.oldPayoff;
        };

        this.displaySummaryPrevRound = function(treatment) {
            var save, groupReturn;

            // Shows previous round if round number is not 1.
            if (node.game.oldContrib) {

                save = COINS - node.game.oldContrib;
                groupReturn = node.game.oldPayoff - save;

                W.getElementById('previous-round-info').style.display = 'block';

                // Updates display for current round.
                W.setInnerHTML('yourPB', save);
                W.setInnerHTML('yourOldContrib', node.game.oldContrib);
                W.setInnerHTML('yourReturn', groupReturn);
                W.setInnerHTML('yourPayoff', node.game.oldPayoff);

                if (treatment === 'endo') {
                    W.setInnerHTML('yourOldDemand', node.game.oldDemand);
                }
            }
        };

        node.on.data('notEnoughPlayers', function(msg) {
            // Not yet 100% safe. Some players could forge the from field.
            if (msg.from !== '[ADMIN_SERVER]') return;

            node.game.pause();
            W.lockScreen('One player disconnected. We are now waiting to ' +
                         'see if he or she reconnects. If not, the game ' +
                         'will continue with fewer players.');
        });

        node.on('SOCKET_DISCONNECT', function() {
            // Disabled.
            return;
            alert('Connection with the server was terminated. If you think ' +
                  'this is an error, please try to refresh the page. You can ' +
                  'also look for a HIT called ETH Descil Trouble Ticket for ' +
                  'nodeGame and file an error report. Thank you for your ' +
                  'collaboration.');
        });

    });

    // STAGES and STEPS.

    function precache() {
        W.lockScreen('Loading...');
        node.done();
        // Disabled for the moment. It does not reload the QUIZ script.
        return;

        W.preCache([
            node.game.instructionsPage,
            node.game.quizPage,
            // node.game.bidderPage,  // these two are cached by following
            // node.game.resultsPage,    // loadFrame calls (for demonstration)
            'postgame.html',
            'ended.html'
        ], function() {
            // Pre-Caching done; proceed to the next stage.
            node.done();
        });
    }

    function instructions() {
        W.loadFrame(node.game.settings.instrPage, function() {
            var b, n, s;
            
            s = node.game.settings;
            n = node.game.globals.totPlayers;

            W.getElementById('players-count').innerHTML = n;
            W.getElementById('players-count-minus-1').innerHTML = (n-1);
            W.getElementById('rounds-count').innerHTML = s.REPEAT;

            b = W.getElementById('read');
            b.onclick = function() {
                node.done();
            };

            node.env('auto', function() {
                node.timer.randomEmit('DONE', 8000);
            });
        });

        console.log('Instructions');
    }

    function quiz() {
        W.loadFrame(node.game.settings.quizPage, function() {
            node.env('auto', function() {
                node.timer.randomEmit('DONE', 8000);
            });
        });

        console.log('Quiz');
    }

    function showResults(bars) {
        W.loadFrame(node.game.settings.resultsPage, function() {
            node.on.data('results', function(msg) {
                var treatment, b;
                var barsValues;
                console.log('Received results.');

                barsValues = msg.data;
                treatment = node.env('roomType');

                if (treatment === 'endo') {
                    W.getElementById('yourOldDemand').innerHTML =
                        node.game.oldDemand;
                }

                this.updateResults(barsValues);

                b = W.getElementById('submitOffer');
                b.onclick = function() {
                    node.done();
                };

                node.env('auto', function() {
                    node.timer.randomEmit('DONE', 6000);
                });
            });
        });
    }

    function bid() {
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
        W.loadFrame(node.game.settings.bidderPage, function() {
            var b, treatment;

            treatment = node.env('roomType');
            node.game.displaySummaryPrevRound(treatment);

            // Re-enable input.
            W.getElementById('submitOffer').disabled = '';
            // Clear previous errors.
            W.getElementById('divErrors').innerHTML = '';

            // Clear contribution and demand inputs.
            if (treatment === 'endo') {
                W.getElementById('demand').value = '';
            }

            W.getElementById('contribution').value = '';

            b = W.getElementById('submitOffer');

            // AUTOPLAY.
            node.env('auto', function() {
                node.timer.randomExec(function() {
                    var validation, validInputs;
                    validation = node.game.checkInputs();
                    validInputs = node.game.correctInputs(validation);
                    node.emit('BID_DONE', validInputs, false);
                }, 4000);
            });

            // TIMEUP.
            node.on('TIMEUP', function() {
                var validation, validInputs;
                console.log('TIMEUP !');
                validation = node.game.checkInputs();
                validInputs = node.game.correctInputs(validation);
                node.emit('BID_DONE', validInputs, true);
            });

            b.onclick = function() {
                var validation, validInputs;
                validation = node.game.checkInputs();
                if (!validation.success) return;
                validInputs = node.game.correctInputs(validation);
                node.emit('BID_DONE', validInputs, false);
            };

        });

        console.log('Meritocracy: bid page.');
    }

    function postgame() {
        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.game.timer.doTimeUp();
            });
        });
        console.log('Postgame');
    }

    function endgame() {
        node.game.timer.setToZero();
        node.on.data('WIN', function(msg) {
            var win, exitcode, codeErr;
            codeErr = 'ERROR (code not found)';
            win = msg.data && msg.data.win || 0;
            exitcode = msg.data && msg.data.exitcode || codeErr;
            W.writeln('Your bonus in this game is: ' + win);
            W.writeln('Your exitcode is: ' + exitcode);
        });
        
        console.log('Game ended');
    }

//     function clearFrame() {
//         node.emit('INPUT_DISABLE');
//         // We save also the time to complete the step.
//         // TODO. Check if we need it.
//         node.set({
//             key: 'timestep',
//             time: node.timer.getTimeSince('step'),
//             timeup: node.game.timer.gameTimer.timeLeft <= 0
//         });
//         return true;
//     }

    // Add all the stages into the stager.

    // Removed for now.
    //    stager.extendStep('precache', {
    //        cb: precache,
    //        // `minPlayers` triggers the execution of a callback in the case
    //        // the number of players (including this client) falls the below
    //        // the chosen threshold. Related: `maxPlayers`, and `exactPlayers`.
    //        // minPlayers: [nbRequiredPlayers, notEnoughPlayers],
    //        // syncOnLoaded: true,
    //        done: clearFrame
    //    });

    stager.extendStep('instructions', {
        cb: instructions
    });

    stager.extendStep('quiz', {
        cb: quiz,
        done: function() {
            node.game.quizResults.key = 'QUIZ';
            return node.game.quizResults;
        }
    });

    stager.extendStep('bid', {
        cb: bid
    });

    stager.extendStep('results', {
        cb: showResults,
    });


    stager.extendStep('end', {
        frame: 'ended.html',
        cb: endgame,
    });

    stager.extendStep('questionnaire', {
        frame: 'postgame.html',
        cb: postgame,
        timer: 120000,
        done: function() {
            var i, socExpValue, stratChoiceValue;
            var T, gameName, stratComment, socExp, stratChoice, comments;
            var stratCommentErr, errDiv, errors, isTimeUp;
            T = W.getFrameDocument(),
            gameName = T.getElementById('game-name').value,
            stratComment = T.getElementById('strategy-comment').value,
            socExp = T.getElementsByName('played-other-experiment'),
            stratChoice = T.getElementsByName('followed-strategy-choice'),
            comments = T.getElementById('comment').value;

            errors = [],
            stratCommentErr = false,
            errDiv = null;

            // Getting values of form.
            for (i = 0; i < socExp.length; i++) {
                if (socExp[i].checked) {
                    socExpValue = socExp[i].value;
                    break;
                }
            }

            for (i = 0; i < stratChoice.length; i++) {
                if (stratChoice[i].checked) {
                    stratChoiceValue = stratChoice[i].value;
                    break;
                }
            }

            // Checking if values are correct.

            if (gameName === '') {
                errors.push('1.');
            }

            if ('undefined' === typeof socExpValue) {
                errors.push('2.');
            }

            if ('undefined' === typeof stratChoiceValue) {
                errors.push('3.');
            }

            if (stratChoiceValue === 'other') {
                if (stratComment.length < 5) {
                    errors.push('3.');
                    stratCommentErr = true;
                }
            }

            isTimeUp = node.game.timer.gameTimer.timeLeft <= 0;

            if (errors.length && !isTimeUp) {
                errDiv = W.getElementById('divErrors');
                errors = '<p>Please answer question' +
                    (errors.length === 1 ? ' ' + errors[0] :
                     's ' + errors.join(' ')) + '</p>';

                if (stratCommentErr) {
                    errors += '<p>Answer 3. is too short.</p>';
                }

                errDiv.innerHTML = errors;
                return false;
            }

            console.log({
                gameName: gameName,
                socExp: socExpValue,
                stratChoice: stratChoiceValue,
                comments: comments,
                stratComment: stratComment
            });

            // Sending values to server.
            node.set({
                key: 'questionnaire',
                gameName: gameName,
                socExp: socExpValue,
                stratChoice: stratChoiceValue,
                comments: comments,
                stratComment: stratComment
            });

            node.emit('INPUT_DISABLE');
            
            // TODO. Check if we need it.
            node.set({
                key: 'timestep',
                time: node.timer.getTimeSince('step'),
                timeup: isTimeUp
            });
            return true;
        }
    });

    game = setup;
    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    return game;

};