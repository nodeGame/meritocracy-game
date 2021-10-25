/**
 * # Player code for Meritocracy Game
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

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
        this.visualRound = node.widgets.append('VisualRound', header, {
            title: false
        });
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.doneButton = node.widgets.append('DoneButton', header);

        // Check if treatment is Endo.
        this.isEndo = function() {
            return node.game.settings.treatmentName === "endo";
        };

        // Valid Bid and Demand.
        this.isValidDemand = this.isValidContribution = function(n) {
            return false !== JSUS.isInt(n, -1, (COINS+1));
        };

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

                    if ('number' !== typeof node.game.oldContrib) {
                        contrib = JSUS.randomInt(-1, 20);
                    }
                    else {
                        contrib = node.game.oldContrib;
                    }
                    errorC = document.createElement('p');
                    errorC.innerHTML = 'Your contribution was set to ' +contrib;
                    W.getElementById('divErrors').appendChild(errorC);
                    W.getElementById('contribution').value = contrib;
                }

                // In ENDO we check the demand too.
                if (checkResults.errDemand) {

                    if ('number' !== typeof node.game.oldDemand) {
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
                contribution: contrib,
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
                        text = ' YOU <img src="imgs/arrow.jpg" ' +
                            'style="height:15px;"/>';
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

        this.displaySummaryPrevRound = function() {
            var save, groupReturn;

            // Shows previous round if round number is not 1.
            if ('number' === typeof node.game.oldContrib) {

                save = COINS - node.game.oldContrib;
                groupReturn = node.game.oldPayoff - save;

                W.getElementById('previous-round-info').style.display = 'block';

                // Updates display for current round.
                W.setInnerHTML('yourPB', save);
                W.setInnerHTML('yourOldContrib', node.game.oldContrib);
                W.setInnerHTML('yourReturn', groupReturn);
                W.setInnerHTML('yourPayoff', node.game.oldPayoff);

                if (node.game.isEndo()) {
                    W.setInnerHTML('yourOldDemand', node.game.oldDemand);
                }
            }
        };


        // node.on.data('notEnoughPlayers', function(msg) {
        //     // Not yet 100% safe. Some players could forge the from field.
        //     if (msg.from !== '[ADMIN_SERVER]') return;
        //
        //     node.game.pause();
        //     W.lockScreen('One player disconnected. We are now waiting to ' +
        //                  'see if he or she reconnects. If not, the game ' +
        //                  'will continue with fewer players.');
        // });


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

    stager.extendStep('instructions', {
        frame: settings.instrPage,
        cb: function() {
            var n, s;
            s = node.game.settings;
            n = node.game.globals.totPlayers;
            W.setInnerHTML('players-count', n);
            W.setInnerHTML('players-count-minus-1', (n-1));
            W.setInnerHTML('rounds-count', s.REPEAT);
            console.log('Instructions');
        }
    });

    stager.extendStep('quiz', {
        frame: 'quiz.html',
        init: function() {
            this.quizStuff = {
                // Coins.
                coins: 'How many coins do you get each of the 20 rounds ?',
                coinsChoices: [ 20, 10, 5, 'Other' ],
                coinsCorrect: 0,
                // Lowest Pay.
                lowestPay: 'If you put 5 in the group account, what is the ' +
                    'lowest payment you are guaranteed from this round ?',
                lowestPayChoices: [ 5, 7.5, 10, 'Other' ],
                lowestPayCorrect: 1,
                // Guarantee Pay.
                guaranteePay: 'If you put 5 in the group account, and all ' +
                    'others do the same, how much are you guaranteed from ' +
                    'this round ?',
                guranteePayChoices: [ 7.5, 15, 20, 'Other' ],
                guaranteePayCorrect: 1,
                // Likelyness.
                likely: 'Are you more likely to be matched in a group with ' +
                    'other high-contributers if you also put in a large ' +
                    'amount than if you put in only a small amount ?',
                likelyChoices: [
                    'Yes', 'No', 'Other',
                    [ 'true if&lt;5, false if&gt;5', '5' ]
                ],
                likelyCorrect: 0
            };
        },
        cb: function() {
            var w, qs, t;
            t = this.settings.treatmentName;
            qs = this.quizStuff;

            /////////////////////////////////////////////////////////////
            // nodeGame hint: the widget collection
            //
            // Widgets are re-usable components with predefined methods,
            // such as: hide, highlight, disable, getValues, etc.
            // Here we use the `ChoiceManager` widget to create a quiz page.
            w = node.widgets;
            this.quiz = w.append('ChoiceManager', W.getElementById('root'), {
                id: 'quizzes',
                title: false,
                forms: [
                    w.get('ChoiceTable', {
                        id: 'coinsEveryRound',
                        shuffleChoices: true,
                        title: false,
                        choices: qs.coinsChoices,
                        correctChoice: qs.coinsCorrect,
                        mainText: qs.coins
                    }),
                    w.get('ChoiceTable', {
                        id: 'lowestPayment',
                        shuffleChoices: true,
                        title: false,
                        choices: qs.lowestPayChoices,
                        correctChoice: qs.lowestPayCorrect,
                        mainText: qs.lowestPay
                    }),
                    w.get('ChoiceTable', {
                        id: 'leastGuarantee',
                        shuffleChoices: true,
                        title: false,
                        choices: qs.guranteePayChoices,
                        correctChoice: qs.guaranteePayCorrect,
                        mainText: qs.guaranteePay
                    }),
                    w.get('ChoiceTable', {
                        id: 'likeliness',
                        shuffleChoices: true,
                        title: false,
                        choices: qs.likelyChoices,
                        correctChoice: qs.likelyCorrect,
                        mainText: qs.likely
                    })
                ]
            });
        },
        done: function() {
            var answers, isTimeup;
            answers = this.quiz.getValues({
                markAttempt: true,
                highlight: true
            });
            isTimeup = node.game.timer.isTimeup();
            if (!answers.isCorrect && !isTimeup) return false;
            return answers;
        }
    });

    stager.extendStep('bid', {
        frame: settings.bidderPage,
        cb: function() {
            // Show summary previous round.
            node.game.displaySummaryPrevRound();

            // Clear previous errors.
            W.setInnerHTML('divErrors', '');

            // Clear contribution and demand inputs.
            W.getElementById('contribution').value = '';
            if (node.game.isEndo()) W.getElementById('demand').value = '';

            console.log('Meritocracy: bid page.');
        },
        done: function() {
            var validation, bid;
            validation = node.game.checkInputs();
            // Do not go forward if it is not timeup and validation failed.
            if (!node.game.timer.isTimeup() && !validation.success) {
                return false;
            }
            bid = node.game.correctInputs(validation);
            // Store reference for next round.
            node.game.oldContrib = bid.contribution;
            node.game.oldDemand = bid.demand;
            // Send it to server.
            return bid;
        }
    });

    stager.extendStep('results', {
        frame: settings.resultsPage,
        cb: function () {
            node.on.data('results', function(msg) {
                var treatment, barsValues;

                console.log('Received results.');

                barsValues = msg.data;
                treatment = node.env('roomType');

                if (treatment === 'endo') {
                    W.setInnerHTML('yourOldDemand', node.game.oldDemand);
                }

                this.updateResults(barsValues);
            });
        }
    });

    stager.extendStep('questionnaire', {
        frame: 'postgame.html',
        widget: {
            name: 'ChoiceManager',
            root: 'root',
            options: {
                id: 'questionnaire',
                title: false,
                forms:  [
                    {
                        name: 'ChoiceTable',
                        id: 'alreadyParticipated',
                        choices: [ 'Yes', 'No' ],
                        requiredChoice: true,
                        title: false,
                        mainText: 'Have you participated in other ' +
                            'social experiments before ?'
                    },
                    {
                        name: 'ChoiceTable',
                        id: 'strategy',
                        choices: [
                            [ 'random', 'Randomly chose numbers' ],
                            [ 'egoist', 'Maximized my own personal payoff' ],
                            [ 'team', 'Maximized group payoff' ],
                            [ 'other', 'Other (please described below)' ]
                        ],
                        title: false,
                        orientation: 'v',
                        requiredChoice: true,
                        mainText: 'Describe the strategy you played:'
                    }
                ],
                freeText: 'Leave here any feedback for the experimenter'
            }
        }
    });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'ended.html',
        widget: {
            name: 'EndScreen',
            root: 'root',
            options: {
                panel: false,
                title: false,
                feedback: false,
                exitCode: false,
                email: {
                    texts: {
                        label: 'Enter your email (optional):'
                    }
                }
            }
        }
    });
};
