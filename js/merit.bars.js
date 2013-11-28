var bars = function() {
    'use strict';

    return {

        /**
         * Creates the bar for values.
         * @param {object} location id of the table
         * @param {2d array} values   [i][0] = ith contrib, [i][1] = ith demand
         */
        init: function(location, values, letter) {
            console.log(values, letter);
            var iter, value;
            location = jQuery(location);
            location.empty();
            for (iter in values) {
                location.append('<tr><td><h4>' + letter + (parseInt(iter) + 1) + '</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>');
            }
            var progDemand = location.find('.progDemand'),
                progContrib = location.find('.progContrib'),
                contribVal = location.find( '.contribVal'),
                demandVal = location.find('.demandVal');

            for (iter = 0; iter < progDemand.length; iter++) {
                value = values[iter][1];
                jQuery(progDemand[iter]).progressbar({
                    value: value
                });
                jQuery(demandVal[iter]).text(value);
            }

            for (iter = 0; iter < progContrib.length; iter++) {
                value = values[iter][0];
                jQuery(progContrib[iter]).progressbar({
                    value: value
                });
                jQuery(contribVal[iter]).text(value);
            }

            progContrib.find('.ui-progressbar-value').css('background', '#2cabec');
            progContrib.find('.ui-widget-header').css('border', 'solid #2cafff 3px');
            jQuery('.ui-progressbar .ui-progressbar-value').css('margin', '0px');
            progDemand.css('margin-bottom', '20px');
            progContrib.css('margin-top', '20px');
        },
    };
};
bars = bars();