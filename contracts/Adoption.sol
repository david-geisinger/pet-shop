pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;
    mapping (uint => uint) petIdToPrice;

    modifier validPet(uint petId) {
        require(petId >= 0 && petId <= 15);
        _;
    }

    modifier ownsPet(uint petId) {
        require(adopters[petId] == msg.sender);
        _;
    }

    // Adopting a pet
    function adopt(uint petId) public validPet(petId) returns (uint) {
        adopters[petId] = msg.sender;
        return petId;
    }

    // Give back naughty pet - updated comment
    function handleReturn(uint petId) public validPet(petId) ownsPet(petId) returns (uint) {
        adopters[petId] = address(0); //Set to 0 address
        // return half of the pet cost if the owner bought the pet
        uint price = petIdToPrice[petId];
        if (price > 0) {
            msg.sender.transfer(price / 2);
        }

        return petId;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    function handleBuy(uint petId) public payable {
        require(msg.value >= 1 ether, "Pets cost at least 1 ETH cheapskate");
        adopt(petId);
        petIdToPrice[petId] = msg.value;
    }

}