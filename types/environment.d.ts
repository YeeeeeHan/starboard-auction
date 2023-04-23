declare global {
  declare namespace NodeJS {
    interface ProcessEnv {
      PRIVATE_KEY: string;
      ETHERSCAN_API_KEY: string;
      POLYGONSCAN_API_KEY: string;
      ALCHEMY_MUMBAI_URL: string;
      ALCHEMY_GOERLI_URL: string;
    }
  }
}

export {};
