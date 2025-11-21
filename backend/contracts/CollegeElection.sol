// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract CollegeElection {
    enum ElectionPhase {
        Draft,
        Voting,
        Ended
    }

    struct Candidate {
        uint256 id;
        string name;
        string tagline;
        string manifesto;
        string imageUri;
        uint256 voteCount;
    }

    struct ElectionSnapshot {
        string title;
        string description;
        string bannerImage;
        ElectionPhase phase;
        uint256 candidateCount;
        uint256 totalVotes;
        uint256 votingStartsAt;
        uint256 votingEndsAt;
        uint256 lastVoteAt;
        address lastVoter;
    }

    mapping(uint256 => Candidate) private _candidates;
    mapping(address => bool) public hasVoted;

    uint256 public candidateCount;
    uint256 public totalVotes;
    uint256 public votingStartsAt;
    uint256 public votingEndsAt;
    uint256 public lastVoteAt;
    address public lastVoter;

    address public admin;

    string public electionTitle;
    string public electionDescription;
    string public bannerImage;

    ElectionPhase public phase;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event CandidateUpdated(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event PhaseChanged(ElectionPhase newPhase);
    event ElectionMetadataUpdated(string title, string description, string bannerImage);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event VoteCountAdjusted(uint256 indexed candidateId, uint256 previousCount, uint256 newCount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier candidateExists(uint256 id) {
        require(id > 0 && id <= candidateCount, "Invalid candidate");
        require(_candidates[id].id != 0, "Candidate removed");
        _;
    }

    constructor() {
        admin = msg.sender;
        phase = ElectionPhase.Draft;
        electionTitle = "College Elections";
        electionDescription = "Shape the future leadership of your campus.";
        bannerImage = "";
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    function addCandidate(
        string calldata name,
        string calldata tagline,
        string calldata manifesto,
        string calldata imageUri
    ) external onlyAdmin {
        require(phase == ElectionPhase.Draft, "Registration closed");
        require(bytes(name).length > 0, "Name required");

        candidateCount += 1;
        _candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: name,
            tagline: tagline,
            manifesto: manifesto,
            imageUri: imageUri,
            voteCount: 0
        });

        emit CandidateAdded(candidateCount, name);
    }

    function updateCandidate(
        uint256 candidateId,
        string calldata name,
        string calldata tagline,
        string calldata manifesto,
        string calldata imageUri
    ) external onlyAdmin candidateExists(candidateId) {
        Candidate storage candidate = _candidates[candidateId];

        if (bytes(name).length > 0) {
            candidate.name = name;
        }
        candidate.tagline = tagline;
        candidate.manifesto = manifesto;
        candidate.imageUri = imageUri;

        emit CandidateUpdated(candidateId, candidate.name);
    }

    function updateElectionMeta(
        string calldata title,
        string calldata description,
        string calldata banner
    ) external onlyAdmin {
        if (bytes(title).length > 0) {
            electionTitle = title;
        }
        electionDescription = description;
        bannerImage = banner;
        emit ElectionMetadataUpdated(electionTitle, electionDescription, bannerImage);
    }

    function configureVotingWindow(uint256 startTime, uint256 endTime) external onlyAdmin {
        require(endTime == 0 || endTime > startTime, "Invalid window");
        votingStartsAt = startTime;
        votingEndsAt = endTime;
    }

    function startVoting() external onlyAdmin {
        require(phase == ElectionPhase.Draft, "Already started");
        require(candidateCount > 0, "No candidates");
        if (votingStartsAt != 0) {
            require(block.timestamp >= votingStartsAt, "Too early");
        }
        phase = ElectionPhase.Voting;
        emit PhaseChanged(phase);
    }

    function closeVoting() external onlyAdmin {
        require(phase == ElectionPhase.Voting, "Not voting");
        _endVoting();
    }

    function vote(uint256 candidateId) external candidateExists(candidateId) {
        require(phase == ElectionPhase.Voting, "Voting closed");
        if (votingStartsAt != 0) {
            require(block.timestamp >= votingStartsAt, "Not started");
        }
        if (votingEndsAt != 0) {
            require(block.timestamp <= votingEndsAt, "Election ended");
        }
        require(!hasVoted[msg.sender], "Already voted");

        hasVoted[msg.sender] = true;
        Candidate storage candidate = _candidates[candidateId];
        candidate.voteCount += 1;
        totalVotes += 1;
        lastVoter = msg.sender;
        lastVoteAt = block.timestamp;

        emit VoteCast(msg.sender, candidateId);

        if (votingEndsAt != 0 && block.timestamp >= votingEndsAt) {
            _endVoting();
        }
    }

    function refreshPhase() external {
        if (phase == ElectionPhase.Voting && votingEndsAt != 0 && block.timestamp > votingEndsAt) {
            _endVoting();
        }
    }

    function getCandidate(uint256 id)
        external
        view
        candidateExists(id)
        returns (string memory name, uint256 votes)
    {
        Candidate storage candidate = _candidates[id];
        return (candidate.name, candidate.voteCount);
    }

    function getCandidateDetails(uint256 id)
        external
        view
        candidateExists(id)
        returns (Candidate memory)
    {
        return _candidates[id];
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory list = new Candidate[](candidateCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= candidateCount; i++) {
            Candidate storage candidate = _candidates[i];
            list[index] = candidate;
            index++;
        }

        return list;
    }

    function getLeadingCandidate() external view returns (Candidate memory leader) {
        uint256 highestVotes;
        uint256 leaderId;

        for (uint256 i = 1; i <= candidateCount; i++) {
            Candidate storage candidate = _candidates[i];
            if (candidate.voteCount > highestVotes) {
                highestVotes = candidate.voteCount;
                leaderId = i;
            }
        }

        if (leaderId != 0) {
            leader = _candidates[leaderId];
        }
    }

    function getElectionSnapshot() external view returns (ElectionSnapshot memory snapshot) {
        snapshot = ElectionSnapshot({
            title: electionTitle,
            description: electionDescription,
            bannerImage: bannerImage,
            phase: phase,
            candidateCount: candidateCount,
            totalVotes: totalVotes,
            votingStartsAt: votingStartsAt,
            votingEndsAt: votingEndsAt,
            lastVoteAt: lastVoteAt,
            lastVoter: lastVoter
        });
    }

    function checkIfVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }

    function isVotingOpen() external view returns (bool) {
        if (phase != ElectionPhase.Voting) {
            return false;
        }
        if (votingEndsAt != 0 && block.timestamp > votingEndsAt) {
            return false;
        }
        if (votingStartsAt != 0 && block.timestamp < votingStartsAt) {
            return false;
        }
        return true;
    }

    function adminSetVoteCount(uint256 candidateId, uint256 newCount)
        external
        onlyAdmin
        candidateExists(candidateId)
    {
        Candidate storage candidate = _candidates[candidateId];
        uint256 previous = candidate.voteCount;
        if (newCount == previous) {
            return;
        }

        if (newCount > previous) {
            uint256 increase = newCount - previous;
            candidate.voteCount = newCount;
            totalVotes += increase;
        } else {
            uint256 decrease = previous - newCount;
            require(totalVotes >= decrease, "Invalid total");
            candidate.voteCount = newCount;
            totalVotes -= decrease;
        }

        emit VoteCountAdjusted(candidateId, previous, newCount);
    }

    function _endVoting() private {
        phase = ElectionPhase.Ended;
        emit PhaseChanged(phase);
    }
}

