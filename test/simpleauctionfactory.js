const { expect } = require("chai")
const { ethers } = require("hardhat")
const { resetHardhatContext } = require("@nomiclabs/hardhat-ethers")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const FactoryABI = require("../artifacts/contracts/SimpleAuction.sol/SimpleAuctionFactory.json")
const AuctionABI = require("../artifacts/contracts/SimpleAuction.sol/SimpleAuction.json")
const NftABI = require("../artifacts/contracts/AuctionNft.sol/AuctionNft.json")

const { deployAuctionNftFixture } = require("./auctionnft")

const biddingTime = 100
const short_biddingTime = 0

async function deployContractFactoryFixture() {
    // Get the ContractFactory and Signers here.
    const Contract = await ethers.getContractFactory("SimpleAuctionFactory")
    const [deployer, addr1, addr2] = await ethers.getSigners()
    const contractInstance = await Contract.deploy({ gasLimit: 30000000 })
    await contractInstance.deployed()

    // Fixtures can return anything you consider useful for your tests
    return { contractInstance, addr1, addr2 }
}

async function createAuctionFixture() {
    // Get the ContractFactory and Signers here.
    const Contract = await ethers.getContractFactory("SimpleAuctionFactory")
    const [deployer, addr1, addr2, addr3] = await ethers.getSigners()
    const contractInstance = await Contract.deploy({ gasLimit: 30000000 })
    await contractInstance.deployed()

    const factoryContractInstance = new ethers.Contract(
        contractInstance.address,
        FactoryABI.abi,
        addr1
    )

    // Wait for the transaction to be mined and get the new auction address from the event
    const tx = await factoryContractInstance.createAuction(biddingTime)
    const receipt = await tx.wait()
    const event = receipt.events.find((e) => e.event === "AuctionCreated")
    const auctionAddress = event.args.auction

    // Fixtures can return anything you consider useful for your tests
    return { auctionAddress, tx, addr1, addr2, addr3 }
}

describe("SimpleAuctionFactory", function () {
    describe("Deploy SimpleAuctionFactory contract", function () {
        it("Users should be able to create auction themselves", async function () {
            const { contractInstance, addr1, addr2 } = await loadFixture(
                deployContractFactoryFixture
            )

            const factoryContractInstance = new ethers.Contract(
                contractInstance.address,
                FactoryABI.abi,
                addr1
            )

            // Wait for the transaction to be mined and get the new auction address from the event
            const tx = await factoryContractInstance.createAuction(biddingTime)
            const receipt = await tx.wait()
            const event = receipt.events.find((e) => e.event === "AuctionCreated")
            const auctionAddress = event.args.auction

            // Verify that the auction was created
            const auctions = await factoryContractInstance.getAuctions()
            expect(auctions).to.contain(auctionAddress)
            expect(auctions.length).to.equal(1)
        })
        it("Multiple users should be able to create auction themselves", async function () {
            const { contractInstance, addr1, addr2 } = await loadFixture(
                deployContractFactoryFixture
            )

            // Auction 1
            const factoryContractInstance = new ethers.Contract(
                contractInstance.address,
                FactoryABI.abi,
                addr1
            )

            // Wait for the transaction to be mined and get the new auction address from the event
            const tx = await factoryContractInstance.createAuction(biddingTime)
            const receipt = await tx.wait()
            const event = receipt.events.find((e) => e.event === "AuctionCreated")
            const auctionAddress = event.args.auction

            // Verify that the auction was created
            const auctions = await factoryContractInstance.getAuctions()
            expect(auctions).to.contain(auctionAddress)
            expect(auctions.length).to.equal(1)

            // Auction 2
            const factoryContractInstance2 = new ethers.Contract(
                contractInstance.address,
                FactoryABI.abi,
                addr2
            )

            // Wait for the transaction2 to be mined and get the new auction address from the event
            const tx2 = await factoryContractInstance2.createAuction(biddingTime)
            const receipt2 = await tx.wait()
            const event2 = receipt.events.find((e) => e.event === "AuctionCreated")
            const auctionAddress2 = event.args.auction

            // Verify that the auction2 was created
            const auctions2 = await factoryContractInstance2.getAuctions()
            expect(auctions2).to.contain(auctionAddress2)
            expect(auctions2.length).to.equal(2)
        })
        it("Auction NFT should be created", async function () {
            const { Contract, contractInstance, addr1, addr2 } = await loadFixture(
                deployContractFactoryFixture
            )

            const nftAddress = await contractInstance.auctionNft()

            // Verify that the address is a valid Ethereum address
            expect(ethers.utils.isAddress(nftAddress)).to.be.true
        })
    })

    describe("Normal Auction Creation", function () {
        it("Beneficiary should be auction creator (addr1)", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr1
            )

            // Beneficiary should be addr1
            const beneficiary = await auctionContractInstance.beneficiary()
            expect(beneficiary).to.equal(addr1.address)
        })

        it("AuctionEndTime should be correct", async function () {
            const { auctionAddress, tx, addr1, addr2, addr3 } = await loadFixture(
                createAuctionFixture
            )
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr1
            )

            // get the block that the transaction was included in
            const txs = await ethers.provider.getTransaction(tx.hash)
            const block = await ethers.provider.getBlock(tx.blockHash)
            const blocktimestamp = block.timestamp

            // Beneficiary should be addr1
            const auctionEndTime = await auctionContractInstance.auctionEndTime()
            expect(auctionEndTime).to.equal(blocktimestamp + biddingTime)
        })

        it("Others should be able to bid (addr2)", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)

            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            // Addr2 balance before bid
            const addr2BalanceBefore = await ethers.provider.getBalance(addr2.address)

            // Bid from addr2
            var bidtx = await auctionContractInstance2.bid({
                value: ethers.utils.parseEther("1.0"),
            })
            bidtx = await bidtx.wait()

            // Highest bidder should be addr2
            const highestBidder = await auctionContractInstance2.highestBidder()
            expect(highestBidder).to.equal(addr2.address)

            // Highest bid should be 1.0
            const highestBid = await auctionContractInstance2.highestBid()
            expect(highestBid.toString()).to.equal(ethers.utils.parseEther("1.0"))

            // Addr2 balance after bid
            const addr2BalanceAfter = await ethers.provider.getBalance(addr2.address)
            expect(addr2BalanceAfter).to.equal(
                addr2BalanceBefore.sub(
                    ethers.utils
                        .parseEther("1.0")
                        .add(bidtx.cumulativeGasUsed.mul(bidtx.effectiveGasPrice))
                )
            )
        })

        it("highestBidder should change when bid is higher (addr3)", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)

            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            await auctionContractInstance2.bid({ value: ethers.utils.parseEther("1.0") })

            // Bid from addr3
            const auctionContractInstance3 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr3
            )
            await auctionContractInstance3.bid({ value: ethers.utils.parseEther("1.1") })
            const highestBidder = await auctionContractInstance3.highestBidder()
            expect(highestBidder).to.equal(addr3.address)
            const highestBid = await auctionContractInstance3.highestBid()
            expect(highestBid.toString()).to.equal(ethers.utils.parseEther("1.1"))
        })

        it("Should revert if bid is equal to highestBid", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)

            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            await auctionContractInstance2.bid({ value: ethers.utils.parseEther("1.0") })

            // Bid from addr3
            const auctionContractInstance3 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr3
            )
            expect(
                auctionContractInstance3.bid({ value: ethers.utils.parseEther("1.0") })
            ).to.be.revertedWithCustomError(auctionContractInstance3, "BidNotHighEnough")
        })
        it("Should revert if auction ended", async function () {
            const { auctionAddress, tx, addr1, addr2, addr3 } = await loadFixture(
                createAuctionFixture
            )

            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            expect(
                auctionContractInstance2.bid({ value: ethers.utils.parseEther("1.0") })
            ).to.be.revertedWithCustomError(auctionContractInstance2, "AuctionAlreadyEnded")
        })
    })
    describe("AuctionEnd", function () {
        it("Should be able to end auction", async function () {
            const { auctionAddress, tx, addr1, addr2, addr3 } = await loadFixture(
                createAuctionFixture
            )
            // Addr1 balance before auction end
            const addr1BalanceBefore = await ethers.provider.getBalance(addr1.address)

            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            await auctionContractInstance2.bid({
                value: ethers.utils.parseEther("2.0"),
            })

            // Increase the block timestamp by 1 hour
            await ethers.provider.send("evm_setNextBlockTimestamp", [
                Math.floor(Date.now() / 1000) + 3600,
            ])

            // End auction
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr1
            )
            var endtx = await auctionContractInstance.auctionEnd()
            endtx = await endtx.wait()
            const ended = await auctionContractInstance.ended()
            expect(ended).to.equal(true)

            // Addr1 balance after auction end (should include addr2's bid)
            const addr1BalanceAfter = await ethers.provider.getBalance(addr1.address)
            expect(addr1BalanceAfter).to.equal(
                addr1BalanceBefore
                    .add(ethers.utils.parseEther("2.0"))
                    .sub(endtx.cumulativeGasUsed.mul(endtx.effectiveGasPrice))
            )
        })
        it("Should allow withdraws if overbid", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)

            // Balances before auction end
            const addr1BalanceBefore = await ethers.provider.getBalance(addr1.address)
            const addr2BalanceBefore = await ethers.provider.getBalance(addr2.address)

            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            var bidtx = await auctionContractInstance2.bid({
                value: ethers.utils.parseEther("2.0"),
            })
            bidtx = await bidtx.wait()

            // Bid from addr3
            const auctionContractInstance3 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr3
            )
            await auctionContractInstance3.bid({
                value: ethers.utils.parseEther("3.0"),
            })

            // Increase the block timestamp by 1 hour
            await ethers.provider.send("evm_setNextBlockTimestamp", [
                Math.floor(Date.now() / 1000) + 3600,
            ])

            // End auction
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr1
            )
            var endtx = await auctionContractInstance.auctionEnd()
            endtx = await endtx.wait()

            // Addr1 balance after auction end (should include addr2's bid)
            const addr1BalanceAfter = await ethers.provider.getBalance(addr1.address)
            expect(addr1BalanceAfter).to.equal(
                addr1BalanceBefore
                    .add(ethers.utils.parseEther("3.0"))
                    .sub(endtx.cumulativeGasUsed.mul(endtx.effectiveGasPrice))
            )

            // Addr2 withdraw
            var withdrawtx = await auctionContractInstance2.withdraw()
            withdrawtx = await withdrawtx.wait()

            // Addr2 balance after auction end (should be refunded)
            const addr2BalanceAfter = await ethers.provider.getBalance(addr2.address)
            expect(addr2BalanceAfter).to.equal(
                addr2BalanceBefore
                    .sub(bidtx.cumulativeGasUsed.mul(bidtx.effectiveGasPrice))
                    .sub(withdrawtx.cumulativeGasUsed.mul(withdrawtx.effectiveGasPrice))
            )
        })
        it("Should only allow owner to end auction", async function () {
            const { auctionAddress, addr1, addr2, addr3 } = await loadFixture(createAuctionFixture)

            // Increase the block timestamp by 1 hour
            await ethers.provider.send("evm_setNextBlockTimestamp", [
                Math.floor(Date.now() / 1000) + 3600,
            ])

            // End auction
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            expect(auctionContractInstance.auctionEnd()).to.be.revertedWith(
                "Only the beneficiary can call this function"
            )
            console.log()
        })
        it("Should mint NFT to highest bidder (addr2) after auction end", async function () {
            const { auctionAddress, tx, addr1, addr2, addr3 } = await loadFixture(
                createAuctionFixture
            )
            // Bid from addr2
            const auctionContractInstance2 = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr2
            )
            await auctionContractInstance2.bid({
                value: ethers.utils.parseEther("2.0"),
            })

            // Addr2 nft balance before auction end (should be 1)
            const nftAddress = await auctionContractInstance2.auctionNftAddress()
            const nftContractInstance = new ethers.Contract(nftAddress, NftABI.abi, addr2)
            const balBefore = await nftContractInstance.balanceOf(addr2.address)
            expect(balBefore).to.equal(0)

            // Increase the block timestamp by 1 hour
            await ethers.provider.send("evm_setNextBlockTimestamp", [
                Math.floor(Date.now() / 1000) + 3600,
            ])

            // Addr1 end auction
            const auctionContractInstance = new ethers.Contract(
                auctionAddress,
                AuctionABI.abi,
                addr1
            )
            await auctionContractInstance.auctionEnd()

            // Addr2 nft balance after auction end (should be 1)
            const balAfter = await nftContractInstance.balanceOf(addr2.address)
            expect(balAfter).to.equal(1)
        })
    })
})
