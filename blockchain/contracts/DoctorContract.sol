// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DoctorStore {

    struct Doctor {
        uint256 id;
        string  name;
        string  specialty;
        string  experience;
        uint256 fee;
        bool    available;
        uint256 timestamp;
    }

    Doctor[] public doctors;
    uint256  public doctorCount;

    // owner = deployer (hospital admin)
    address public owner;

    event DoctorRegistered(uint256 id, string name, string specialty, uint256 fee);
    event DoctorUpdated(uint256 id, bool available);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only hospital admin can do this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Register a new doctor — only admin
    function registerDoctor(
        string memory _name,
        string memory _specialty,
        string memory _experience,
        uint256 _fee
    ) public onlyOwner {
        doctorCount++;
        doctors.push(Doctor({
            id:         doctorCount,
            name:       _name,
            specialty:  _specialty,
            experience: _experience,
            fee:        _fee,
            available:  true,
            timestamp:  block.timestamp
        }));
        emit DoctorRegistered(doctorCount, _name, _specialty, _fee);
    }

    // Update availability — only admin
    function setAvailability(uint256 _id, bool _available) public onlyOwner {
        require(_id > 0 && _id <= doctorCount, "Invalid doctor ID");
        doctors[_id - 1].available = _available;
        emit DoctorUpdated(_id, _available);
    }

    // Get all doctors
    function getAllDoctors() public view returns (Doctor[] memory) {
        return doctors;
    }

    // Get single doctor
    function getDoctor(uint256 _id) public view returns (Doctor memory) {
        require(_id > 0 && _id <= doctorCount, "Invalid doctor ID");
        return doctors[_id - 1];
    }

    // Get total count
    function getCount() public view returns (uint256) {
        return doctorCount;
    }
}
