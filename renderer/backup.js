(function(){
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
    'use strict';

    const { remote } = require('electron')
    const dialog = require('electron').remote.dialog
    const handlebars = require('handlebars')
    var myrpc = remote.require('./main').myrpc;

    console.log("In backup.js")

    function backupWallet(destinationPath, callback) {
        console.log("IN backupWallet in backup.js")
        var methodAndParams = "backupwallet " + destinationPath
        console.log("methodAndParams="+methodAndParams)
        var error = {}
        //var backupResultTemplate = $("#backupResultTemplate").html()
        //console.log(backupResultTemplate)
        myrpc.doit(methodAndParams, error, function(resultText) {
            console.log("mrpc.doit returned: " + resultText)
            var result = resultText // for now just show the json text - parsing is broken
            //var result = JSON.parse(resultText)
            console.log("error is ")
            console.log(error)
            console.log("result is")
            console.log(result)

            if (result !== "null") {
                document.getElementById("backupResult").innerHTML = result
            }

            //var template = handlebars.compile(backupResultTemplate)
            //var result = template({result: result})
            //$("#backupResultPlaceholder").html(result)
            if (callback) callback()
        })

    } // end updateGetinfo

    $("#backupWallet").click(function(){
        // Get the path to backup to...
        var error
        var destinationPath = ""
        myrpc.selectDirectory(function(error, destinationPath) {
            //var destinationPath = $("#destinationPath").val()
            console.log("error is "+error)
            console.log("destinationPath= "+destinationPath)
            var buttons = ["Yes","No"]
            dialog.showMessageBox({ type: 'info', buttons: buttons, message: "Are you sure you want to back up your wallet to " + destinationPath + "?" }, function (_buttonIndex) {
                var buttonIndex = _buttonIndex
                if (buttonIndex === 0) {
                    backupWallet(
                        destinationPath,
                        function () {
                            dialog.showMessageBox({
                                type: 'info',
                                buttons: ["OK"],
                                message: "OK! Attempting to back up wallet. Please make sure to verify the backup and store it in a safe place."
                            }, function (buttonIndex) {
                                console.log("WALLET SHOULD BE BACKING UP")
                            })
                        })
                }
                else {
                    dialog.showMessageBox({
                        type: 'info',
                        buttons: 'OK',
                        message: "Backup cancelled."
                    })
                }
            }) // end show are you sure message box

        }) // end selectDirectory

    }) // end backupWallet.click

})()

// THE TRUTH IS OUT THERE
