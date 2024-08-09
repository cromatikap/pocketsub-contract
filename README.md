# Pocketsub smart-contract

smart-contract for [Pocketsub](https://github.com/cromatikap/pocketsub)

## Development

### Getting started

```sh
npm install
```

### Tests & cleaning

```sh
npm run test # Pass env var REPORT_GAS=false to deactivate gas 
```

### Deploying the contracts

```sh
cp .env.example .env
vim .env # Add the private key you want to use to deploy the contracts
npx hardhat ignition deploy ./ignition/modules/Pocketsub.ts --network testnet --reset
```

### Verifying the contracts

```sh
npx hardhat verify --network testnet <CONTRACT ADDRESS> <CONSTRUCTOR_PARAMETERS>
```