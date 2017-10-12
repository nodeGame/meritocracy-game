/**
 * # Authorization settings
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    /**
     * ## enabled
     *
     * If TRUE, authorization files will be imported and checked
     */
    enabled: false, // [true, false] Default: TRUE.

    /**
     * ## mode
     *
     * The mode for importing the authorization codes
     *
     * Available modes:
     *
     *   - 'dummy': creates dummy ids and passwords in sequential order.
     *   - 'auto': creates random 8-digit alphanumeric ids and passwords.
     *   - 'local': reads the authorization codes from a file. Defaults:
     *              codes.json, code.csv. A custom file can be specified
     *              in settings.file (available formats: json and csv).
     *   - 'remote': fetches the authorization codes from a remote URI.
     *               Available protocol: DeSciL protocol.
     *   - 'custom': The 'customCb' property of the settings object
     *               will be executed with settings and done callback
     *               as parameters.
     *
     */
    mode: 'dummy',

    /**
     * ## nCodes
     *
     * The number of codes to create
     *
     * Modes: 'dummy', 'auto'
     * Default: 100
     */
    // nCodes: 20,

    /**
     * ## addPwd
     *
     * If TRUE, a password field is added to each code
     *
     * Modes: 'dummy', 'auto'
     * Default: FALSE
     */
    // addPwd: true,

    /**
     * ## codesLength
     *
     * The length of generated codes
     *
     * Modes: 'auto'
     * Default: { id: 8, pwd: 8, AccessCode: 6, ExitCode: 6 }
     */
    // codesLength: { id: 8, pwd: 8, AccessCode: 6, ExitCode: 6 },

    /**
     * ## customCb
     *
     * The custom callback associated to mode 'custom'
     *
     * Modes: 'custom'
     */
    // customCb: function(settings, done) { return [ ... ] },

    /**
     * ## inFile
     *
     * The name of the codes file inside auth/ dir or a full path to it
     *
     * Available formats: .csv and .json.
     *
     * Modes: 'local'
     * Default: 'codes.json', 'code.csv' (tried in sequence)
     */
    inFile: 'codes.imported.csv',

    /**
     * ## dumpCodes
     *
     * If TRUE, all imported codes will be dumped to file `outFile`
     *
     * Modes: 'dummy', 'auto', 'local', 'remote', 'custom'
     * Default: TRUE
     */
    // dumpCodes: false

    /**
     * ## outFile
     *
     * The name of the codes dump file inside auth/ dir or a full path to it
     *
     * Only used, if `dumpCodes` is TRUE. Available formats: .csv and .json.
     *
     * Modes: 'dummy', 'auto', 'local', 'remote', 'custom'
     * Default: 'codes.imported.csv'
     */
    // outFile: 'my.imported.codes.csv',

    /**
     * ## claimId
     *
     * If TRUE, remote clients will be able to claim an id via GET request
     *
     * Default: FALSE
     */
    // claimId: true,

    /**
     * ## claimIdValidateRequest
     *
     * Returns TRUE if a requester is authorized to claim an id
     *
     * Returns an error string describing the error otherwise.
     *
     * Default: undefined
     */
    // claimIdValidateRequest: function(query, headers) {
    //    // Check query and headers.
    //    return true;
    //},

    /**
     * ## claimIdPostProcess
     *
     * Manipulates the client object after the claim id process succeeded
     */
    //claimIdPostProcess: function(code, query, headers) {
    //    code.WorkerId = query.id;
    //}

    // # Reserved words for future requirements settings.

    // page: 'login.htm'

};
