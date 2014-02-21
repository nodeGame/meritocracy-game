/**
 * # Waiting room client side for Meritocracy Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Displays a simple waiting page for clients about to start a game.
 * ---
 */
var ngc = module.parent.exports.ngc;
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

var stager = new Stager();
var game = {};

module.exports = game;

// Functions

function waiting2start() {
    var span_connected, span_dots, span_msg;
    span_connected = document.getElementById('span_connected');
    span_dots = document.getElementById('span_dots');
    span_msg = document.getElementById('span_msg');
    // span_atleast = document.getElementById('span_atleast');
    
    // Refreshing the dots...
    setInterval(function() {
        if (span_dots.innerHTML !== '......') {
            span_dots.innerHTML = span_dots.innerHTML + '.';  
        }
        else {
            span_dots.innerHTML = '..';
        }
    }, 1000);

    function updateConnected(data) {
    	span_connected.innerHTML = data.nPlayers + ' / ' + data.poolSize;
        // span_atleast.innerHTML = data.atLeastPlayers;
        if (data.retry) {
            span_msg.innerHTML = 'A batch of games has just started. ' +
                'Unfortunately, you have not been selected. Please, keep ' +
                'waiting, the next batch should start shortly.';
        }
    }
        
    node.on.data('countdown', function(msg) {
        var root, options, timeLeft, options;
        root = document.getElementById('countdown_p');
        timeLeft = msg.data;
        options = {
            fieldset: null,
            milliseconds: timeLeft,
            timeup: 'TIMEUP'
        };
        window.countdown = node.widgets.add('VisualTimer', root, options);
        window.countdown.start();
        
        span_msg.innerHTML = 'Countdown started!';
    });

    node.on.data('countdownStop', function(msg) {
        var fail;
        window.countdown.timerDiv.className = 'strike';
        window.countdown.destroy();
        fail = msg.data;
        if (fail) {
            span_msg.innerHTML = 'One player disconnected and countdown was ' +
                'canceled.';
        }
    });


    node.on('UPDATED_PLIST', function() {
        span_connected.innerHTML = (node.game.pl.size() + 1 )+ ' / '  + 
            node.game.poolSize;
    });

    node.on.data('waitingRoom', function(msg) {
        node.game.poolSize = msg.data.poolSize;
        // node.game.atLeastPlayers = msg.data.atLeastPlayers;
        updateConnected(msg.data);
    });

    node.on('SOCKET_DISCONNECT', function() {
        alert('Connection with the server was terminated. If you think ' +
              'this is an error, please try to refresh the page. You can ' +
              'also look for a HIT called ETH Descil Trouble Ticket for ' +
              'nodeGame and file an error report. Thank you for your ' +
              'collaboration.');
    });

}

// Setting the game plot

stager.addStage({
    id: 'waiting2start',
    cb: waiting2start,
    steprule: stepRules.WAIT
});

stager.init()
    .next('waiting2start');


// Exporting the data.

game.plot = stager.getState();

game.metadata = {
    name: 'Waiting 2 Start - Client',
    description: 'Presents a simple interface while the client waits to start a game.',
    version: '0.1'
};
