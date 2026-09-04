import { config } from '../config/env.js';

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  // If no Resend API key is configured yet, just log the code to the
  // backend terminal so you can still test the flow locally without
  // paying for / setting up an email provider.
  if (!config.resendApiKey) {
    console.log(`\n[DEV EMAIL] Verification code for ${to}: ${code}\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Fundedapple <onboarding@resend.dev>',
      to: [to],
      subject: 'Your Fundedapple verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Use this code to finish creating your Fundedapple account:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend email failed:', errorText);
    throw new Error('Failed to send verification email');
  }
}
