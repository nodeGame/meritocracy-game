var bars = function() {
    'use strict';

    return {

        /**
         * Creates the progressbars for given values.
         * @param {object} location id of the table
         * @param {2d array} values   [i][0] = ith contrib, [i][1] = ith demand
         */
        init: function(location, values, letter) {
            console.log(values, letter);
            var iter, value;
            var letters = ['.', '.a', '.b', '.c', '.d', '.e', '.f'];
            location = jQuery(location);
            location.empty();
            if (letter === 'P') {
                location.append('<tr><td><h4>You</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>');
            } else {
                location.append('<tr><td><h4>Your Group</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>');
            }
            for (iter = 1; iter < values.length; iter++) {
                location.append('<tr><td><h4>' + letter + letters[iter] + '</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>');
            }
            var progDemand = location.find('.progDemand'),
                progContrib = location.find('.progContrib'),
                contribVal = location.find('.contribVal'),
                demandVal = location.find('.demandVal');

            for (iter = 0; iter < progDemand.length; iter++) {
                value = values[iter][1];
                jQuery(progDemand[iter]).progressbar({
                    value: value * 10
                });
                jQuery(demandVal[iter]).text(value);
            }

            for (iter = 0; iter < progContrib.length; iter++) {
                value = values[iter][0];
                jQuery(progContrib[iter]).progressbar({
                    value: value * 10
                });
                jQuery(contribVal[iter]).text(value);
            }

            progContrib.find('.ui-progressbar-value').css('background', '#2cabec');
            progContrib.find('.ui-widget-header').css('border', 'solid #2cafff 3px');
            jQuery('.ui-progressbar .ui-progressbar-value').css('margin', '0px');
            progDemand.css('margin-bottom', '20px');
            progContrib.css('margin-top', '20px');
        },

        /**
         * Appends a single bar.
         * @param  {string} location HTML element where the bar is created.
         * @param  {int} value    percent of how much the bar should be filled
         * @param  {string} color    color of the bar (Hex or string)
         * @param  {string} text     text to put inside the bar
         */
        createBar: function(location, value, color, text) {
            var bar = document.createElement('div');
            if (!location || !value) {
                return false;
            }
            if (value < 1 && value !== 0) {
                value = value * 100;
            }
            text = text || '';
            bar.innerHTML = '<div class="progress-label">' + text + '</div>';
            jQuery(bar).progressbar({
                value: value
            });
            location.appendChild(bar);

            // Display optimizations
            location = jQuery(location);
            location.find('.ui-progressbar .ui-progressbar-value').css('margin', '0px');
            location.find('.ui-progressbar').css({
                display: 'inline - block',
                position: 'relative',
                height: '20px',
                marginBottom: '10px',
            });
            location.find('.progress-label').css({
                position: 'absolute',
                left: '45%',
                fontWeight: 'bold',
                fontSize: '10pt',
            });
            return true;
        },
    };
};
bars = bars();