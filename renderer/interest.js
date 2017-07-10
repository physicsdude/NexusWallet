(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const remote = require('electron').remote

    console.log("In interest.js")

    function updateGetinfo() {
        console.log("Updating getinfo in interest.js")

        var ldbData = remote.getGlobal('ldbData')
        var getinfo = ldbData.findObject({"nexus": "getinfo"})
        var interestrate = getinfo.res.result.interestweight.toFixed(4) + "%"
        var stakeweight = getinfo.res.result.stakeweight.toFixed(4) + "%"
        var trustweight = getinfo.res.result.trustweight.toFixed(4) + "%"
        var blockweight = getinfo.res.result.blockweight.toFixed(4) + "%"
        console.log("In interest.js interestweight="+interestrate)

        document.getElementById('interestrate').innerHTML = interestrate

        document.getElementById('stakeweight').innerHTML = stakeweight

        document.getElementById('trustweight').innerHTML = trustweight

        document.getElementById('blockweight').innerHTML = blockweight

    } // end updateGetinfo

    $(document).ready(function () {
        updateGetinfo()
        setInterval(function () {
            updateGetinfo()
        }, 100000);
    })
})()

// THE TRUTH IS OUT THERE
