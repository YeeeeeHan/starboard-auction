task("big", "Create auction")
    .addParam("contract", "The address of the Auction contract")
    .addParam("biddingtime", "The bidding end time from now in seconds")
    .setAction(async (taskArgs) => {
        const biddingTime = taskArgs.biddingtime
        const networkId = network.name
        console.log("Creating auction on network", networkId)

        //create a new wallet instance
        const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)

        //create a SimpleAuction contract factory
        const SimpleAuction = await ethers.getContractFactory("Auction", wallet)
        //create a SimpleAuction contract instance
        //this is what you will call to interact with the deployed contract
        const simpleAuction = await SimpleAuction.attach(
            "0x405Fa6AF6df1C11eEA3419EF757d25431177a900"
        )

        let result = await simpleAuction.createAuction(biddingTime)
        await console.log("Result:", result)
    })
