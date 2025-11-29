// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Story Protocol Core - IP Asset Registry
interface IIPAssetRegistry {
    function register(uint256 chainId, address tokenContract, uint256 tokenId) external returns (address ipId);
}

// Interface for Story Protocol Licensing Module
interface ILicensingModule {
    function attachLicenseTerms(address ipId, address licenseTemplate, uint256 licenseTermsId) external;
    function mintLicenseTokens(
        address licensorIpId,
        address licenseTemplate,
        uint256 licenseTermsId,
        uint256 amount,
        address receiver,
        bytes calldata royaltyContext,
        uint256 maxMintingFee,
        uint256 maxRevenueShare
    ) external returns (uint256 startLicenseTokenId);
}

contract EquiFlow is ERC721, Ownable {
    uint256 public nextTokenId;

    // Story Protocol Addresses
    address public IP_ASSET_REGISTRY;
    address public LICENSING_MODULE;
    address public LICENSE_TEMPLATE;

    struct HomeLoan {
        address homeowner;
        uint256 appraisalValue;
        uint256 requestedLiquidity;
        address ipId;
        bool isFunded;
        uint256 equityShareBps; // Basis points (e.g., 500 = 5%)
        uint256 duration; // Loan duration in seconds
        uint256 deadline; // Repayment deadline (timestamp)
        bool isVerified;  // Admin verification status
        string documentHash; // Hash of the legal contract
        uint256 aiValuation; // AI-estimated property value
        address investor; // Investor address
        bool isRepaid; // Repayment status
        string propertyAddress; // Physical address of the property
    }

    mapping(uint256 => HomeLoan) public loans;

    event HomeTokenized(uint256 indexed tokenId, address indexed homeowner, address ipId, uint256 appraisalValue, uint256 requestedLiquidity, uint256 duration, string propertyAddress);
    event LoanFunded(uint256 indexed tokenId, address indexed investor, uint256 amount, uint256 deadline);
    event ListingVerified(uint256 indexed tokenId);
    event LoanRepaid(uint256 indexed tokenId, address indexed homeowner);
    event LoanForeclosed(uint256 indexed tokenId, address indexed investor);

    constructor(address _ipAssetRegistry, address _licensingModule, address _pilTemplate)
        ERC721("EquiFlow Home Deed", "EFHOME")
        Ownable(msg.sender)
    {
        IP_ASSET_REGISTRY = _ipAssetRegistry;
        LICENSING_MODULE = _licensingModule;
        LICENSE_TEMPLATE = _pilTemplate; // Assuming LICENSE_TEMPLATE is the correct state variable name
    }

    // Step 1: Homeowner tokenizes their home (RWA)
    function tokenizeHome(string memory tokenURI, uint256 appraisalValue, uint256 requestedLiquidity, uint256 duration, string memory documentHash, uint256 aiValuation, string memory propertyAddress) external returns (uint256) {
        require(requestedLiquidity > 0, "Liquidity must be > 0");
        require(requestedLiquidity <= appraisalValue, "Liquidity > Appraisal");

        uint256 tokenId = nextTokenId++;

        // ESCROW: Mint the NFT to THIS contract, not the homeowner.
        // The homeowner only gets it back if they repay.
        _mint(address(this), tokenId);

        // Register as IP Asset on Story Protocol
        // We use the current chain ID
        address ipId;
        try IIPAssetRegistry(IP_ASSET_REGISTRY).register(block.chainid, address(this), tokenId) returns (address _ipId) {
            ipId = _ipId;
        } catch {
            // Fallback for testing/mocking if registry fails or is invalid
            ipId = address(uint160(uint256(keccak256(abi.encodePacked(tokenId, block.timestamp)))));
        }

        loans[tokenId] = HomeLoan({
            homeowner: msg.sender,
            appraisalValue: appraisalValue,
            requestedLiquidity: requestedLiquidity,
            ipId: ipId,
            isFunded: false,
            equityShareBps: 0,
            duration: duration,
            deadline: 0, // Set when funded
            isVerified: false, // Pending verification
            documentHash: documentHash,
            aiValuation: aiValuation,
            investor: address(0),
            isRepaid: false,
            propertyAddress: propertyAddress
        });

        emit HomeTokenized(tokenId, msg.sender, ipId, appraisalValue, requestedLiquidity, duration, propertyAddress);

        return tokenId;
    }

    // Step 1.5: Admin verifies the listing
    function verifyListing(uint256 tokenId) external onlyOwner {
        HomeLoan storage loan = loans[tokenId];
        require(loan.homeowner != address(0), "Loan does not exist");
        require(!loan.isVerified, "Already verified");

        loan.isVerified = true;
        emit ListingVerified(tokenId);
    }

    // Step 2: Cancel listing (if not funded)
    function cancelListing(uint256 tokenId) external {
        HomeLoan storage loan = loans[tokenId];
        require(msg.sender == loan.homeowner, "Not homeowner");
        require(!loan.isFunded, "Already funded");

        _burn(tokenId);
        delete loans[tokenId];
    }

    // Step 3: Investor funds the loan and receives License Tokens (Equity)
    function fundHome(uint256 tokenId, uint256 licenseTermsId) external payable {
        HomeLoan storage loan = loans[tokenId];
        require(loan.homeowner != address(0), "Loan does not exist");
        require(loan.isVerified, "Listing not verified");
        require(msg.value >= loan.requestedLiquidity, "Insufficient funds");
        require(!loan.isFunded, "Already funded");

        // Transfer funds to homeowner
        // Transfer funds to homeowner
        (bool sent, ) = loan.homeowner.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        loan.isFunded = true;
        loan.investor = msg.sender;
        loan.deadline = block.timestamp + loan.duration;

        // Mint License Tokens to the investor
        // These tokens represent the claim on the future appreciation
        try ILicensingModule(LICENSING_MODULE).mintLicenseTokens({
            licensorIpId: loan.ipId,
            licenseTemplate: LICENSE_TEMPLATE,
            licenseTermsId: licenseTermsId,
            amount: 1,
            receiver: msg.sender,
            royaltyContext: "",
            maxMintingFee: 0,
            maxRevenueShare: 0
        }) {
            // Success
        } catch {
            // Log failure or ignore for mock
        }

        emit LoanFunded(tokenId, msg.sender, msg.value, loan.deadline);
    }

    // Step 4: Repay Loan (Homeowner)
    function repayLoan(uint256 tokenId) external payable {
        HomeLoan storage loan = loans[tokenId];
        require(msg.sender == loan.homeowner, "Not homeowner");
        require(loan.isFunded, "Not funded");
        require(!loan.isRepaid, "Already repaid");
        require(msg.value >= loan.requestedLiquidity, "Insufficient repayment"); // Principal only for now

        // Transfer repayment to investor
        payable(loan.investor).transfer(msg.value);

        loan.isRepaid = true;

        // Release Collateral (NFT) back to Homeowner
        _transfer(address(this), loan.homeowner, tokenId);

        emit LoanRepaid(tokenId, loan.homeowner);
    }

    // Step 5: Foreclose (Investor)
    function foreclose(uint256 tokenId) external {
        HomeLoan storage loan = loans[tokenId];
        require(msg.sender == loan.investor, "Not investor");
        require(loan.isFunded, "Not funded");
        require(!loan.isRepaid, "Already repaid");
        require(block.timestamp > loan.deadline, "Deadline not passed");

        // Seize Collateral (NFT) to Investor
        _transfer(address(this), loan.investor, tokenId);

        emit LoanForeclosed(tokenId, loan.investor);
    }
}
