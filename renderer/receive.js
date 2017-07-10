(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const { remote } = require('electron')
    const dialog = require('electron').remote.dialog
    const handlebars = require('handlebars')
    var myrpc = remote.require('./main').myrpc;

    console.log("In receive.js")

    function updateAddresses(callback) {
        console.log("Updating addresses in receive.js")

        var methodAndParams = "getaddressesbyaccount \"\""
        var error = {}
        var addressListTemplate = $("#addressListTemplate").html()
        console.log(addressListTemplate)
        myrpc.doit(methodAndParams, error, function(resultText) {
            console.log("SUCCESS" + resultText)
            var addresses = JSON.parse(resultText)
            console.log("parsed addresses is now")
            console.log(addresses)
            addresses.forEach( function(entry,index,_addresses) {
                _addresses[index] = { label: index+1, address: entry }
            })
            console.log("tweaked addresses is now")
            console.log(addresses)
            var template = handlebars.compile(addressListTemplate)
            var result = template({addresses: addresses})
            $("#addressListPlaceholder").html(result)
            if (callback) callback()
        })

    } // end updateGetinfo

    $("#getNewAddress").click(function(){
        var methodAndParams = "getnewaddress \"\""
        var error = {}
        myrpc.doit(methodAndParams, error, function(resultText) {
            var address = resultText
            console.log("SUCCESS: " + address)
            var buttons = ['OK'];
            dialog.showMessageBox({ type: 'info', buttons: buttons, message: "New Address Created\n"+resultText }, function (buttonIndex) {
                updateAddresses(function(){
                    document.getElementById(address).scrollIntoView(true)
                })
            });
        })
    })

    $(document).ready(function () {
        updateAddresses()
    })
})()

// THE TRUTH IS OUT THERE
