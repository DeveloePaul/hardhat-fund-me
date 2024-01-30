const { getNamedAccounts, ethers, network } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')
const { assert, expect } = require('chai')

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', function () {
      let fundMe, deployer
      const sendValue = ethers.utils.parseEther('1')
      const value = { value: sendValue }
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        fundMe = awaitethers.getContract('FundMe', deployer)
      })
      it('Allows people to fund and withdraw', async function () {
        await fundMe.fund(value)
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address)
        assert.equal(endingBalance.toString(), '0')
      })
    })
