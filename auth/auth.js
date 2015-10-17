/**
 * # Authorization functions
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(auth) {

    // The auth object contains a number of callbacks that specify
    // how the channel handles authorization / identification
    // of incoming connections.

    // The Auth API defines 3 callbacks:

    // auth.authorization('player', authPlayers);
    // auth.clientIdGenerator('player', idGen);
    auth.clientObjDecorator('player', decorateClientObj);

    // All of them accept a variable number of parameters.
    // The first one specifies whether they apply only to
    // the 'player', the 'admin', (or both) server. If they
    // apply for both, this parameter can be omitted completely.
    // The second parameter defines the actual callback, and it
    // is explained in the examples below.

    // ## Authorization function
    //
    // Extra auth function beside default token authorization
    //
    // This is executed before the client the PCONNECT listener.
    // Here, direct messages to the client can be sent only using
    // his socketId property, since no clientId has been created yet.
    //
    // <channel> is a reference to the channel object, it is the same
    //           for all connections.
    //
    // <info> is an object containing information specific for the
    //        incoming connections, formatted as follows:
    //
    //      {
    //         headers: Info about connections
    //         cookies: Cookies passed on connections
    //         room: The requested room for connection, null otherwise
    //         clientId: If specified by the signed token, null otherwise
    //         clientType: The client type: e.g. 'player', 'bot', ...
    //         validSessionCookie: TRUE if the channel session is matched
    //      }
    //
    function authPlayers(channel, info) {
        // TRUE, means client is authorized.
        return true;
    }

    // ## Client ID generation function
    //
    // Specifies an ID for incoming connections
    //
    // Overwrites any cookie found
    //
    // See the authorization function for the explanation of the callback
    // input parameter <channel> and <info>.
    //
    // @see ServerChannel.registry.generateClientId
    //
    function idGen(channel, info) {
        // Returns a valid client ID (string) or undefined.
        return;
    }

    // ## Client object decoration function
    //
    // Modifies the client object that will be stored in the registry
    //
    // <clientObj> The client object contains already a number of properties,
    // which vary depending on the server configuration. Some properties
    // can never be modified, or an error will be thrown. They are:
    //
    //  - id
    //  - sid
    //  - admin
    //  - clientType
    //
    // <info> See the authorization function for description
    //
    // In this example the type of browser is added.
    //
    function decorateClientObj(clientObj, info) {
        if (info.headers) clientObj.userAgent = info.headers['user-agent'];
    }
};
