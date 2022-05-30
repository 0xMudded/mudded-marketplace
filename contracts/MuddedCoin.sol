//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// author: https://twitter.com/0xMudded

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MuddedCoin is ERC20 {
  constructor() ERC20("Mudded Coin", "MUD") {}

  function freeMint() public {
    _mint(msg.sender, 1000 * (10**18));
  }
}
