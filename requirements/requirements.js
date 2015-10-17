/**
 * # Requirements functions
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * List of requirements to test, and what to do in case of failure and success
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(requirements, settings) {

    // Requires list of default requirements.
    var ngr = require('nodegame-requirements');

    /// Add requirements functions to the requirements object.
    requirements.add(ngr.nodegameBasic);
    requirements.add(ngr.speedTest, settings.speedTest);
    requirements.add(ngr.browserDetect, settings.excludeBrowsers);
    requirements.add(ngr.loadFrameTest);
    requirements.add(ngr.cookieSupport);

    // For debugging.
    // requirements.add(ngr.testFail);
    // requirements.add(ngr.testSuccess);

    requirements.setMaxExecutionTime(settings.maxExecTime);

    requirements.onFailure(function() {
        var str, args;
        console.log('failed');
        str = '%spanYou are NOT allowed to take the HIT. If you ' +
            'have already taken it, you must return it.%span';
        args = {
            '%span': {
                'class': 'requirements-fail'
            }
        };
        W.sprintf(str, args, this.summaryResults);

        // You can leave a feedback using the form below.
        // window.feedback = node.widgets.append('Feedback', div);
    });

    requirements.onSuccess(function() {
        var str, args;
        str = '%spanYou are allowed to take the HIT.%span';
        args = {
            '%span': {
                'class': 'requirements-success'
            }
        };
        W.sprintf(str, args, this.summaryResults);
    });

    // Either success or failure.
    // requirements.onComplete(function() {
    // ...something.
    // });

};
