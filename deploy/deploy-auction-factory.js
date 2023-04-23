const { ethers } = require("hardhat")

const contractName = "SimpleAuctionFactory"
// const biddingTime = 100000

async function deployPet() {
    const Box = await ethers.getContractFactory(contractName)

    console.log("Deploying...")
    const BoxContract = await Box.deploy()
    await BoxContract.deployTransaction.wait(5)
    console.log(`Contract deployed to ${BoxContract.address}`)
    // await verify(BoxContract.address, [], ethers.provider.network.chainId)
}

deployPet()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
