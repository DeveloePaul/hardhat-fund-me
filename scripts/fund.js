const { getNamedAccounts, ethers } = require('hardhat')
async function main() {
  const amount = ethers.utils.parseEther('1')
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract('FundMe', deployer)
  console.log('Funding Contract...')
  const fundTx = await fundMe.fund({ value: amount })
  await fundTx.wait(1)
  console.log(`Funded with: ${amount} ETH`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
