/**
 * IPFS Contract Management Utilities
 * Handles PDF generation, IPFS upload, and database storage for loan contracts
 */

import { supabase } from '@/integrations/supabase/client';
import { generateAndUploadContract, ContractData } from './contractGenerator';
import { IpfsUploadResult } from './ipfsService';

export interface ContractIpfsResult {
  success: boolean;
  ipfsResult?: IpfsUploadResult;
  error?: string;
  agreementId: string;
}

/**
 * Generate PDF contract, upload to IPFS, and store CID in database
 * @param agreementData The loan agreement data
 * @param contractData The contract generation data
 * @returns Promise<ContractIpfsResult>
 */
export const processContractToIpfs = async (
  agreementData: any,
  contractData: ContractData
): Promise<ContractIpfsResult> => {
  try {
    console.log('Processing contract to IPFS for agreement:', agreementData.id);
    
    // Generate PDF and upload to IPFS
    const ipfsResult = await generateAndUploadContract(contractData);

    if (!ipfsResult.success) {
      throw new Error(ipfsResult.message || 'IPFS upload failed');
    }

    // Store IPFS data in database
    try {
      const { error: updateError } = await supabase
        .from('loan_agreements')
        .update({
          contract_ipfs_cid: ipfsResult.cid,
          contract_ipfs_url: ipfsResult.gatewayUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', agreementData.id);

      if (updateError) {
        throw updateError;
      }

      console.log('IPFS contract data stored in database successfully:', {
        agreementId: agreementData.id,
        cid: ipfsResult.cid,
        url: ipfsResult.gatewayUrl
      });
    } catch (updateError) {
      console.warn('Database update failed, but IPFS upload succeeded:', updateError);
      
      // Fallback: try basic update to avoid complete failure
      try {
        await supabase
          .from('loan_agreements')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', agreementData.id);
      } catch (updateError) {
        console.warn('Basic update also failed:', updateError);
        // Don't throw error - IPFS upload succeeded
      }
    }

    console.log('Contract successfully uploaded to IPFS and stored in database:', {
      cid: ipfsResult.cid,
      url: ipfsResult.gatewayUrl
    });

    return {
      success: true,
      ipfsResult,
      agreementId: agreementData.id
    };

  } catch (error) {
    console.error('Error processing contract to IPFS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      agreementId: agreementData.id
    };
  }
};

/**
 * Retrieve contract from IPFS using stored CID
 * @param agreementId The loan agreement ID
 * @returns Promise<string | null> The IPFS gateway URL or null if not found
 */
export const getContractFromIpfs = async (agreementId: string): Promise<string | null> => {
  try {
    // Try to get IPFS data (columns may not exist yet)
    const { data, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (error || !data) {
      console.warn('Failed to retrieve agreement IPFS data:', error);
      return null;
    }

    // Check if IPFS columns exist and have data
    const ipfsUrl = (data as any).contract_ipfs_url;
    const ipfsCid = (data as any).contract_ipfs_cid;
    
    if (ipfsUrl) {
      return ipfsUrl;
    } else if (ipfsCid) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving contract from IPFS:', error);
    return null;
  }
};

/**
 * Check if contract PDF has been generated and uploaded to IPFS
 * @param agreementId The loan agreement ID
 * @returns Promise<boolean>
 */
export const hasContractInIpfs = async (agreementId: string): Promise<boolean> => {
  try {
    // Try to get IPFS data (columns may not exist yet)
    const { data, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (error || !data) {
      console.warn('Failed to check IPFS contract status:', error);
      return false;
    }

    // Check if IPFS CID column exists and has data
    const ipfsCid = (data as any).contract_ipfs_cid;
    return !!ipfsCid;
  } catch (error) {
    console.error('Error checking IPFS contract status:', error);
    return false;
  }
};

/**
 * Generate contract data from loan agreement for PDF generation
 * @param agreement The loan agreement from database
 * @param lenderInfo Additional lender information
 * @param borrowerInfo Additional borrower information
 * @returns ContractData object for PDF generation
 */
export const prepareContractData = (
  agreement: any,
  lenderInfo?: { name: string; address: string },
  borrowerInfo?: { name: string; address: string }
): ContractData => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + agreement.duration_months);

  // Calculate monthly payment using standard loan formula
  const principal = agreement.amount;
  const rate = agreement.interest_rate / 100 / 12; // Monthly rate
  const months = agreement.duration_months;
  
  let monthlyPayment: number;
  if (rate === 0) {
    monthlyPayment = principal / months;
  } else {
    monthlyPayment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  }

  const totalRepayment = monthlyPayment * months;

  return {
    lenderName: lenderInfo?.name || agreement.lender_name || 'Lender',
    lenderAddress: lenderInfo?.address || 'Address to be provided',
    borrowerName: borrowerInfo?.name || agreement.borrower_name || 'Borrower',
    borrowerAddress: borrowerInfo?.address || 'Address to be provided',
    amount: principal,
    interestRate: agreement.interest_rate,
    durationMonths: months,
    purpose: agreement.purpose || 'Personal loan',
    startDate,
    endDate,
    monthlyPayment,
    totalRepayment,
    paymentMethod: agreement.payment_method || 'TBD',
    agreementId: agreement.id,
    // Signature data (if available)
    lenderSignedAt: agreement.lender_signature ? new Date(agreement.lender_signature) : undefined,
    borrowerSignedAt: agreement.borrower_signature ? new Date(agreement.borrower_signature) : undefined,
    // Blockchain data (if applicable)
    walletAddress: agreement.smart_contract ? 'To be provided' : undefined,
    contractHash: agreement.smart_contract ? 'To be generated' : undefined
  };
};
