//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// author: https://twitter.com/0xMudded

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MuddedMarketplace {
  struct Whitelist {
    string name;
    uint256 price;
    uint256 startTime;
    uint256 available;
    uint256 purchased;
  }

  address owner;
  address public token;
  uint256 whitelistCounter = 0;
  mapping(uint256 => Whitelist) public whitelists;
  mapping(uint256 => mapping(address => bool)) public hasPurchased;
  mapping(uint256 => address[]) public buyerAddresses;

  constructor(address _token) {
    owner = msg.sender;
    token = _token;
  }

  function addWhitelist(
    string calldata _name,
    uint256 _price,
    uint256 _startTime,
    uint256 _available
  ) external onlyOwner {
    whitelists[whitelistCounter] = (Whitelist(_name, _price, _startTime, _available, 0));
    whitelistCounter++;
  }

  function updateWhitelist(
    uint256 _price,
    uint256 _startTime,
    uint256 _available,
    uint256 _whitelistId
  ) external onlyOwner {
     require(whitelists[_whitelistId].purchased <= _available, "Total purchased exceeds amount available!");
     
     Whitelist memory whitelist = whitelists[_whitelistId];
     whitelists[_whitelistId] = (Whitelist(whitelist.name, _price, _startTime, _available, whitelist.purchased));
  }

  function purchase(uint256 _whitelistId) external {
    require(block.timestamp >= whitelists[_whitelistId].startTime, "Whitelist not live!");
    require(whitelists[_whitelistId].available - whitelists[_whitelistId].purchased > 0, "None available!");
    require(!hasPurchased[_whitelistId][msg.sender], "Buyer has already purchased!");

    ERC20(token).transferFrom(msg.sender, address(this), whitelists[_whitelistId].price);
    whitelists[_whitelistId].purchased += 1;
    buyerAddresses[_whitelistId].push(msg.sender);
    hasPurchased[_whitelistId][msg.sender] = true;
  }

  function getWhitelist(uint256 _whitelistId) public view returns (Whitelist memory) {
      return whitelists[_whitelistId];
  }

  function getBuyerAddresses(uint256 _whitelistId) public view returns (address[] memory) {
    return buyerAddresses[_whitelistId];
  }

  function ownerWithdraw() public onlyOwner {
    ERC20(token).transfer(owner, ERC20(token).balanceOf(address(this)));
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner!");
    _;
  }
}
