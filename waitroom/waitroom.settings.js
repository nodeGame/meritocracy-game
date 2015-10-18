/**
 * # Waiting Room settings
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // How many clients must connect before groups are formed.
    POOL_SIZE: 3,

    // The size of each group.
    GROUP_SIZE: 3,

    // Treatment assigned to groups.
    // If left undefined, a random treatment will be selected.
    // Use "treatment_rotate" for rotating all the treatments.
    CHOSEN_TREATMENT: 'singapore', // 'treatment_rotate',

    // Maximum waiting time.
    MAX_WAIT_TIME: 600000,

    // Optional callback function to be executed when the timeout for the
    // maximum waiting time of a player in the waiting room expires.
    ON_TIMEOUT: function(data) {
        // Do something.
        var timeOut;

        // Enough Time passed, not enough players connected.
        if (data.over === 'Time elapsed!!!') {

            timeOut = "<h3 align='center'>Thank you for your patience.<br>";
            timeOut += "Unfortunately, there are not enough participants in ";
            timeOut += "your group to start the experiment.<br>";
        }

        // Too much time passed, but no message from server received.
        else {
            timeOut = "An error has occurred. You seem to be ";
            timeOut += "waiting for too long. Please look for a HIT called ";
            timeOut += "<strong>ETH Descil Trouble Ticket</strong> and file ";
            timeOut += "a new trouble ticket reporting your experience."
        }

        if (data.exit) {
            timeOut += "<br>Please submit the HIT using this exit code: " +
                data.exit;
        }

        timeOut += "<br></h3>";

        this.bodyDiv.innerHTML = timeOut;
    }
};
