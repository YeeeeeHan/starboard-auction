const { expect } = require("chai")
const { ethers } = require("hardhat")
const { resetHardhatContext } = require("@nomiclabs/hardhat-ethers")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const name = "AuctionNft"
const symbol = "ANFT"

async function deployAuctionNftFixture() {
    // Get the ContractFactory and Signers here.
    const Contract = await ethers.getContractFactory("AuctionNft")
    const [deployer, addr1, addr2] = await ethers.getSigners()
    const nftContractInstance = await Contract.deploy()
    await nftContractInstance.deployed()

    // Fixtures can return anything you consider useful for your tests
    return { nftContractInstance, addr1, addr2 }
}

describe("AuctionNFT", function () {
    describe("Deploy AuctionNFT contract", function () {
        it("NFT should have a name amd symbol", async function () {
            const { nftContractInstance } = await loadFixture(deployAuctionNftFixture)
            expect(await nftContractInstance.name()).to.equal(name)
            expect(await nftContractInstance.name()).to.equal(name)
        })
    })
    describe("Deploy AuctionNFT contract", function () {
        it("NFT should have a name amd symbol", async function () {
            const { nftContractInstance } = await loadFixture(deployAuctionNftFixture)
            expect(await nftContractInstance.name()).to.equal(name)
            expect(await nftContractInstance.name()).to.equal(name)
        })
    })
})
