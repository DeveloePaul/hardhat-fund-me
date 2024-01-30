const { deployments, ethers, getNamedAccounts } = require('hardhat')
const { assert, expect } = require('chai')

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', async function () {
      let fundMe
      let mockV3Aggregator
      let user
      const amountToFund = ethers.utils.parseEther('1')

      beforeEach(async function () {
        user = (await getNamedAccounts()).user
        await deployments.fixture(['all'])
        fundMe = await ethers.getContract('FundMe', user)
        mockV3Aggregator = await ethers.getContract('MockV3Aggregator', user)
      })

      describe('constructor', async function () {
        it('Sets the aggregator addresses correctly', async function () {
          const aggregatorAddress = await fundMe.getPriceFeed()
          assert.equal(aggregatorAddress, mockV3Aggregator.address)
          console.log('Contract Owner:', await fundMe.getOwner())
          console.log('User:', user)
          console.log('FundMe Address:', fundMe.address)
        })
      })

      describe('fund', async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            'You need to spend more ETH!'
          )
        })
        // This below test assumes it is the user's first transaction and does not take into
        // account that the the user might have funded the contract before
        it('updates the amount funded data structure', async function () {
          await fundMe.fund({ value: amountToFund })
          const userBalance = await fundMe.getAddressToAmountFunded(user)
          assert.equal(userBalance.toString(), amountToFund.toString())
        })

        it('Adds funder to array of funders', async function () {
          await fundMe.fund({ value: amountToFund })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, user)
        })
      })

      describe('withdraw', async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: amountToFund })
          // //we did not wait for the fund transaction here
        })
        it('Logs Contract Owner', async function () {
          console.log('Contract Owner:', await fundMe.getOwner())
          console.log('User:', user)
          console.log('FundMe Address:', fundMe.address)
        })

        // // To test the onlyOwner modifier we need to create another account to withdraw the funds
        it('Fails if it is not the owner', async function () {
          // const deployer = (await getNamedAccounts()).deployer
          const accounts = await ethers.getSigners()
          const attack = accounts[2]
          const attacker = await fundMe.connect(attack)
          await expect(attaker.withdraw()).to.be.revertedWith(
            'FundMe__NotOwner'
          )
        })

        it('Withdraws ETH from a single funder', async function () {
          // we can also use await ethers.provider.getBalance(...)
          const fundMeStartBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const userStartingBalance = await fundMe.provider.getBalance(user)
          const withdrawTx = await fundMe.withdraw()
          // We waited for the fund transaction here
          const withdrawRx = withdrawTx.wait(1)
          const { gasUsed, effectiveGasPrice } = withdrawRx
          const gasSpent = gasUsed.mul(effectiveGasPrice)
          const fundMeEndBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const userEndingBalance = await fundMe.provider.getBalance(user)
          assert.equal(fundMeEndBalance, 0)
          assert.equal(
            userEndingBalance.add(gasSpent).toString(),
            fundMeStartBalance.add(userStartingBalance)
          )
        })
        it('Allows us to withdraw with multiple funders', async function () {
          const accounts = await ethers.getSigners()
          for (let i = 2; i < 8; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i])
            await fundMeConnectedAccount.fund({ value: amountToFund })
            // await fundMeConnectedAccount.wait(1)
          }
          const fundMeStartBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const userStartingBalance = await fundMe.provider.getBalance(user)
          const withdrawTx = await fundMe.withdraw()
          const withdrawRx = withdrawTx.wait(1)
          const { gasUsed, effectiveGasPrice } = withdrawRx
          const gasSpent = gasUsed.mul(effectiveGasPrice)
          const fundMeEndBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const userEndingBalance = await fundMe.provider.getBalance(user)
          assert.equal(fundMeEndBalance, 0)
          assert.equal(
            userEndingBalance.add(gasSpent).toString(),
            fundMeStartBalance.add(userStartingBalance)
          )
          // Reset the s_Funders array
          await expect(fundMe.funders(0)).to.be.reverted //Meaning nobody should be in the s_Funders array
          for (let i = 2; i < 8; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
