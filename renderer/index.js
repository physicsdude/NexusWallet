(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const { remote } = require('electron')

    console.log("In index.js")

    function updateGetinfo() {
        console.log("Updating getinfo in index.js")

        var ldbData = remote.getGlobal('ldbData')
        var getinfo = ldbData.findObject({"nexus": "getinfo"})
        var interestrate = getinfo.res.result.interestweight.toFixed(4) + "%"
        var balance = getinfo.res.result.balance.toFixed(2)
        var connections = getinfo.res.result.connections
        var blocks = getinfo.res.result.blocks
        var testnet = getinfo.res.result.testnet
        console.log("In renderer.js interestweight="+interestrate)

        document.getElementById('interestrate').innerHTML = interestrate

        document.getElementById('balance').innerHTML = balance

        document.getElementById('connections').innerHTML = connections

        document.getElementById('blocks').innerHTML = blocks

        document.getElementById('network').innerHTML = (testnet === true) ? "Test Network" : "Main Network"


    } // end updateGetinfo

    $(document).ready(function () {
        console.log("DOCUMENT index.html IS READY")
        updateGetinfo()
        setInterval(function() {
            updateGetinfo()
        }, 10000);
    })
})()

// THE TRUTH IS OUT THERE
