// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract MockIPAssetRegistry {
    function register(uint256 chainId, address tokenContract, uint256 tokenId) external pure returns (address ipId) {
        return address(uint160(uint256(keccak256(abi.encodePacked(chainId, tokenContract, tokenId)))));
    }
}

contract MockLicensingModule {
    function attachLicenseTerms(address ipId, address licenseTemplate, uint256 licenseTermsId) external {}

    function mintLicenseTokens(
        address licensorIpId,
        address licenseTemplate,
        uint256 licenseTermsId,
        uint256 amount,
        address receiver,
        bytes calldata royaltyContext,
        uint256 maxMintingFee,
        uint256 maxRevenueShare
    ) external returns (uint256 startLicenseTokenId) {
        return 1;
    }
}

contract MockPILTemplate {
    // Placeholder
}
