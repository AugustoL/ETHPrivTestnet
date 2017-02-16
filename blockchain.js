
var async = require('async');
var fs = require('fs');
var child = require('child_process');
var args = process.argv.slice(2);
var fetch = require('node-fetch');
var keythereum = require("keythereum");

const BLOCKCHAIN_PATH = __dirname+'/blockchain';

const BASE_PASSWORD = "password";

const PORT = "8545";

const NETWORK_ID = "123456";

const SEED_BALANCE = "20000000000000000000";

const ACCOUNTS = require('./blockchain/accounts') || {};

var debug = false;

const ACCOUNT = ACCOUNTS.admin.address || '0x0';

const ACCOUNT_INDEX = 0;

if (args.indexOf('--debug') > 0)
    debug = true;

if (args.indexOf('--acc') > 0){
    const ACCOUNT_INDEX = args[ args.indexOf('--acc')+1 ];
    const ACCOUNT = ACCOUNTS.users[ACCOUNT_INDEX].address;
    console.log('Using account', ACCOUNT, 'on index', ACCOUNT_INDEX);
}

function spanwChild(process, args, callback){
    var callbackCalled = false;
    var _spanwChild = child.spawn(process, args);
    _spanwChild.stdout.on('data', function(data){
        console.log(`${data}`);
    });
    _spanwChild.stderr.on('data', function(data) {
        console.log(`${data}`);
        if (callback && !callbackCalled){
            callback(null);
            callbackCalled = true;
        }
    });
    _spanwChild.on('close', function(code) {
        if (debug)
            console.log(`child process exited with code ${code}`);
    });
    _spanwChild.on('exit', function(code) {
        if (debug)
            console.log(`child process exited.`);
    });
}

function getUserIP(callback){
    fetch('http://api.ipify.org:80/',{
        method: 'GET'
    }).then(function(response) {
        return response.text();
    }).then(function(text) {
        callback(text);
    }).catch(function(err) {
        if (err)
            console.error(err);
    });
};

switch (args[0]) {
    case 'mine':
        getUserIP(function(ip){
            spanwChild(__dirname+'/go-ethereum/build/bin/geth', [
                "--datadir="+BLOCKCHAIN_PATH,
                "--networkid", NETWORK_ID,
                "--nodiscover", "--maxpeers=0",
                "--fast",
                "--rpc",
                "--rpcapi", "eth,web3,net,personal,ssh,db",
                "--rpcaddr", "localhost",
                "--rpcport", PORT,
                "--rpccorsdomain", "*",
                "--verbosity=6",
                "--nat", "extip:"+ip,
                "--etherbase", ACCOUNT,
                "--mine",
                "--minerthreads", "1",
                "--unlock", ACCOUNT,
                "--password", BLOCKCHAIN_PATH+'/passwords/acc'+ACCOUNT_INDEX
            ])
        });
    break;
    case 'init':
        getUserIP(function(ip){
            spanwChild(__dirname+'/go-ethereum/build/bin/geth', [
                "--datadir="+BLOCKCHAIN_PATH,
                "--networkid", NETWORK_ID,
                "--fast",
                "--nodiscover",
                "--rpc",
                "--rpcaddr", "localhost",
                "--rpcport", PORT,
                "--rpccorsdomain", "*",
                "--verbosity=5",
                "--maxpeers=0",
                "--nat", "extip:"+ip,
                "--mine",
                "init", BLOCKCHAIN_PATH+"/genesis.json"
            ])
        });
    break;
    case 'accounts':
        async.waterfall([
            function(finalCallback){
                var number = parseInt(args[1]);
                var numbers = []
                console.log('Creating '+number+' accounts');
                for (var i = 0; i <= number; i++)
                    numbers.push(i)
                var accountKeys = [];
                async.eachOfLimit(numbers, 1, function(number, index, accountCallback){
                    const password = BASE_PASSWORD+index;
                    var key = keythereum.create();
                    var keyObject = keythereum.dump(password, key.privateKey, key.salt, key.iv);
                    accountKeys.push({
                        address: '0x'+keyObject.address,
                        privateKey: key.privateKey.toString('hex')
                    });
                    keythereum.exportToFile(keyObject, BLOCKCHAIN_PATH+'/keystore');
                    fs.writeFileSync(BLOCKCHAIN_PATH+'/passwords/acc'+index, password);
                    accountCallback(null);
                }, function(err){
                    var accounts = {
                        admin: accountKeys[0],
                        users: accountKeys.splice(1)
                    };
                    fs.writeFile(BLOCKCHAIN_PATH+'/accounts.json', JSON.stringify(accounts, null, '    '), function (err,data) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('accounts file on blockchain folder created.');
                        }
                    })
                    console.log('Creating genesis..');
                    var genesis = {
                    	"nonce": "0x1265616432",
                    	"timestamp": "0x0",
                    	"parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                    	"extraData": "0x0",
                    	"gasLimit": "0xE8D4A51000",
                    	"difficulty": "0x200",
                    	"mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                        "coinbase": accounts.admin.address.substring(2),
                        "alloc": {}
                    }
                    for (var a = 0; a < accounts.users.length; a++)
                      genesis.alloc[accounts.users[a].address.substring(2)] = { "balance": SEED_BALANCE};
                    fs.writeFile(BLOCKCHAIN_PATH+'/genesis.json', JSON.stringify(genesis, null, '    '), function (err,data) {
                    	if (err) {
                    		console.error(err);
                    	} else {
                    		console.log('Genesis file created.');
                    	}
                    });
                })
            },
        ])
    break;
}
