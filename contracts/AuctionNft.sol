// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract AuctionNft is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // auction contracts map
    mapping(address => bool) public auctionContracts;
    mapping(uint256 => uint) private _tokenBids;


    // only auction contracts modifier
    modifier onlyAuction() {
        require(auctionContracts[msg.sender] == true, "Only auction contracts can mint");
        _;
    }

    constructor() ERC721("AuctionNft", "ANFT") {}

    function safeMint(address to, uint amount) public onlyAuction {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        // _setTokenURI(tokenId, uri);
    }

    function tokenBid(uint256 tokenId) public view returns (uint) {
        _requireMinted(tokenId);

        return _tokenBids[tokenId];
    }

    // add auction contract to map
    function addAuctionContract(address auctionContract) public onlyOwner {
        auctionContracts[auctionContract] = true;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
