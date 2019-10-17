const UserFeatures = artifacts.require("UserFeatures");

module.exports = function(deployer, network, accounts) {
  const defaultDailySpend = 100;
  deployer.deploy(UserFeatures, defaultDailySpend);
};
