(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const { remote, clipboard } = require('electron')
    const dialog = require('electron').remote.dialog
    const handlebars = require('handlebars')
    var myrpc = remote.require('./main').myrpc;

    console.log("In send.js")

    function sendNexus(address, amount, callback) {
        console.log("SENDING NEXUS in send.js")
        // check address is a valid address
        // check amount is a valid amount (float)
        if (typeof(address) !== "string" || !address) {
            $("#errorPlaceholder").html("ERROR, address is not a string: "+address)
            return
        }
        if (!amount || isNaN(amount)) {
            $("#errorPlaceholder").html("ERROR, amount is not a number: "+amount)
            return
        }

        var methodAndParams = "sendtoaddress " + address + " " + amount
        console.log("methodAndParams="+methodAndParams)
        var error = {}
        var sendResultTemplate = $("#sendResultTemplate").html()
        console.log(sendResultTemplate)
        myrpc.doit(methodAndParams, error, function(resultText) {
            console.log("mrpc.doit returned: " + resultText)
            var result = resultText // for now just show the json text - parsing is broken
            //var result = JSON.parse(resultText)
            console.log("error is ")
            console.log(error)
            console.log("result is")
            console.log(result)

            var template = handlebars.compile(sendResultTemplate)
            var result = template({result: result})
            $("#sendResultPlaceholder").html(result)
            if (callback) callback()
        })

    } // end updateGetinfo

    $("#sendNexus").click(function(){


        var address = $("#addressTo").val()
        var amount = $("#amountNexus").val()
        console.log("address= "+address+", amount= "+amount)
        var buttons = ["Yes","No"]
        dialog.showMessageBox({ type: 'info', buttons: buttons, message: "Are you sure you want to send "+amount+" NXS to "+address+"?" }, function (_buttonIndex) {
            var buttonIndex = _buttonIndex
            if (buttonIndex === 0) {
                sendNexus(
                    address,
                    amount,
                    function () {
                        dialog.showMessageBox({
                            type: 'info',
                            buttons: ["OK"],
                            message: "OK! Sending Nexus."
                        }, function (buttonIndex) {
                            console.log("NEXUS SHOULD BE SENDING")
                        })
                    })
            }
            else {
                dialog.showMessageBox({
                    type: 'info',
                    buttons: 'OK',
                    message: "Send cancelled."
                })
            }
        }) // end show are you sure message box

    }) // end sendNexus.click

    $("#pasteAddress").click(function(){
        console.log("Attempting to paste address text from clipboard.")
        $('#addressTo').val(clipboard.readText())
    })

    $("#removeRecipient").click(function(){
        console.log("Attempting to remove recipient.")
        $('#addressTo').val("")
    })

    $("#clearAll").click(function(){
        console.log("Attempting to clear all.")
        $('#addressTo').val("")
        $('#amountNexus').val("")
    })

    $(document).ready(function () {
        console.log("DOCUMENT send.html IS READY")
    })

})()

// THE TRUTH IS OUT THERE
