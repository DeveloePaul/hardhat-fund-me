const { getNamedAccounts, ethers } = require('hardhat')
async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract('FundMe', deployer)
  const fundMeBalance = await ethers.provider.getBalance(fundMe.address)
  console.log('Withdrawing...')
  const withdrawTx = await fundMe.withdraw()
  await withdrawTx.wait(1)
  console.log(`Withdraw: ${fundMeBalance} ETH from FundMe`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
