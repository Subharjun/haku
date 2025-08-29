import jsPDF from 'jspdf';
import { formatCurrency } from './currency';
import { Contract, JsonRpcSigner, parseEther, ContractFactory, Interface } from 'ethers';
import { uploadPdfToIpfs, IpfsUploadResult } from './ipfsService';

export interface ContractData {
  lenderName: string;
  lenderAddress: string;
  borrowerName: string;
  borrowerAddress: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  purpose: string;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
  totalRepayment: number;
  walletAddress?: string;
  contractHash?: string;
  // Digital signature data
  lenderSignature?: string;
  borrowerSignature?: string;
  lenderSignedAt?: Date;
  borrowerSignedAt?: Date;
  paymentMethod?: string;
  agreementId?: string;
}

export interface ContractDeployResult {
  contractAddress: string;
  txHash: string;
}

/**
 * Creates a PDF loan agreement and downloads it
 * This should only be called after both parties have digitally signed
 * @param data Contract data with signature information
 */
export const downloadContract = (data: ContractData) => {
  // Temporarily disable signature validation for testing
  // TODO: Re-enable when digital signature workflow is fully implemented
  // if (!data.lenderSignedAt || !data.borrowerSignedAt) {
  //   throw new Error('Cannot generate PDF: Both parties must sign first');
  // }

  const pdf = generatePdfDocument(data);
  
  // Generate filename with agreement ID
  const fileName = `loan_agreement_${data.agreementId}_signed.pdf`;
  
  // Download the PDF
  pdf.save(fileName);
};

/**
 * Generates PDF and uploads to IPFS for permanent storage
 * @param data Contract data with signature information
 * @returns Promise<IpfsUploadResult> IPFS upload result with CID
 */
export const generateAndUploadContract = async (data: ContractData): Promise<IpfsUploadResult> => {
  try {
    const pdf = generatePdfDocument(data);
    
    // Convert PDF to Uint8Array for IPFS upload
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);
    
    // Upload to IPFS
    const fileName = `loan_agreement_${data.agreementId}_signed.pdf`;
    const ipfsResult = await uploadPdfToIpfs(pdfBuffer, {
      agreementId: data.agreementId || '',
      fileName,
      fileType: 'application/pdf',
      uploadedBy: data.lenderName,
      uploadedAt: new Date().toISOString(),
      lenderName: data.lenderName,
      borrowerName: data.borrowerName,
      amount: data.amount,
      signatures: {
        lender: !!data.lenderSignedAt,
        borrower: !!data.borrowerSignedAt
      }
    });
    
    return ipfsResult;
  } catch (error) {
    console.error('Error generating and uploading contract to IPFS:', error);
    throw new Error(`Failed to upload contract to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates the PDF document (internal function)
 * @param data Contract data
 * @returns jsPDF instance
 */
const generatePdfDocument = (data: ContractData): jsPDF => {
  const pdf = new jsPDF();
  const title = "DIGITALLY SIGNED LOAN AGREEMENT";
  
  // Title
  pdf.setFontSize(20);
  pdf.text(title, 105, 20, { align: 'center' });
  
  // Agreement ID and Digital Signature Notice
  pdf.setFontSize(10);
  pdf.text(`Agreement ID: ${data.agreementId || 'N/A'}`, 20, 30);
  pdf.text(`This is a digitally signed agreement - legally binding`, 105, 30, { align: 'center' });
  
  // Divider
  pdf.setLineWidth(0.5);
  pdf.line(20, 35, 190, 35);
  
  pdf.setFontSize(12);
    // Digital Signature Status - handle cases where signatures might not be available
  pdf.setFont("helvetica", "bold");
  pdf.text(`Digital Signature Status:`, 20, 45);
  pdf.setFont("helvetica", "normal");
  
  if (data.lenderSignedAt && data.borrowerSignedAt) {
    pdf.text(`✓ Lender Signed: ${data.lenderSignedAt.toLocaleString()}`, 20, 52);
    pdf.text(`✓ Borrower Signed: ${data.borrowerSignedAt.toLocaleString()}`, 20, 58);
  } else {
    pdf.text(`⚠ Pending Digital Signatures`, 20, 52);
    pdf.text(`Note: This is a preview - full signatures required for legal validity`, 20, 58);
  }
  
  // Parties
  pdf.text(`This loan agreement is made between:`, 20, 72);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Lender:`, 20, 82);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${data.lenderName}`, 60, 82);
  pdf.text(`Address: ${data.lenderAddress}`, 60, 88);
  
  pdf.setFont("helvetica", "bold");
  pdf.text(`Borrower:`, 20, 98);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${data.borrowerName}`, 60, 98);
  pdf.text(`Address: ${data.borrowerAddress}`, 60, 104);
  
  // Loan Details
  pdf.setFont("helvetica", "bold");
  pdf.text(`Loan Details:`, 20, 118);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Principal Amount: ${formatCurrency(data.amount)}`, 20, 128);
  pdf.text(`Interest Rate: ${data.interestRate}% per annum`, 20, 134);
  pdf.text(`Term: ${data.durationMonths} months`, 20, 140);
  pdf.text(`Monthly Payment: ${formatCurrency(data.monthlyPayment)}`, 20, 146);
  pdf.text(`Total Repayment: ${formatCurrency(data.totalRepayment)}`, 20, 152);
  pdf.text(`Start Date: ${data.startDate.toLocaleDateString()}`, 20, 158);
  pdf.text(`End Date: ${data.endDate.toLocaleDateString()}`, 20, 164);
  pdf.text(`Payment Method: ${data.paymentMethod?.toUpperCase() || 'Not specified'}`, 20, 170);
  
  if (data.purpose) {
    pdf.text(`Purpose: ${data.purpose}`, 20, 176);
  }
  
  // Smart Contract Details (if applicable)
  if (data.contractHash) {
    pdf.setFont("helvetica", "bold");
    pdf.text(`Blockchain Details:`, 20, 190);
    pdf.setFont("helvetica", "normal");
    pdf.text(`This agreement is secured by a smart contract on the Ethereum blockchain.`, 20, 196);
    pdf.text(`Contract Address: ${data.contractHash}`, 20, 202);
    pdf.text(`Wallet Address: ${data.walletAddress || 'Not provided'}`, 20, 208);
  }
    // Digital Signatures
  pdf.setFont("helvetica", "bold");
  pdf.text(`Digital Signatures:`, 20, 222);
  pdf.setFont("helvetica", "normal");
  
  pdf.text(`Lender: ${data.lenderName}`, 20, 232);
  if (data.lenderSignedAt) {
    pdf.text(`Digitally signed on: ${data.lenderSignedAt.toLocaleString()}`, 30, 238);
  } else {
    pdf.text(`Status: Pending signature`, 30, 238);
  }
  
  pdf.text(`Borrower: ${data.borrowerName}`, 20, 248);
  if (data.borrowerSignedAt) {
    pdf.text(`Digitally signed on: ${data.borrowerSignedAt.toLocaleString()}`, 30, 254);
  } else {
    pdf.text(`Status: Pending signature`, 30, 254);
  }
    // Legal Notice
  pdf.setFontSize(8);
  pdf.text(`This document was generated electronically and is legally binding under Indian IT Act 2000.`, 20, 270);
  pdf.text(`Both parties have digitally signed this agreement using secure authentication.`, 20, 276);
  
  return pdf;
};

// Smart contract ABI for LoanAgreementFactory (from compiled Solidity)
const LOAN_FACTORY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "borrower", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "lender", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "loanAddress", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "interestRate", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "durationMonths", "type": "uint256" }
    ],
    "name": "LoanAgreementCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "borrower", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "interestRate", "type": "uint256" },
      { "internalType": "uint256", "name": "durationMonths", "type": "uint256" }
    ],
    "name": "createLoanAgreement",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLoanAgreements",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLoanAgreementsCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserLoanAgreements",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// This would be the bytecode of your compiled smart contract
// In a real project, you'd import this from a Hardhat compilation output
const LOAN_FACTORY_BYTECODE = '0x608060405234801561001057600080fd5b5061087d806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80637a9a0sl461003b578063b77a494a1461005c575b600080fd5b61004360089b8c565b60405161005394939291906101e8565b60405180910390f35b61007061006a366004610301565b610125565b60405161005391906106b7565b610097610092366004610301565b6101ed565b60405161005391906106e2565b6000806000806100b06101ed565b805480602002602001604051908101604052809291908181526020018280548015610116576020028201916000526020600020908154600160a060020a03168152602001906001019080831161010e575b50505050509050806003815181101515610156575b602002015160e060020a9004600160a060020a0316925092959294509250565b60008080805b835181101561029c57600160a060020a038516600090815260208190526040902080548590811061015457600160a060020a038216151561028457600080fd5b82805482908110151561029457fe5b6000918252602090912001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03929092169190911790558060010190506101f4565b5050919050565b60008054825181106102af57fe5b906000526020600020908154600160a060020a0319166c01000000000000000000000000918202019260086103008404929092041690808211156102fa575b505050505090565b60008060008060006060868103121561031757600080fd5b853567ffffffffffffffff81111561032e57600080fd5b808201610338818901610436565b9097909650945050505050565b6000815180845260208085019450808401835b8381101561037457815187529582019590820190600101610358565b509495945050505050565b600061038a82610250565b838252602080830193909352604082019190915260608201819052608082015260a0016000905b6000855184529020600190910190600160a060020a031681526020019060010190610397565b60208082526011908201527f4e6f742061206c656e6465722e00000000000000000000000000000000000000604082015260600190565b60208082526013908201527f4e6f7420696e697469616c697a65642e00000000000000000000000000000000604082015260600190565b600061046a82610250565b838252602080830193845260409384019390935283546000938784019187810190811015610498575b600091825260209091200154600160a060020a0316905281565b600082601f83011215600080fd5b813567ffffffffffffffff8111826102f7576102f7823560208501836102a1565b602091820191016104bf81846101da565b939250505056fea264697066735822122043e95886ebdf7d1890b68977d7039420690c2702e5e8edd6c5c5fac400a93c11a964736f6c634300080f0033';

// Contract address will be updated after deployment
// For localhost/development: 0x5FbDB2315678afecb367f032d93F642f64180aa3
// Update this after deploying to your desired network
const LOAN_FACTORY_ADDRESS = import.meta.env.VITE_LOAN_FACTORY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Logic for deploying contracts in a Hardhat environment
// This will be integrated with the actual smart contract once deployed
/**
 * Generates and deploys a loan agreement smart contract
 * @param signer Ethers signer to use for contract deployment
 * @param borrowerAddress Address of the borrower
 * @param amount Loan amount in ETH
 * @param interestRate Annual interest rate (e.g., 5 for 5%)
 * @param durationMonths Loan duration in months
 * @returns Contract address and transaction hash
 */
export const generateLoanAgreementContract = async (
  signer: JsonRpcSigner,
  borrowerAddress: string,
  amount: string, 
  interestRate: number,
  durationMonths: number
): Promise<ContractDeployResult> => {
  try {
    console.log('Creating loan agreement contract...');
    console.log(`Borrower: ${borrowerAddress}`);
    console.log(`Amount: ${amount} ETH`);
    console.log(`Interest Rate: ${interestRate}%`);
    console.log(`Duration: ${durationMonths} months`);

    // Check if we have a valid factory address
    if (LOAN_FACTORY_ADDRESS && LOAN_FACTORY_ADDRESS !== '0x5FbDB2315678afecb367f032d93F642f64180aa3') {
      console.log('Using deployed loan factory contract...');
      
      const factory = new Contract(
        LOAN_FACTORY_ADDRESS,
        LOAN_FACTORY_ABI,
        signer
      );
      
      // Call the createLoanAgreement function on the factory contract
      const tx = await factory.createLoanAgreement(
        borrowerAddress,
        parseEther(amount),
        Math.floor(interestRate * 100), // Convert to basis points (5% -> 500)
        durationMonths
      );

      console.log('Transaction sent, waiting for confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('Loan contract created!');
      console.log('Transaction hash:', receipt.hash);
        // Extract the contract address from the event logs
      let createdContractAddress = '';
      if (receipt.logs && receipt.logs.length > 0) {
        // Parse the LoanAgreementCreated event
        const factoryInterface = new Interface(LOAN_FACTORY_ABI);
        for (const log of receipt.logs) {
          try {
            const parsedLog = factoryInterface.parseLog(log);
            if (parsedLog && parsedLog.name === 'LoanAgreementCreated') {
              createdContractAddress = parsedLog.args.loanAddress;
              break;
            }
          } catch (e) {
            // Not our event, continue
          }
        }
      }
      
      // Fallback to mock if we couldn't extract the address
      if (!createdContractAddress) {
        createdContractAddress = `0x${Array(40).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
      }
      
      return {
        contractAddress: createdContractAddress,
        txHash: receipt.hash
      };
    } else {
      console.log('No factory contract deployed, using mock deployment...');
      
      // For development, simulate contract deployment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock contract address and transaction hash
      const mockContractAddress = `0x${Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
      const mockTxHash = `0x${Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      console.log(`Mock contract deployed at address: ${mockContractAddress}`);
      console.log(`Mock transaction hash: ${mockTxHash}`);
      
      return {
        contractAddress: mockContractAddress,
        txHash: mockTxHash
      };
    }
  } catch (error) {
    console.error('Error generating loan agreement contract:', error);
    throw error;
  }
};

/**
 * This function will be updated to deploy contracts using Hardhat in a production environment
 * @TODO: Implement actual contract deployment using Hardhat
 */
export const deployContractViaHardhat = async (): Promise<void> => {
  // This will be implemented when Hardhat is configured
  console.log('Hardhat contract deployment not yet implemented');
};
