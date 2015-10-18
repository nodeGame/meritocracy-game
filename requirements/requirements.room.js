/**
 * # Standard Requirements room
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(settings, room, runtimeConf) {
    var node = room.node;
    var channel = room.channel;
    var registry = channel.registry;

    // Creates a stager object to define the game stages.
    var stager = new node.Stager();

    // Functions.

    settings.doChecking = true;

    function connectingPlayer(player) {
        console.log('Player connected to Requirements room.', player.id);

        setTimeout(function() {

            node.remoteSetup('page', player.id, {
                clearBody: true,
                title: { title: 'Welcome!', addToBody: true }
            });

            node.remoteSetup('widgets', player.id, {
                append: { 'Requirements': {
                    root: 'widgets_div',
                    sayResults: true
                } }
            });
            node.remoteSetup('requirements', player.id, settings);

        }, 500);
    }

    function init() {
        var that = this;

        node.on.preconnect(function(player) {
            console.log('Player re-connected to Requirements room.');
            node.game.pl.add(player);
            connectingPlayer(player);
        });

        node.on.pconnect(connectingPlayer);

        node.on.pdisconnect(function(player) {
            console.log('Player disconnected from Requirements room: ' +
                        player.id);
        });

        // Results of the requirements check.
        node.on.data('requirements', function(msg) {
            console.log('requirements');
            console.log(msg.data);
            if (msg.data.success) {
                // Mark client as requirements passed.
                registry.updateClient(msg.from, {apt: true});

                 setTimeout(function() {
                     channel.moveClient(msg.from, channel.waitingRoom.name);
                 }, 1000);
            }
        });

    }

    stager.addStage({
        id: 'requirements',
        cb: function() {
            console.log('Requirements room created.');
        }
    });

    // Define stager.

    stager.setOnInit(init);

    stager
        .init()
        .next('requirements');

    // Return the game.
    game = {};

    // Throws errors if true.
    game.debug = true;

    game.plot = stager.getState();

    game.nodename = 'requirements';

    // game.verbosity = 100;

    return game;
};
