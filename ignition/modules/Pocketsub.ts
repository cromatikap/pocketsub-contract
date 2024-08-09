import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require('@dotenvx/dotenvx').config();

const PocketsubModule = buildModule("PocketsubModule", (m) => {

  const pocketsub = m.contract("Pocketsub", []);

  return { pocketsub };
});

export default PocketsubModule;
