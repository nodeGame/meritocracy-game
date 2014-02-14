/**
 * # Bars Widget
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Displays horizontal bars parametrically.
 *
 * http://www.nodegame.org
 * ---
 */
var bars = function() {
    'use strict';

    var shadeColor;
    var testThreshold = 2;

    shadeColor = function(color, percent) {
        var num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (
            G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 :
            B : 255))
            .toString(16)
            .slice(1);
    };

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
                location.append(
                    '<tr><td><h4>You</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>'
                );
            }
            else {
                location.append(
                    '<tr><td><h4>Your Group</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>'
                );
            }
            for (iter = 1; iter < values.length; iter++) {
                location.append('<tr><td><h4>' + letter + letters[iter] +
                    '</h4></td><td><div class="progContrib"><div class="progress-label">Contribution - <span class="contribVal"></span></div></div><br /><div class="progDemand"><div class="progress-label">Demand - <span class="demandVal"></span></div></div></td></tr>'
                );
            }
            var progDemand = location.find('.progDemand'),
                progContrib = location.find('.progContrib'),
                contribVal = location.find('.contribVal'),
                demandVal = location.find('.demandVal');

            for (iter = 0; iter < progDemand.length; iter++) {
                value = values[iter][1];
                jQuery(progDemand[iter])
                    .progressbar({
                        value: value * 10
                    });
                jQuery(demandVal[iter])
                    .text(value);
            }

            for (iter = 0; iter < progContrib.length; iter++) {
                value = values[iter][0];
                jQuery(progContrib[iter])
                    .progressbar({
                        value: value * 10
                    });
                jQuery(contribVal[iter])
                    .text(value);
            }

            progContrib.find('.ui-progressbar-value')
                .css('background', '#2cabec');
            progContrib.find('.ui-widget-header')
                .css('border', 'solid #2cafff 3px');
            jQuery('.ui-progressbar .ui-progressbar-value')
                .css('margin', '0px');
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
        createBar: function(location, value, maxValue, color, text) {
            var margin, bar, valuePerCent;
            
            if ('undefined' === typeof location ||
                'undefined' === typeof value) {
                return false;
            }

            text = value + ' ' + text || '';;
            maxValue += maxValue*0.2;
            
            valuePerCent = Number(value / maxValue).toFixed(2);
            valuePerCent = parseFloat(valuePerCent, 10) * 100;
            
            bar = document.createElement('div');
            
            
            // debugger
            bar.innerHTML =
                '<div class="progress-label" style="float:right;z-index:100;">' +
                text + '</div>';
            
            jQuery(bar).progressbar({
                value: valuePerCent || 1
            });
            
//           bar.innerHTML +=
//               '<div style="position:absolute;left:0%;display:inline-block;width:25%;border-right:solid gray 1px;z-index:2;">&nbsp;</div>' +
//               '<div style="position:absolute;left:20%;display:inline-block;width:25%;border-right:solid gray 1px;z-index:2;">&nbsp;</div>' +
//               '<div style="position:absolute;left:40%;display:inline-block;width:25%;border-right:solid gray 1px;z-index:2;">&nbsp;</div>';

           location.appendChild(bar);

            // Display optimizations
            
            // margin = value > 0 ? (100 - value + testThreshold) : 95;
            margin = valuePerCent ? valuePerCent + 2.5 : valuePerCent + 3.5;
            
            bar = jQuery(bar);

            // set colors for progressbar #1
            //bar.css({ 'background': 'url(images/white-40x100.png) #ffffff repeat-x 50% 50%;' });
            // $("#pbar1 > div").css({ 'background': 'url(images/lime-1x100.png) #cccccc repeat-x 50% 50%;' });

            bar.css({ 
                background: 'white',
                border: '0px',
                //display: 'inline - block',
                margin: '0px',
                position: 'relative',
                height: '20px',
                marginBottom: '1px'
            });

            bar.find('.ui-progressbar-value').css({
                margin: '0px',
                display: 'inline-block'
            });

            bar.find('.progress-label').css({
                position: 'absolute',
                left: margin + '%',
                fontWeight: 'bold',
                fontSize: '10pt',
            });

            // Understand how it works color variable here.
            if (!color) {
                color = '#FF7700';
                bar.find('.ui-progressbar-value').css('background', color);
                bar.find('.ui-widget-header').css({
                    border: 'solid ' + shadeColor(color, -25) + ' 1px'
                });
            }

            return true;
        },
    };
};
bars = bars();