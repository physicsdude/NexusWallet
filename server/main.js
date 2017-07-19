(function() {
    // Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
'use strict';

// Tips
// Debugging https://blog.jetbrains.com/webstorm/2016/05/getting-started-with-electron-in-webstorm/

// This causes information to be logged when processes are spawned
(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        log.debug('spawn called');
        log.debug(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();

const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipcMain = electron.ipcMain
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const dialog = electron.dialog
var fs = require('fs')
var os = require('os')

var platform = os.platform()
if (platform === 'darwin') {
   platform = 'mac'
}
else if (platform === 'win32') {
  platform = 'windows'
}
else {
  platform = 'linux'
}

// Use the electron-log module for logging to ease debugging of built version, etc.
// Usage: log.debug("something")
// Log levels: error, warn, info, verbose, debug, silly
//      output is logged to the platform specific app data
//      directory in a file called log.log
var log = require('electron-log')
log.transports.file.level = 'debug'
log.transports.console.level = 'debug'

module.paths.push(path.resolve('node_modules'))
module.paths.push(path.resolve('../node_modules'))
module.paths.push(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'app', 'node_modules'))
module.paths.push(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'app.asar', 'node_modules'))

const RpcClient = require('node-json-rpc2').Client

const config = {
   protocol:'http',//Optional. Will be http by default
   host:'127.0.0.1',//Will be 127.0.0.1 by default
   user:'therpcuser1',//Optional, only if auth needed
   password:'CHANGEME89uhij4903i4ij',//Optional. Can be named 'pass'. Mandatory if user is passed.
   port:19336,//Will be 8443 for https or 8080 for http by default
   method:'POST'//Optional. POST by default
};

//const appRoot = require('app-root-path')
const appRoot = require('app-root-dir').get()

const spawn = require('child_process').spawn

const handlebars = require('handlebars')

const userData = app.getPath('userData')

//TODO// Add loki encryption https://www.npmjs.com/package/loki-fs-cipher-adapter
var loki = require('lokijs') // database
//var LokiFSCipherAdapter = require('loki-fs-cipher-adapter')
//var adapter = new LokiFSCipherAdapter({"password": "loki"})
//TODO// make the file name the name of the default address, or a hash of it...
var globalLdbFile = path.join(userData,'loki.json')
log.debug("Setting up loki db at "+globalLdbFile)
global.ldb = new loki(globalLdbFile, {
        autoload: true,
        autoloadCallback : loadHandler,
        autosave: true,
        autosaveInterval: 3000
})
//adapter: adapter,
function loadHandler() {
    // if database did not exist it will be empty so I will initialize here
    global.ldbData = global.ldb.getCollection('data');
    if (global.ldbData === null) {
        global.ldbData = global.ldb.addCollection('data');
        global.ldbData.insert({"nexus": "getinfo", "res": {}})
    }
    global.ldbAddress = global.ldb.getCollection('addresses');
    if (global.ldbAddress === null) {
        global.ldbAddress = global.ldb.addCollection('address');
        global.ldbAddress.insert({"label": "default", "address": ""})
    }
    global.ldbTransactions = global.ldb.getCollection('transactions');
    if (global.ldbTransactions === null) {
        global.ldbTransactions = global.ldb.addCollection('transactions');
    }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

var nexusDaemons = []
//let primeMiner

let client

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png')
    })

    setTimeout(function() {
        log.debug("platform is: " + platform)

        log.debug("appRoot="+appRoot)

        log.debug("CODE WAS UPDATED!!")
        var nexusFileName = "nexus"
        var nexusBin
        // Had to follow these directions to put nexus binary in an accessible place
        //  http://stackoverflow.com/questions/33152533/bundling-precompiled-binary-into-electron-app
        if (platform === 'windows') {
            nexusFileName = 'Nexus.exe'
            log.debug("Attempting to find Nexus.exe binary on windows")
            nexusBin = path.join(appRoot, nexusFileName)
            log.debug("nexusBin="+nexusBin)
            if (fs.existsSync(nexusBin)) {
                log.debug("OK, nexus binary exists at path "+nexusBin)
            }
            else {
                var appRootArr = appRoot.split(path.sep)
                log.debug("appRootArr=")
                log.debug(appRootArr)
                appRootArr.pop()
                appRootArr.pop()
                log.debug("appRootArr after pops=")
                log.debug(appRootArr)
                nexusBin = path.join(appRootArr.join(path.sep),nexusFileName)
                if (fs.existsSync(nexusBin)) {
                    log.debug("OK, setting nexusBin=" + nexusBin)
                }
            }
        }
        else {
            log.debug("Platform is not windows")
            nexusBin=path.join(appRoot,'..','app.asar.unpacked','node_modules','nexus',nexusFileName)
            log.debug("Trying nexus binary path: "+nexusBin)
            if (fs.existsSync(nexusBin)) {
                log.debug("OK, nexus binary exists at path "+nexusBin)
            }
            else {
                nexusBin=path.join(appRoot,'node_modules','nexus',nexusFileName)
                log.debug("Trying alternate nexus binary path: "+nexusBin)
                if (fs.existsSync(nexusBin)) {
                    log.debug("OK, nexus binary exists at alternate path "+nexusBin)
                }
                else {
                    nexusBin=path.join(appRoot,'node_modules','nexus',nexusFileName)
                    log.debug("Trying alternate nexus binary path: "+nexusBin)
                    if (fs.existsSync(nexusBin)) {
                        log.debug("OK, nexus binary exists at alternate path "+nexusBin)
                    }
                }
            }
        }

        log.debug("nexusBin="+nexusBin)

        log.debug("userData="+userData)

        // Create cross platform local testnet directories if they don't exist
        var testDir = path.join(userData,'test')
        if (!fs.existsSync(testDir)){
            fs.mkdirSync(testDir)
        }
        var localtestnetnodes = 1
        for (var i = 1; i <= localtestnetnodes; ++i) {
            var localtestnetI = path.join(userData,'test','localtestnet'+i)
            var localnexusconfI = path.join(userData,'test','localtestnet'+i,'nexus.conf')
            if (!fs.existsSync(localtestnetI)){
                log.debug('Creating data directory: '+localtestnetI)
                fs.mkdirSync(localtestnetI)
                var nconfText = getNexusConfigTest(i)
                log.debug('Adding '+localnexusconfI+' for local test node '+i)
                fs.writeFileSync(localnexusconfI, nconfText, function(err) {
                    if(err) {
                        return log.debug(err);
                    }
                    log.debug("The file was saved!")
                });
            }

            // Start the nexus test daemons
            var nexusArg = '-datadir='+localtestnetI
            nexusDaemons.push(spawn(nexusBin, [nexusArg]))

        }

        mainWindow.webContents.openDevTools()

        log.debug(config)

        // Global so renderer processes will be able to access it
        global.rpcClient = new RpcClient(config)

        log.debug("Running updateGetinfoDisk...")
        updateGetinfoDisk(global.rpcClient)
        updateGetaddressesDisk(global.rpcClient)
        updateListtransactionsDisk(global.rpcClient)

        setInterval(function () {

            log.debug("In setInteral updateGetinfoDisk...")
            updateGetinfoDisk(global.rpcClient)
            updateGetaddressesDisk(global.rpcClient)
            updateListtransactionsDisk(global.rpcClient)

        }, 15000); // end setInterval

    }, 100)

    function updateGetinfoDisk(rpcClient) {
        log.debug("Running updateGetinfoDisk()")
        rpcClient.call({
                method:'getinfo',//Mandatory
                params:[],//Will be [] by default
                id:'rpcExample',//Optional. By default it's a random id
                jsonrpc:'2.0'//Optional. By default it's 2.0
            },
            (err, res)=> {
                if(err){
                    log.error("rpc getinfo call failed")
                    log.error(err)
                    return
                }

                console.log('getinfo Data:', res);//Json parsed.

                var getinfo = global.ldbData.findObject({"nexus": "getinfo"})
                log.debug("getinfo is")
                log.debug(getinfo)
                getinfo.res = res
                global.ldbData.update(getinfo)
                //global.ldbData.findAndUpdate({"nexus": "getinfo"},)
                log.debug("getinfo is now")
                log.debug(getinfo)
                log.debug("global.ldbData is: ")
                log.debug(global.ldbData)
                global.ldb.saveDatabase()

                var interestrate = getinfo.res.result.interestweight
                log.debug("In main.js interestweight=" + interestrate)
            }) // end getinfo call

    } // end updateGetinfoDisk

    function updateGetaddressesDisk(rpcClient) {
        rpcClient.call({
            method:'getaddressesbyaccount',
            params:[""],
            id:'rpcExample',
            jsonrpc:'2.0'
        },(err, res)=> {
            if(err){
                log.error("rpc getaddressesbyaccount call failed")
                log.error(err)
                return
            };

            console.log('getaddressesbyaccount Data:', res);//Json parsed.

            var gaba = global.ldbAddress.findObject({"label": "default"})
            gaba.address = res.result[0]
            global.ldbAddress.update(gaba)
            log.debug(global.ldbAddress)
            global.ldb.saveDatabase()

        }) // end getaddressesbyaccount call
    }

    function updateListtransactionsDisk(rpcClient) {
        rpcClient.call({
            method:'listtransactions',
            params:[""],
            id:'rpcExample',
            jsonrpc:'2.0'
        },(err, res)=> {
            if(err){
                log.error("rpc listtransactions call failed")
                log.error(err)
                return
            };

            console.log('listtransactions Data:', res);//Json parsed.

            res.result.forEach(function(elem) {
                var tx = global.ldbTransactions.findObject({txid: elem.txid})
                log.debug("tx type is")
                log.debug(typeof(tx))
                log.debug("tx is null? "+ (tx === null) )
                log.debug("tx is ")
                log.debug(tx)
                if (tx === null) {
                    log.debug("new tx "+elem.txid)
                    global.ldbTransactions.insert(elem)
                }
                else {
                    log.debug("updating tx "+elem.txid)
                    var tmp = elem
                    // Need $loki and $meta to successfully update
                    tmp.$loki = tx.$loki
                    tmp.meta  = tx.meta
                    global.ldbTransactions.update(tmp)
                }
            })

            global.ldb.saveDatabase()

            //[
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
            // ...
            //]

        }) // end getaddressesbyaccount call
    }

  // and load the index.html of the app.
    // TODO: add loading of header and footer separately here
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../walletdev101/pages/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

    var MyRPC = {
            rpcClient: global.rpcClient,
            possibleMethods: {
                methods: [
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
                ]
            }, // end possibleMethods

            updateCollection: function (collection, error, callback) {

                if (collection === 'transactions') {
                    updateListtransactionsDisk()
                    if (callback) callback()
                    return error
                }

            },

            selectDirectory: function (callback) {
                var error = ""
                var destinationPath = ""
                log.debug("In myrpc.selectDirectory in main.js")
                destinationPath = dialog.showOpenDialog(mainWindow, {
                    properties: ['openDirectory']})
                callback(error,destinationPath)
            },

            doit: function (methodAndParams, error, callback) {
                log.debug("In MyRPC::doit, methodAndParams is ")
                log.debug(methodAndParams)
                var tmp = methodAndParams.split(/\s+/)

                tmp.forEach(function (entry) {
                    log.debug("entry is ")
                    log.debug(entry)
                })
                var method = tmp.shift()
                var params = (tmp.length > 0) ? tmp : []
                log.debug("params is")
                log.debug(params)
                if (params.length > 0) {
                    params.forEach(function (elem, index, _params) {
                        log.debug("Looking at elem")
                        log.debug(elem)
                        log.debug("elem.length = ")
                        log.debug(elem.length)
                        _params[index] = elem.replace(/^["]+/, '')
                        _params[index] = elem.replace(/["]+$/, '')
                        log.debug("elem is now")
                        log.debug(elem)
                        // Need to make "3" and "1.34" strings a number
                        var patt = /^[\d.]+$/
                        if (patt.test(elem)) {
                            log.debug("elem looks like a number, converting to float")
                            _params[index] = parseFloat(elem)
                        }
                    })
                } // end if params.length

                this.callExternalProgram(global.rpcClient, method, params, function(args) {
                    let resultText
                    if (args.error === null) {
                        resultText = (typeof(args.result) === 'object') ? JSON.stringify(args.result) : args.result
                    }
                    else {
                        resultText = 'ERROR: ' + (typeof(args.error) === 'object') ? JSON.stringify(args.error) : args.error
                    }

                    log.debug("Result: " + resultText)
                    log.debug("Calling callback(resultText)")

                    callback(resultText)
                }.bind(this))
            }, // end doit

            callExternalProgram: function (rpcClient,method,params,callback) {
                log.debug("Entering myrpc.callExternalProgram(rpcClient,")
                log.debug(",")
                log.debug(method)
                log.debug(",")
                log.debug(params)
                log.debug(")")
                rpcClient.call({
                        method: method,//Mandatory
                        params: params,//Will be [] by default
                        id: 'rpcExample',//Optional. By default it's a random id
                        jsonrpc: '2.0'//Optional. By default it's 2.0
                    },
                    (err, res) => {
                        if (err) {
                            log.error("rpc ")
                            log.error(method)
                            log.error(" with params (")
                            log.error(params)
                            log.error(") call failed with error ")
                            log.error(err)
                            log.error("res is ")
                            log.error(res)
                            res = (typeof(res) === 'undefined') ? [] : res
                            res.error = err
                            callback(res)
                        }
                        else {
                            log.debug("Calling callback with result ")
                            log.debug(res)
                            callback(res)
                        }
                    }) // end rpcClient.call
            } // end callExternalProgram function
    } // End RPC

    exports.myrpc = Object.create(MyRPC)

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function getNexusConfigTest(nodeI) {
  var istimeseed=0
  var unified=0
  var stake=1
  var mining=0
  var server=0
  var llpport=parseInt(nodeI+'8325')
  var rpcport=parseInt(nodeI+'9336')
  var port=parseInt(nodeI+'8313')
  if (nodeI === 1) {
    istimeseed = 1
    unified = 1
    stake = 0
    mining = 1
    server = 1
  }

  var ret = ""
  ret += "testnet=1\n"
  ret += "regtest=1\n"
  if (nodeI === 1) {
    ret += "istimeseed="+istimeseed+"\n"
    ret += "unified="+unified+"\n"
  }
  else {
    ret += "addnode=127.0.0.1:18313\n"
  }
  ret += "llpallowip=*:"+llpport+"\n"
  ret += "llpallowip=*.*.*.*:"+llpport+"\n"
  ret += "llpallowip=127.0.0.1:"+llpport+"\n"
  ret += "rpcport="+rpcport+"\n"
  ret += "port="+port+"\n"
  ret += "rpcuser=therpcuser1\n"
  ret += "rpcpassword=CHANGEME89uhij4903i4ij\n"
  ret += "rpcallowip=127.0.0.1\n"
  ret += "listen=1\n"
  ret += "stake=0\n"
  ret += "server="+server+"\n"
  ret += "mining=1\n"
  ret += "checklevel=0\n"
  ret += "checkbolcks=1\n"
  ret += "debug=1\n"
  ret += "verbose=4\n"
  ret += "daemon=0\n"
  return ret
}

})();

// THE TRUTH IS OUT THERE