// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ForecastRegistry {
    address public owner;
    address public relayer;
    mapping(bytes32 => uint256) public anchoredAt;
    event ForecastAnchored(bytes32 indexed receiptHash, address indexed creator, bytes32 indexed marketIdHash, bytes32 previousReceiptHash, uint256 timestamp);

    constructor(address initialRelayer) { owner = msg.sender; relayer = initialRelayer; }
    function setRelayer(address nextRelayer) external { require(msg.sender == owner, "owner only"); relayer = nextRelayer; }
    function anchor(bytes32 receiptHash, address creator, bytes32 marketIdHash, bytes32 previousReceiptHash) external {
        require(msg.sender == relayer, "relayer only");
        require(receiptHash != bytes32(0), "zero hash");
        require(anchoredAt[receiptHash] == 0, "already anchored");
        anchoredAt[receiptHash] = block.timestamp;
        emit ForecastAnchored(receiptHash, creator, marketIdHash, previousReceiptHash, block.timestamp);
    }
}
