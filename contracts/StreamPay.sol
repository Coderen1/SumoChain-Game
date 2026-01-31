// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StreamPay
 * @dev Pay-Per-Second video streaming payment contract for Monad.
 */
contract StreamPay {
    // State variables
    address public owner;
    uint256 public ratePerSecond = 0.0000001 ether; // Example rate

    struct Deposit {
        uint256 balance;
        uint256 startTime;
        bool isStreaming;
    }

    mapping(address => Deposit) public userDeposits;

    // Events
    event StreamStarted(address indexed user, uint256 startTime, uint256 deposit);
    event StreamStopped(address indexed user, uint256 endTime, uint256 cost, uint256 refund);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Starts the stream session. User must deposit ETH/MON.
     */
    function startStream() external payable {
        require(msg.value > 0, "Deposit required to start stream");
        require(!userDeposits[msg.sender].isStreaming, "Stream already active");

        userDeposits[msg.sender] = Deposit({
            balance: msg.value,
            startTime: block.timestamp,
            isStreaming: true
        });

        emit StreamStarted(msg.sender, block.timestamp, msg.value);
    }

    /**
     * @dev Stops the stream, calculates cost, refunds remaining balance.
     */
    function stopStream() external {
        Deposit storage userDeposit = userDeposits[msg.sender];
        require(userDeposit.isStreaming, "No active stream");

        uint256 duration = block.timestamp - userDeposit.startTime;
        uint256 cost = duration * ratePerSecond;

        // If cost exceeds balance, take full balance (should have logic to auto-stop in real app)
        if (cost > userDeposit.balance) {
            cost = userDeposit.balance;
        }

        uint256 refund = userDeposit.balance - cost;

        // Reset user state
        userDeposit.isStreaming = false;
        userDeposit.balance = 0;
        userDeposit.startTime = 0;

        // Transfer cost to owner
        if (cost > 0) {
            (bool costSent, ) = payable(owner).call{value: cost}("");
            require(costSent, "Failed to send cost to owner");
        }

        // Refund remaining balance to user
        if (refund > 0) {
            (bool refundSent, ) = payable(msg.sender).call{value: refund}("");
            require(refundSent, "Failed to refund user");
        }

        emit StreamStopped(msg.sender, block.timestamp, cost, refund);
    }

    /**
     * @dev Updates the streaming rate. Only owner.
     */
    function setRate(uint256 _ratePerSecond) external {
        require(msg.sender == owner, "Only owner");
        ratePerSecond = _ratePerSecond;
    }
}
