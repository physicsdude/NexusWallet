(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const { remote } = require('electron')
    const handlebars = require('handlebars')
    //var myrpc = remote.getGlobal('myrpc')
    var myrpc = remote.require('./main').myrpc;

    console.log("In console.js")

    $(document).ready(function () {
        console.log("DOCUMENT console.html IS READY")

        var possibleMethods = {methods: [
            {method: 'addmultisigaddress <nrequired> <\'["key","key"]\'> [account]'},
            {method: 'backupwallet <destination>'},
            {method: 'checkwallet'},
            {method: 'dumpprivkey <NexusAddress>'},
            {method: 'dumprichlist <count>'},
            {method: 'encryptwallet <passphrase>'},
            {method: 'exportkeys'},
            {method: 'getaccount <Nexusaddress>'},
            {method: 'getaccountaddress <account>'},
            {method: 'getaddressbalance <address>'},
            {method: 'getaddressesbyaccount <account>'},
            {method: 'getbalance [account] [minconf=1]'},
            {method: 'getblock <hash> [txinfo]'},
            {method: 'getblockcount'},
            {method: 'getblockhash <index>'},
            {method: 'getconnectioncount'},
            {method: 'getdifficulty'},
            {method: 'gettransaction <txid>'},
            {method: 'getinfo'},
            {method: 'getmininginfo'},
            {method: 'getnewaddress [account]'},
            {method: 'getpeerinfo'},
            {method: 'getreceivedbyaccount <account> [minconf=1]'},
            {method: 'getreceivedbyaddress <Nexusaddress> [minconf=1]'},
            {method: 'getsupplyrate'},
            {method: 'gettransaction <txid>'},
            {method: 'help [command]'},
            {method: 'importkeys'},
            {method: 'importprivkey <PrivateKey> [label]'},
            {method: 'keypoolrefill'},
            {method: 'listaccounts [minconf=1]'},
            {method: 'listreceivedbyaccount [minconf=1] [includeempty=false]'},
            {method: 'listreceivedbyaddress [minconf=1] [includeempty=false]'},
            {method: 'listsinceblock [blockhash] [target-confirmations]'},
            {method: 'listtransactions [account] [count=10] [from=0]'},
            {method: 'listtrustkeys'},
            {method: 'listunspent [minconf=1] [maxconf=9999999]  ["address",...]'},
            {method: 'makekeypair [prefix]'},
            {method: 'move <fromaccount> <toaccount> <amount> [minconf=1] [comment]'},
            {method: 'repairwallet'},
            {method: 'rescan'},
            {method: 'reservebalance [<reserve> [amount]]'},
            {method: 'sendfrom <fromaccount> <toNexusaddress> <amount> [minconf=1] [comment] [comment-to]'},
            {method: 'sendmany <fromaccount> {address:amount,...} [minconf=1] [comment]'},
            {method: 'sendtoaddress <Nexusaddress> <amount> [comment] [comment-to]'},
            {method: 'setaccount <Nexusaddress> <account>'},
            {method: 'settxfee <amount>'},
            {method: 'signmessage <Nexusaddress> <message>'},
            {method: 'stop'},
            {method: 'unspentbalance ["address",...]'},
            {method: 'validateaddress <Nexusaddress>'},
            {method: 'verifymessage <Nexusaddress> <signature> <message>'},
        ]};

        var possibleMethodsTemplate = $("#possibleMethodsTemplate").html()
        console.log(possibleMethodsTemplate)
        var template = handlebars.compile(possibleMethodsTemplate)
        var result = template(possibleMethods)

        $('#possibleMethodsSelect').html(result)
        $('#possibleMethodsSelect').on('change', function () {
             var sel = $('#possibleMethodsSelect :selected').text()
             $("#rpcMethodAndParams").val(sel)
        })

        $("#runRPCButton").click(function(){
            var methodAndParams = $("#rpcMethodAndParams").val()
            var error = {}
            var existing = $("#consoleOutput").val();
            myrpc.doit(methodAndParams, error, function(resultText) {
                console.log("SUCCESS" + resultText)
                $("#consoleOutput").val('nexus> ' + methodAndParams + "\n" + resultText + "\n" + existing)
            })
        })

    }) // end document ready

})()

// THE TRUTH IS OUT THERE
