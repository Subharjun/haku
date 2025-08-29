
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { generateLoanAgreementContract } from '@/utils/contractGenerator';

// Infura configuration
const INFURA_API_KEY = import.meta.env.VITE_INFURA_API_KEY || '888eafbec3984d1b9a18e559634ace1e';
const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  isConnected: boolean;
  balance: string;
  chainId: string | null;
  networkName: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createLoanContract: (loanDetails: LoanContractParams) => Promise<string>;
  loading: boolean;
  infuraProvider: JsonRpcProvider;
}

export interface LoanContractParams {
  borrowerAddress: string;
  amount: string;
  interestRate: number;
  durationMonths: number;
  purpose: string;
}

// ABI for the loan contract
const LOAN_CONTRACT_ABI = [
  "function initialize(address _borrower, address _lender, uint256 _amount, uint256 _interestRate, uint256 _durationMonths) external",
  "function getBorrower() external view returns (address)",
  "function getLender() external view returns (address)",
  "function getAmount() external view returns (uint256)",
  "function getInterestRate() external view returns (uint256)",
  "function getDuration() external view returns (uint256)",
  "function getStatus() external view returns (uint8)",
  "function makePayment() external payable",
  "function cancelLoan() external",
  "function completeLoan() external"
];

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = React.memo(({ children }: { children: ReactNode }) => {
  console.log('Web3Provider initializing...');
  
  const { toast } = useToast();
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>('Unknown Network');
  const [loading, setLoading] = useState(false);

  // Create Infura provider
  const infuraProvider = useMemo(() => new JsonRpcProvider(INFURA_ENDPOINT), []);

  const isConnected = useMemo(() => Boolean(provider && account), [provider, account]);
  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      if (provider instanceof BrowserProvider) {
        try {
          const balance = await provider.getBalance(accounts[0]);
          setBalance(formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    }
  }, [account, provider]); // Keep dependencies minimal

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: string) => {
    window.location.reload();
  }, []);
  // Effect to setup listeners for wallet events and check for existing connection
  useEffect(() => {
    let isSubscribed = true;
    
    const setupWallet = async () => {
      if (window.ethereum) {
        // Add event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
        // Check if already connected
        if (localStorage.getItem('walletConnected') === 'true') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0 && isSubscribed) {
              await connectWallet();
            }
          } catch (error) {
            console.error('Error checking existing connection:', error);
            localStorage.removeItem('walletConnected');
          }
        }
      }
      
      // Set default network name
      if (isSubscribed) {
        setNetworkName('Ethereum Mainnet');
      }
    };
    
    setupWallet();
    
    return () => {
      isSubscribed = false;
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []); // Remove dependencies to prevent circular calls
  const connectWallet = useCallback(async () => {
    if (loading) {
      console.log('Wallet connection already in progress...');
      return;
    }
    
    try {
      console.log('Attempting to connect wallet...');
      setLoading(true);
      
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      // Create ethers provider
      const browserProvider = new BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const ethersSigner = await browserProvider.getSigner();
      
      // Set connected account
      const connectedAccount = accounts[0];
      const accountBalance = await browserProvider.getBalance(connectedAccount);
      
      // Update state in batch to prevent multiple renders
      setProvider(browserProvider);
      setSigner(ethersSigner);
      setAccount(connectedAccount);
      setBalance(formatEther(accountBalance));
      setChainId(network.chainId.toString());
      setNetworkName(network.name);

      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${network.name}`,
      });
      
      return connectedAccount;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      localStorage.removeItem('walletConnected');
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect wallet',
        variant: "destructive",
      });
      throw new Error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, [toast, loading]); // Remove excessive dependencies
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet...');
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setNetworkName('Ethereum Mainnet'); // Keep default network name
    localStorage.removeItem('walletConnected');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  const createLoanContract = useCallback(async (loanDetails: LoanContractParams): Promise<string> => {
    try {
      setLoading(true);
      
      if (!signer || !account) {
        throw new Error('Wallet not connected');
      }
      
      // Generate contract bytecode using the utility
      const { contractAddress, txHash } = await generateLoanAgreementContract(
        signer,
        loanDetails.borrowerAddress,
        loanDetails.amount,
        loanDetails.interestRate,
        loanDetails.durationMonths
      );
      
      toast({
        title: "Loan Contract Created",
        description: `Contract deployed at ${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`,
      });
      
      return contractAddress;
    } catch (error: any) {
      console.error('Error creating loan contract:', error);
      toast({
        title: "Contract Creation Failed",
        description: error.message || 'Failed to create loan contract',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, toast]);

  const contextValue = useMemo(() => ({
    provider,
    signer,
    account,
    isConnected,
    balance,
    chainId,
    networkName,
    connectWallet,
    disconnectWallet,
    createLoanContract,
    loading,
    infuraProvider
  }), [provider, signer, account, isConnected, balance, chainId, networkName, connectWallet, disconnectWallet, createLoanContract, loading, infuraProvider]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
});

Web3Provider.displayName = 'Web3Provider';
