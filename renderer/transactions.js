(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const remote = require('electron').remote
    const handlebars = require('handlebars')
    var myrpc = remote.require('./main').myrpc;

    console.log("In transactions.js")

    function updateTransactions() {
        console.log("Updating transaction info in transactions.js")

        var ldbData = remote.getGlobal('ldbTransactions')

        console.log("Showing info about incoming transactions, if any.")
        var incomingTransactionsA = ldbData.find({'confirmations': { '$lt': 6 }})
        incomingTransactionsA.forEach( function(ele){
            ele.percentComplete = parseInt(100 * ele.confirmations / 6)
        })
        console.log("incomingTransactionsA is ")
        console.log(incomingTransactionsA)

        // Fill in the following info for incoming transactions:
        // address, dateTime, percentComplete,

        var incomingTransactionsTemplate = $("#incomingTransactionsTemplate").html()
        console.log(incomingTransactionsTemplate)
        var incomingTemplate = handlebars.compile(incomingTransactionsTemplate)
        var incomingResult = incomingTemplate({incomingTransactions: incomingTransactionsA})
        $("#incomingTransactionsPlaceholder").html(incomingResult)

        var transactionsA = ldbData.find({'confirmations': { '$gt': 5 }})
        console.log(transactionsA)
        var transactionsTemplate = $("#transactionsTemplate").html()
        console.log(transactionsTemplate)
        var template = handlebars.compile(transactionsTemplate)
        var result = template({transactions: transactionsA})
        $("#transactionsPlaceholder").html(result)

    } // end updateGetinfo

    $(document).ready(function () {
        var error = null
        myrpc.doit('transactions', error, function(error) {
            if (Object.keys(error).length !== 0 && error.constructor === Object) alert("error is " + error)
            updateTransactions()
        })
    })

})()

// {
//     "account" : "",
//     "category" : "immature",
//     "amount" : 76.49933900,
//     "confirmations" : 10,
//     "blockhash" : "a0049228b069612cfceb2849c34f1d19fbfb1ac53635abc6f1e28134ff9b53056bb225c6fa079fbe38bf83f5aca60988873f4122637c4cba08634f57d2b6bd2789dac247a8f4f861ef7d1e0d870ba24c86be8795d72ae8d086fecf46e054f0e9a497782a6ee5beb101ffbaa73e2a5e8a8128806cc7fae4036b38ffd0e19b2a52",
//     "blockindex" : 0,
//     "txid" : "05d1c65ab81bcc94cb84cb2ecfee5cf4773e2b30ffb81d7f9c9d684da25e1bfcf1dee8c536fb29c5ecfb89d7b1522633e4b4b31509e36c06c8650e1fe996c7ed",
//     "time" : 1495297913
// },

// THE TRUTH IS OUT THERE
