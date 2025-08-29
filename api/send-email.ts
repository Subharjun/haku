import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplateData {
  borrowerName: string;
  borrowerEmail: string;
  lenderName?: string;
  lenderEmail?: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate?: number;
  requestId: string;
  appUrl: string;
}

const templates = {
  loanRequestCreated: (data: EmailTemplateData) => ({
    subject: `🏦 New Loan Request: ${data.borrowerName} needs ₹${data.amount.toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LendIt - New Loan Request</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💸 New Loan Request on LendIt</h1>
              <p>Someone you know needs financial help</p>
            </div>
            <div class="content">
              <h2>Hello! 👋</h2>
              <p><strong>${data.borrowerName}</strong> has created a loan request and you might be able to help.</p>
              
              <div class="details">
                <h3>📋 Loan Details</h3>
                <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
                <p><strong>Purpose:</strong> ${data.purpose}</p>
                <p><strong>Duration:</strong> ${data.duration} months</p>
                ${data.interestRate ? `<p><strong>Interest Rate:</strong> ${data.interestRate}% per year</p>` : ''}
                <p><strong>Borrower:</strong> ${data.borrowerName} (${data.borrowerEmail})</p>
              </div>

              <p>If you're interested in helping out, click the button below to view the full request and make an offer:</p>
              
              <a href="${data.appUrl}?highlight=${data.requestId}" class="button">
                🔍 View Loan Request
              </a>

              <p><em>This is a trusted P2P lending platform where friends and family can help each other with financial needs. All agreements are transparent and can be backed by smart contracts.</em></p>
            </div>
            <div class="footer">
              <p>© 2025 LendIt - Peer-to-Peer Lending Platform</p>
              <p><a href="${data.appUrl}">Visit LendIt</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  loanRequestClaimed: (data: EmailTemplateData) => ({
    subject: `✅ Good News! ${data.lenderName} wants to lend you ₹${data.amount.toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LendIt - Loan Request Accepted</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .details { background: #f0fff4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #48bb78; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Loan Request was Accepted!</h1>
              <p>Someone wants to help you out</p>
            </div>
            <div class="content">
              <h2>Great news, ${data.borrowerName}! 🎊</h2>
              <p><strong>${data.lenderName}</strong> has accepted your loan request and wants to lend you the money.</p>
              
              <div class="details">
                <h3>📋 Loan Details</h3>
                <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
                <p><strong>Purpose:</strong> ${data.purpose}</p>
                <p><strong>Duration:</strong> ${data.duration} months</p>
                <p><strong>Lender:</strong> ${data.lenderName} (${data.lenderEmail})</p>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Review the final loan terms</li>
                <li>Both parties digitally sign the agreement</li>
                <li>Smart contract gets deployed automatically</li>
                <li>Receive your funds via your preferred payment method</li>
              </ol>
              
              <a href="${data.appUrl}/loan/${data.requestId}" class="button">
                📝 Review & Sign Agreement
              </a>

              <p><em>All transactions are secure and transparent. You can track everything in your dashboard.</em></p>
            </div>
            <div class="footer">
              <p>© 2025 LendIt - Peer-to-Peer Lending Platform</p>
              <p><a href="${data.appUrl}">Visit LendIt</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  contractReady: (data: EmailTemplateData) => ({
    subject: `🤝 Contract Ready: Loan Agreement between ${data.borrowerName} and ${data.lenderName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LendIt - Contract Deployed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ed8936; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .details { background: #fffaf0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ed8936; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Smart Contract Deployed!</h1>
              <p>Your loan agreement is now live on the blockchain</p>
            </div>
            <div class="content">
              <h2>Congratulations! 🎉</h2>
              <p>Both parties have signed the agreement, and your smart contract has been successfully deployed.</p>
              
              <div class="details">
                <h3>📋 Final Agreement Details</h3>
                <p><strong>Borrower:</strong> ${data.borrowerName}</p>
                <p><strong>Lender:</strong> ${data.lenderName}</p>
                <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
                <p><strong>Duration:</strong> ${data.duration} months</p>
                <p><strong>Purpose:</strong> ${data.purpose}</p>
              </div>

              <p><strong>What happens next:</strong></p>
              <ul>
                <li><strong>Borrower:</strong> Funds will be transferred to your account within 24 hours</li>
                <li><strong>Lender:</strong> You can track repayments in your dashboard</li>
                <li><strong>Both:</strong> Download your PDF contract and view transaction history</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${data.appUrl}/loan/${data.requestId}" class="button">
                  📊 View Dashboard
                </a>
                <a href="${data.appUrl}/loan/${data.requestId}/contract" class="button">
                  📄 Download PDF
                </a>
              </div>

              <p><em>This contract is secured by blockchain technology and ensures transparency for both parties.</em></p>
            </div>
            <div class="footer">
              <p>© 2025 LendIt - Peer-to-Peer Lending Platform</p>
              <p><a href="${data.appUrl}">Visit LendIt</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, data }: { 
      type: 'loanRequestCreated' | 'loanRequestClaimed' | 'contractReady',
      to: string | string[],
      data: EmailTemplateData 
    } = req.body;

    if (!type || !to || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, to, data' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const template = templates[type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid email template type' });
    }

    const { subject, html } = template(data);
    const fromEmail = process.env.VITE_FROM_EMAIL || 'noreply@lendit.app';

    // Convert single email to array for consistency
    const recipients = Array.isArray(to) ? to : [to];

    // Send emails to all recipients
    const emailPromises = recipients.map(email => 
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures);
      return res.status(207).json({ 
        message: 'Some emails failed to send',
        failures: failures.length,
        total: results.length
      });
    }

    return res.status(200).json({ 
      message: 'Emails sent successfully',
      count: results.length,
      type
    });

  } catch (error) {
    console.error('Email API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
