// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./LoanAgreement.sol";

/**
 * @title LoanAgreementFactory
 * @dev Factory contract for creating new loan agreement contracts
 */
contract LoanAgreementFactory {
    // Array to track all created loan agreements
    address[] public loanAgreements;
    
    // Mapping from user address to their loan agreements (as lender or borrower)
    mapping(address => address[]) public userLoanAgreements;
    
    event LoanAgreementCreated(
        address indexed borrower,
        address indexed lender,
        address loanAddress,
        uint256 amount,
        uint256 interestRate,
        uint256 durationMonths
    );

    /**
     * @dev Creates a new loan agreement contract
     * @param borrower Address of the borrower
     * @param amount Loan amount in wei
     * @param interestRate Interest rate in basis points (e.g., 500 = 5%)
     * @param durationMonths Loan duration in months
     * @return Address of the newly created loan agreement contract
     */
    function createLoanAgreement(
        address borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 durationMonths
    ) external returns (address) {
        // Create new loan agreement contract
        LoanAgreement newLoan = new LoanAgreement();
        
        // Initialize the loan agreement
        newLoan.initialize(
            borrower,
            msg.sender, // Lender is the caller
            amount,
            interestRate,
            durationMonths
        );
        
        // Add to tracking arrays
        loanAgreements.push(address(newLoan));
        userLoanAgreements[borrower].push(address(newLoan));
        userLoanAgreements[msg.sender].push(address(newLoan));
        
        emit LoanAgreementCreated(
            borrower,
            msg.sender,
            address(newLoan),
            amount,
            interestRate,
            durationMonths
        );
        
        return address(newLoan);
    }

    /**
     * @dev Gets all loan agreements created by this factory
     * @return Array of loan agreement addresses
     */
    function getLoanAgreements() external view returns (address[] memory) {
        return loanAgreements;
    }
    
    /**
     * @dev Gets all loan agreements associated with a specific user
     * @param user User address
     * @return Array of loan agreement addresses for the user
     */
    function getUserLoanAgreements(address user) external view returns (address[] memory) {
        return userLoanAgreements[user];
    }
    
    /**
     * @dev Gets the count of loan agreements created
     * @return Count of loan agreements
     */
    function getLoanAgreementsCount() external view returns (uint256) {
        return loanAgreements.length;
    }
} 