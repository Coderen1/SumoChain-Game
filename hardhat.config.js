require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      url: "https://testnet.monad.xyz",
      chainId: 41454,
      accounts: ["YOUR_PRIVATE_KEY_HERE"] // ⚠️ .env kullanın, buraya yazmayın!
    }
  }
};
