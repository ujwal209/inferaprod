import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string, type: 'signup' | 'recovery') {
  const title = type === 'signup' ? 'Core Deployment Initialized' : 'Security Override Initiated';
  const subtitle = type === 'signup' ? 'Activate your engineering profile' : 'Recalibrate your access credentials';
  const status = type === 'signup' ? 'AWAITING_ACTIVATION' : 'AWAITING_OVERRIDE';

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
      <tr>
        <td align="center">
          <div style="border: 4px solid #000000; padding: 40px; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 12px 12px 0px 0px #facc15; text-align: left;">
            <h1 style="text-transform: uppercase; font-size: 32px; letter-spacing: -1.5px; font-weight: 900; margin: 0 0 20px 0; color: #000000;">
              ${title.split(' ')[0]} <span style="font-style: italic; color: #000000;">${title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p style="font-weight: 800; text-transform: uppercase; color: #64748b; font-size: 11px; letter-spacing: 2px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px;">
              Target Node: <span style="color: #0f172a;">${email}</span>
            </p>
            <p style="line-height: 1.6; font-weight: 500; font-size: 16px; margin-bottom: 32px; color: #334155;">
              ${subtitle} for the <strong style="color: #000000; font-weight: 900;">INFRACORE</strong> network. Enter the 6-digit authorization code below to verify your identity.
            </p>
            
            <div style="background-color: #000000; color: #facc15; padding: 32px; text-align: center; font-size: 48px; font-weight: 900; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; border: 4px solid #e2e8f0; margin: 40px 0;">
              ${otp}
            </div>
            
            <p style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 40px;">
              This code will expire in 15 minutes. Do not share this code with anyone.
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #cbd5e1;">
              <p style="font-size: 11px; color: #94a3b8; font-family: monospace; line-height: 1.6; margin: 0;">
                <strong style="color: #64748b;">STATUS:</strong> <span style="color: #d97706; font-weight: bold;">${status}</span><br>
                <strong style="color: #64748b;">ENCRYPTION:</strong> END_TO_END_ACTIVE
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Infracore Core Command" <${process.env.SMTP_USER}>`,
    to: email,
    subject: type === 'signup' ? 'Verify Your Infracore Node' : 'Infracore Security Override',
    html: htmlTemplate,
  });
}