/**
 * Crypto Payment Processor
 * Handles cryptocurrency payments (ETH, BTC, USDT)
 */

import { ethers } from 'ethers';
import { PaymentDetails, PaymentResult } from './paymentProcessing';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoPaymentDetails extends PaymentDetails {
  cryptocurrency: 'ETH' | 'BTC' | 'USDT';
  recipientAddress: string;
  networkId?: string;
}

export interface CryptoTransactionData {
  hash: string;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  confirmations?: number;
}

/**
 * Get current cryptocurrency prices
 */
export const getCryptoPrices = async (): Promise<{ [key: string]: number }> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether&vs_currencies=usd,inr'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    return {
      ETH: data.ethereum.inr,
      BTC: data.bitcoin.inr,
      USDT: data.tether.inr,
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    // Fallback prices
    return {
      ETH: 250000, // Approximate INR value
      BTC: 3500000,
      USDT: 84,
    };
  }
};

/**
 * Convert INR amount to cryptocurrency
 */
export const convertToCrypto = async (
  inrAmount: number,
  cryptocurrency: string
): Promise<number> => {
  try {
    const prices = await getCryptoPrices();
    const cryptoPrice = prices[cryptocurrency];
    
    if (!cryptoPrice) {
      throw new Error(`Price not found for ${cryptocurrency}`);
    }
    
    return inrAmount / cryptoPrice;
  } catch (error) {
    console.error('Error converting to crypto:', error);
    throw error;
  }
};

/**
 * Process Ethereum payment
 */
export const processEthereumPayment = async (
  details: CryptoPaymentDetails
): Promise<PaymentResult> => {
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to make crypto payments.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Convert INR amount to ETH
    const ethAmount = await convertToCrypto(details.amount, 'ETH');
    const amountInWei = ethers.parseEther(ethAmount.toString());

    // Create transaction
    const transaction = {
      to: details.recipientAddress,
      value: amountInWei,
      gasLimit: 21000,
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(transaction);
    
    // Create transaction record
    const { data: dbTransaction, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'crypto',
        payment_reference: txResponse.hash,
        status: 'pending',
        metadata: {
          cryptocurrency: 'ETH',
          crypto_amount: ethAmount,
          recipient_address: details.recipientAddress,
          tx_hash: txResponse.hash,
        },
      })
      .select()
      .single();

    if (error) throw error;    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (receipt && receipt.status === 1) {
      // Update transaction status
      await supabase
        .from('transactions')        .update({
          status: 'completed',
          metadata: {
            cryptocurrency: 'ETH',
            crypto_amount: ethAmount,
            recipient_address: details.recipientAddress,
            tx_hash: txResponse.hash,
            block_number: receipt.blockNumber,
            gas_used: receipt.gasUsed.toString(),
            confirmations: receipt.confirmations,
          },
        })
        .eq('id', dbTransaction.id);

      return {
        success: true,
        transactionId: dbTransaction.id,
        referenceId: txResponse.hash,
        message: `Ethereum payment of ${ethAmount.toFixed(6)} ETH completed successfully`,
        metadata: {
          txHash: txResponse.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          ethAmount,
        },
      };
    } else {
      throw new Error('Transaction failed on blockchain');
    }
  } catch (error) {
    console.error('Ethereum payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Ethereum payment processing failed',
    };
  }
};

/**
 * Process USDT payment (ERC-20 token)
 */
export const processUsdtPayment = async (
  details: CryptoPaymentDetails,
  usdtContractAddress: string = '0xdAC17F958D2ee523a2206206994597C13D831ec7' // Mainnet USDT
): Promise<PaymentResult> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to make crypto payments.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // USDT contract ABI (simplified)
    const usdtAbi = [
      'function transfer(address to, uint256 value) returns (bool)',
      'function decimals() view returns (uint8)',
      'function balanceOf(address account) view returns (uint256)',
    ];
    
    const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, signer);
    
    // Convert INR amount to USDT
    const usdtAmount = await convertToCrypto(details.amount, 'USDT');
    const decimals = await usdtContract.decimals();
    const amountInTokenUnits = ethers.parseUnits(usdtAmount.toString(), decimals);
    
    // Send USDT transfer
    const txResponse = await usdtContract.transfer(
      details.recipientAddress,
      amountInTokenUnits
    );
    
    // Create transaction record
    const { data: dbTransaction, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'crypto',
        payment_reference: txResponse.hash,
        status: 'pending',
        metadata: {
          cryptocurrency: 'USDT',
          crypto_amount: usdtAmount,
          recipient_address: details.recipientAddress,
          tx_hash: txResponse.hash,
          contract_address: usdtContractAddress,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Wait for confirmation
    const receipt = await txResponse.wait();
      if (receipt && receipt.status === 1) {
      // Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          metadata: {
            cryptocurrency: 'USDT',
            crypto_amount: usdtAmount,
            recipient_address: details.recipientAddress,
            tx_hash: txResponse.hash,
            contract_address: usdtContractAddress,
            block_number: receipt.blockNumber,
            gas_used: receipt.gasUsed.toString(),
            confirmations: receipt.confirmations,
          },
        })
        .eq('id', dbTransaction.id);

      return {
        success: true,
        transactionId: dbTransaction.id,
        referenceId: txResponse.hash,
        message: `USDT payment of ${usdtAmount.toFixed(2)} USDT completed successfully`,
        metadata: {
          txHash: txResponse.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          usdtAmount,
        },
      };
    } else {
      throw new Error('USDT transaction failed on blockchain');
    }
  } catch (error) {
    console.error('USDT payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'USDT payment processing failed',
    };
  }
};

/**
 * Get transaction status from blockchain
 */
export const getCryptoTransactionStatus = async (
  txHash: string,
  cryptocurrency: string
): Promise<CryptoTransactionData | null> => {
  try {
    if (cryptocurrency === 'ETH' || cryptocurrency === 'USDT') {
      if (!window.ethereum) return null;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        return {
          hash: txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          confirmations: await provider.getBlockNumber() - receipt.blockNumber,
        };
      }
    }
    
    // For BTC, you would use a Bitcoin API service
    // This is a placeholder for BTC transaction checking
    
    return null;
  } catch (error) {
    console.error('Error getting crypto transaction status:', error);
    return null;
  }
};
