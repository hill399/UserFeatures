const UserFeatures = artifacts.require("UserFeatures");
const truffleAssert = require('truffle-assertions');
const timeHelper = require("../helpers/truffleTestHelper");


contract('UserFeatures', function(accounts) {
  let userFeaturesInstance;
  let newFundsDeposited = 400;
  let defaultDailySpend = 100;
  const dayAdvance = 86500;

  beforeEach(async() => {
    userFeaturesInstance = await UserFeatures.new(defaultDailySpend);
  })

  it("Ether can be deposited", async() => {
    let newFundsDeposited = 100;
    await userFeaturesInstance.send(newFundsDeposited, {from: accounts[1]});
    let balance = await web3.eth.getBalance(userFeaturesInstance.address)
    assert.equal(balance,
                 newFundsDeposited,
                 "Contract has declined ether payment");

  })

  it("Ether can be transferred to a receiving address", async() => {
    let fundsToTransfer = 50;
    await userFeaturesInstance.send(newFundsDeposited, {from: accounts[1]});
    let recevierBalancePre = await web3.eth.getBalance(accounts[2]);
    await userFeaturesInstance.sendEtherToAddress(accounts[2], fundsToTransfer);
    let recevierBalancePost = await web3.eth.getBalance(accounts[2]);
    let contractBalance = await web3.eth.getBalance(userFeaturesInstance.address);
    assert.equal(recevierBalancePost,
                 (Number(recevierBalancePre) + fundsToTransfer),
                 "Incorrect funds at receiver");
    assert.equal((newFundsDeposited - fundsToTransfer),
                 contractBalance,
                 "Incorrect contract balance");
  })

  it("Should allow for the user to adjust the daily spend cap", async() => {
   let newDailyAllowance = 50;
   await userFeaturesInstance.userSetDailySendLimit(newDailyAllowance);
   let dailyAllowance = await userFeaturesInstance.dailySendLimit.call();
   assert.equal(dailyAllowance,
                newDailyAllowance,
                "Daily spend allowance has failed to set");

  })

  it("Should introduce a 24 'cool off' after spend cap is sent", async() => {
   let newDailyAllowance = 50;
   await userFeaturesInstance.userSetDailySendLimit(newDailyAllowance);
   await truffleAssert.reverts(
        userFeaturesInstance.userSetDailySendLimit(newDailyAllowance),
        "Timeout currently enforced");
   await timeHelper.advanceTimeAndBlock(dayAdvance);
   await userFeaturesInstance.userSetDailySendLimit(newDailyAllowance);
  })

  it("Should allow for a user to whitelist an address", async() => {
   const recevierAddress = accounts[1];
   await userFeaturesInstance.whitelistAddress(recevierAddress);
   let addressData = await userFeaturesInstance.addressData.call(recevierAddress);
   assert.equal(addressData[0],
                true,
                "Address has not been whitelisted");
  })

  it("A non-whitelist address cannot exceed the daily spend", async() => {
   let fundsToTransfer = 101;
   await userFeaturesInstance.send(newFundsDeposited, {from: accounts[1]});
   await truffleAssert.reverts(
        userFeaturesInstance.sendEtherToAddress(accounts[2], fundsToTransfer),
        "Send conditions are not valid");
  })

  it("A whitelisted address can exceed the daily spend", async() => {
   let fundsToTransfer = 101;
   const recevierAddress = accounts[2]
   await userFeaturesInstance.send(newFundsDeposited, {from: accounts[1]})
   await userFeaturesInstance.whitelistAddress(recevierAddress);
   await userFeaturesInstance.sendEtherToAddress(recevierAddress, fundsToTransfer);
  })

  it("A paid address is added to the payee list (paidArray)", async() => {
   let fundsToTransfer = 50;
   const recevierAddress = accounts[2]
   await userFeaturesInstance.send(newFundsDeposited, {from: accounts[1]})
   await userFeaturesInstance.whitelistAddress(recevierAddress);
   await userFeaturesInstance.sendEtherToAddress(recevierAddress, fundsToTransfer);
   let paidStore = await userFeaturesInstance.paidAddresses.call(0);
   assert.equal(paidStore,
                recevierAddress,
                "Address has not been added to paidAddres array");
  })

  it("Daily spend cap is on a per-address basis", async() => {
    let fundsToTransfer = 100;
    await userFeaturesInstance.send(newFundsDeposited, {from: accounts[0]});
    await userFeaturesInstance.sendEtherToAddress(accounts[0], fundsToTransfer);
    await userFeaturesInstance.sendEtherToAddress(accounts[1], fundsToTransfer);
    await userFeaturesInstance.sendEtherToAddress(accounts[2], fundsToTransfer);
  })

  it("Daily spend resets after 1 day", async() => {
    let fundsToTransfer = 100;
    await userFeaturesInstance.send(newFundsDeposited, {from: accounts[0]});
    await userFeaturesInstance.sendEtherToAddress(accounts[1], fundsToTransfer);
    await timeHelper.advanceTimeAndBlock(dayAdvance);
    await userFeaturesInstance.sendEtherToAddress(accounts[1], fundsToTransfer);
    await timeHelper.advanceTimeAndBlock(dayAdvance);
    await userFeaturesInstance.sendEtherToAddress(accounts[1], fundsToTransfer);
  })

  it("Lowering the daily cap after exceeding daily spend is safe", async() => {
    let preFundsToTransfer = 80;
    let postFundsToTransfer = 20;
    let newDailyAllowance = 50;
    await userFeaturesInstance.send(newFundsDeposited, {from: accounts[0]});
    await userFeaturesInstance.sendEtherToAddress(accounts[1], preFundsToTransfer);
    await userFeaturesInstance.userSetDailySendLimit(newDailyAllowance);
    await truffleAssert.reverts(
         userFeaturesInstance.sendEtherToAddress(accounts[1], postFundsToTransfer),
         "Send conditions are not valid");
    await timeHelper.advanceTimeAndBlock(dayAdvance);
    await userFeaturesInstance.sendEtherToAddress(accounts[1], postFundsToTransfer);
  })

});
