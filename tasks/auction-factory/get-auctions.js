task("get-auctions", "Get auctions")
    .addParam("contract", "The address of the SimpleAuctionFactory contract")
    .setAction(async (taskArgs) => {
        const contractAddr = taskArgs.contract
        const networkId = network.name
        console.log("Getting auctions on network", networkId)

        //create a new wallet instance
        const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)

        //create a SimpleAuctionFactory contract factory
        const SimpleAuctionFactory = await ethers.getContractFactory("SimpleAuctionFactory", wallet)
        //create a SimpleAuctionFactory contract instance
        //this is what you will call to interact with the deployed contract
        const simpleAuction = await SimpleAuctionFactory.attach(contractAddr)

        let result = await simpleAuction.getAuctions()
        console.log("Result:", result)
    })
