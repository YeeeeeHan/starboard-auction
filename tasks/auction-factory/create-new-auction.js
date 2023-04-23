task("create-auction", "Create auction")
    .addParam("contract", "The address of the SimpleAuctionFactory contract")
    .addParam("biddingtime", "The bidding end time from now in seconds")
    .setAction(async (taskArgs) => {
        const contractAddr = taskArgs.contract
        const biddingTime = taskArgs.biddingtime
        const networkId = network.name
        console.log("Creating auction on network", networkId)

        //create a new wallet instance
        const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)

        //create a SimpleAuctionFactory contract factory
        const SimpleAuctionFactory = await ethers.getContractFactory("SimpleAuctionFactory", wallet)
        //create a SimpleAuctionFactory contract instance
        //this is what you will call to interact with the deployed contract
        const simpleAuction = await SimpleAuctionFactory.attach(contractAddr)

        let result = await simpleAuction.createAuction(biddingTime)
        console.log("Result:", result)
    })
