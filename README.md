# Ethereum PrivTestnet

## Install

```sh
git clone https://github.com/AugustoL/ETHPrivTestnet --recursive
cd go-ethereum && make
cd .. && npm install
```

## Blockchain Operations

#### Console

This command will gave you access to the geth console, to run this you need to at least have one account generated.

`npm run console`

#### Init

Run this command only once and before you start mining, this will init the blockchain with you genesis.json.

`npm run init`

#### Mine

`npm run mine`

Use this command to run the miner.

#### Accounts

`npm run accounts [QUANTITY_TO_GENERATE]`

Use this command to generate accounts for you testnet, they will be automatically saved on the keystore and ready to use on your console.

#### Clean

`npm run clean`

This command will delete all the blockchain data, use it if you want to start a new blockchain from genesis block, after running this command you will need to init the blockchain

### Donations

Bictoin:  1Cf3mkzNicq57hqP9jMEGbTfvtJnMfAKe6

Ethereum: 0x089a9b6915f3ddf987010A0a56045469DBaACB2C
