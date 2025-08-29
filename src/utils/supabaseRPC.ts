/**
 * Supabase RPC function interfaces and utilities for loan workflow
 */

import { supabase } from '@/integrations/supabase/client';

export interface RequestLoanParams {
  borrowerName: string;
  borrowerEmail: string;
  amount: number;
  purpose: string;
  durationMonths: number;
  interestRate?: number;
  description?: string;
}

export interface ClaimRequestParams {
  requestId: string;
  lenderName: string;
  lenderEmail: string;
}

export interface FinalizeTermsParams {
  requestId: string;
  signatureData?: string;
}

export interface RPCResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface RequestLoanResponse extends RPCResponse {
  request_id?: string;
}

export interface ClaimRequestResponse extends RPCResponse {
  request_id?: string;
  borrower_name?: string;
  borrower_email?: string;
  amount?: number;
  purpose?: string;
  duration?: number;
}

export interface FinalizeTermsResponse extends RPCResponse {
  request_id?: string;
  status?: string;
  both_signed?: boolean;
  borrower_name?: string;
  borrower_email?: string;
  lender_name?: string;
  lender_email?: string;
  amount?: number;
  purpose?: string;
  duration?: number;
}

/**
 * Create a new loan request using Supabase RPC
 */
export async function requestLoan(params: RequestLoanParams): Promise<RequestLoanResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        message: 'Please log in to create a loan request'
      };
    }

    const { data, error } = await (supabase as any).rpc('request_loan', {
      p_borrower_id: user.id,
      p_borrower_name: params.borrowerName,
      p_borrower_email: params.borrowerEmail,
      p_amount: params.amount,
      p_purpose: params.purpose,
      p_duration_months: params.durationMonths,
      p_interest_rate: params.interestRate || 0,
      p_description: params.description || null
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create loan request'
      };
    }

    return data as RequestLoanResponse;

  } catch (error) {
    console.error('Request loan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create loan request'
    };
  }
}

/**
 * Claim a loan request using Supabase RPC
 */
export async function claimRequest(params: ClaimRequestParams): Promise<ClaimRequestResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        message: 'Please log in to claim a loan request'
      };
    }

    const { data, error } = await (supabase as any).rpc('claim_request', {
      p_request_id: params.requestId,
      p_lender_id: user.id,
      p_lender_name: params.lenderName,
      p_lender_email: params.lenderEmail
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to claim loan request'
      };
    }

    return data as ClaimRequestResponse;

  } catch (error) {
    console.error('Claim request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to claim loan request'
    };
  }
}

/**
 * Finalize loan terms (digital signature)
 */
export async function finalizeLoanTerms(params: FinalizeTermsParams): Promise<FinalizeTermsResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        message: 'Please log in to sign the agreement'
      };
    }

    const { data, error } = await (supabase as any).rpc('finalize_loan_terms', {
      p_request_id: params.requestId,
      p_user_id: user.id,
      p_signature_data: params.signatureData || null
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to finalize loan terms'
      };
    }

    return data as FinalizeTermsResponse;

  } catch (error) {
    console.error('Finalize terms error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to finalize loan terms'
    };
  }
}

/**
 * Get loan agreements for the current user (as borrower or lender)
 */
export async function getUserLoanAgreements() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Get user loan agreements error:', error);
    throw error;
  }
}

/**
 * Get available loan requests (for browsing)
 */
export async function getAvailableLoanRequests() {
  try {
    const { data, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .eq('status', 'pending')
      .is('lender_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Get available loan requests error:', error);
    throw error;
  }
}

/**
 * Get a specific loan agreement by ID
 */
export async function getLoanAgreement(id: string) {
  try {
    const { data, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Get loan agreement error:', error);
    throw error;
  }
}
