// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title LoanAgreement
 * @dev Contract for creating and managing peer-to-peer loan agreements
 */
contract LoanAgreement {
    enum LoanStatus { Pending, Active, Completed, Defaulted, Cancelled }

    struct LoanAgreementData {
        address borrower;
        address lender;
        uint256 amount;
        uint256 interestRate; // In basis points (e.g., 500 = 5%)
        uint256 durationMonths;
        uint256 startTimestamp;
        uint256 endTimestamp;
        LoanStatus status;
        uint256 totalRepaid;
    }

    LoanAgreementData public loan;
    address public factory;
    
    event LoanActivated(address indexed lender, address indexed borrower, uint256 amount);
    event PaymentReceived(address indexed from, uint256 amount);
    event LoanCompleted(uint256 totalRepaid);
    event LoanDefaulted();
    event LoanCancelled();

    // Modifiers
    modifier onlyBorrower() {
        require(msg.sender == loan.borrower, "Only borrower can call this function");
        _;
    }

    modifier onlyLender() {
        require(msg.sender == loan.lender, "Only lender can call this function");
        _;
    }

    modifier inStatus(LoanStatus _status) {
        require(loan.status == _status, "Invalid loan status for this operation");
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    /**
     * @dev Initializes the loan agreement with all necessary parameters
     */
    function initialize(
        address _borrower,
        address _lender,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _durationMonths
    ) external {
        require(msg.sender == factory, "Only factory can initialize");
        require(_borrower != address(0) && _lender != address(0), "Invalid addresses");
        require(_amount > 0, "Loan amount must be greater than 0");
        require(_durationMonths > 0, "Loan duration must be greater than 0");
        
        loan.borrower = _borrower;
        loan.lender = _lender;
        loan.amount = _amount;
        loan.interestRate = _interestRate;
        loan.durationMonths = _durationMonths;
        loan.status = LoanStatus.Pending;
    }

    /**
     * @dev Activates the loan, can only be called by lender and must include the loan amount
     */
    function activateLoan() external payable onlyLender inStatus(LoanStatus.Pending) {
        require(msg.value == loan.amount, "Incorrect loan amount");
        
        loan.status = LoanStatus.Active;
        loan.startTimestamp = block.timestamp;
        loan.endTimestamp = block.timestamp + (loan.durationMonths * 30 days);
        
        // Transfer the loan amount to the borrower
        (bool sent, ) = loan.borrower.call{value: msg.value}("");
        require(sent, "Failed to send loan amount to borrower");
        
        emit LoanActivated(loan.lender, loan.borrower, loan.amount);
    }

    /**
     * @dev Make a loan repayment, can be called by anyone but typically the borrower
     */
    function makePayment() external payable inStatus(LoanStatus.Active) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        loan.totalRepaid += msg.value;
        
        // Calculate the total due amount with interest
        uint256 totalDue = calculateTotalDue();
        
        // Check if the loan is fully paid
        if (loan.totalRepaid >= totalDue) {
            loan.status = LoanStatus.Completed;
            emit LoanCompleted(loan.totalRepaid);
        }
        
        // Transfer payment to the lender
        (bool sent, ) = loan.lender.call{value: msg.value}("");
        require(sent, "Failed to send payment to lender");
        
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Marks the loan as defaulted, can only be called by lender after loan end date
     */
    function markDefaulted() external onlyLender inStatus(LoanStatus.Active) {
        require(block.timestamp > loan.endTimestamp, "Loan period not over yet");
        require(loan.totalRepaid < calculateTotalDue(), "Loan is fully paid");
        
        loan.status = LoanStatus.Defaulted;
        emit LoanDefaulted();
    }

    /**
     * @dev Cancels the loan agreement, can only be called if loan is pending
     */
    function cancelLoan() external inStatus(LoanStatus.Pending) {
        require(msg.sender == loan.lender || msg.sender == loan.borrower, "Not authorized");
        
        loan.status = LoanStatus.Cancelled;
        emit LoanCancelled();
    }

    /**
     * @dev Calculates the total amount due (principal + interest)
     */
    function calculateTotalDue() public view returns (uint256) {
        // Calculate interest: principal * rate * time / 10000
        // Rate is in basis points (e.g., 500 = 5%)
        uint256 interest = (loan.amount * loan.interestRate * loan.durationMonths) / (10000 * 12);
        return loan.amount + interest;
    }

    /**
     * @dev Returns monthly payment amount
     */
    function getMonthlyPayment() external view returns (uint256) {
        return calculateTotalDue() / loan.durationMonths;
    }

    /**
     * @dev Returns current loan status and details
     */
    function getLoanDetails() external view returns (
        address borrower,
        address lender,
        uint256 amount,
        uint256 interestRate,
        uint256 durationMonths,
        uint256 startTimestamp,
        uint256 endTimestamp,
        LoanStatus status,
        uint256 totalRepaid,
        uint256 totalDue
    ) {
        return (
            loan.borrower,
            loan.lender,
            loan.amount,
            loan.interestRate,
            loan.durationMonths,
            loan.startTimestamp,
            loan.endTimestamp,
            loan.status,
            loan.totalRepaid,
            calculateTotalDue()
        );
    }
    
    /**
     * @dev Returns loan status as a string for UI display
     */
    function getLoanStatusString() external view returns (string memory) {
        if (loan.status == LoanStatus.Pending) return "Pending";
        if (loan.status == LoanStatus.Active) return "Active";
        if (loan.status == LoanStatus.Completed) return "Completed";
        if (loan.status == LoanStatus.Defaulted) return "Defaulted";
        if (loan.status == LoanStatus.Cancelled) return "Cancelled";
        return "Unknown";
    }
} 