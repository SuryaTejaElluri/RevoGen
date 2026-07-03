import { Injectable } from '@nestjs/common';
import axios from "axios";

@Injectable()
export class MailService {

  private async sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  return axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: 'RevoGen AI',
        email: 'surya07e@gmail.com',
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
    },
  );
}
  

 async sendTestEmail(email: string) {
  try {
    const info = await this.sendEmail(
      email,
      "✅ RevoGen AI Email Test",
      `
      <h2>RevoGen AI</h2>

      <p>Your email service is configured successfully.</p>

      <hr/>

      <p>If you received this email, Brevo API is working correctly.</p>
      `,
    );

    console.log("✅ Test email sent");

    return info.data;

  } catch (err) {
    console.error("❌ Test email failed");
    console.error(err);

    throw err;
  }
}

async sendCodingTestInvitation(
  email: string,
  candidateName: string | null,
  testTitle: string,
  securityLevel: string,
  duration: number,
  invitationUrl: string,
) {
  try {
    console.log("📧 Sending coding invitation to:", email);

    const info = await this.sendEmail(
  email,
  `You're Invited to "${testTitle}" | RevoGen AI`,
  `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:30px">

        <h1 style="color:#2563eb">RevoGen AI</h1>

        <p>Hello ${candidateName ?? "Candidate"},</p>

        <p>
          You have been invited to participate in an online coding assessment.
        </p>

        <table style="border-collapse:collapse;width:100%;margin:20px 0">
          <tr>
            <td><b>Assessment</b></td>
            <td>${testTitle}</td>
          </tr>

          <tr>
            <td><b>Security</b></td>
            <td>${securityLevel}</td>
          </tr>

          <tr>
            <td><b>Duration</b></td>
            <td>${duration} minutes</td>
          </tr>
        </table>

        <a
          href="${invitationUrl}"
          style="
            display:inline-block;
            background:#2563eb;
            color:white;
            text-decoration:none;
            padding:14px 28px;
            border-radius:8px;
            font-weight:bold;">
          Start Assessment
        </a>

        <br><br>

        <small>If the button doesn't work, copy this link:</small>

        <br><br>

        ${invitationUrl}

        <hr>

        <p style="color:#666">
          Good luck!<br/>
          Team RevoGen AI
        </p>

      </div>
  `,
);

    console.log("✅ Invitation email sent.");
    console.log(info);

    return info;

  } catch (err) {
    console.error("❌ Invitation email failed");
    console.error(err);
    throw err;
  }
}


async sendResetPasswordEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  try {
    console.log('📧 Sending password reset email to:', email);

    const info = await this.sendEmail(
      email,
      'Reset Your RevoGen Password',
      `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:30px">

        <h1 style="color:#2563eb">RevoGen AI</h1>

        <p>Hello <b>${name}</b>,</p>

        <p>
          We received a request to reset your RevoGen password.
          Click the button below to choose a new password.
        </p>

        <br>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            background:#2563eb;
            color:white;
            text-decoration:none;
            padding:14px 28px;
            border-radius:8px;
            font-weight:bold;
          ">
          Reset Password
        </a>

        <br><br>

        <small>
          This link is valid for <b>30 minutes</b>.
          If you did not request a password reset, you can safely ignore this email.
        </small>

        <br><br>

        If the button doesn't work, copy this link:

        <br><br>

        ${resetUrl}

        <hr>

        <p style="color:#666">
          Team RevoGen AI
        </p>

      </div>
      `,
    );

    console.log('✅ Password reset email sent');
    return info.data;
  } catch (err) {
    console.error('❌ Password reset email failed');
    console.error(err);
    throw err;
  }
}

async sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string,
) {
  try {
    console.log("📧 Sending verification email to:", email);

    const info = await this.sendEmail(
      email,
      "Verify Your RevoGen Account",
      `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:30px">

        <h1 style="color:#2563eb">
          Welcome to RevoGen AI
        </h1>

        <p>Hello <b>${name}</b>,</p>

        <p>
          Thank you for registering with RevoGen AI.
        </p>

        <p>
          Please verify your email address to activate your account.
        </p>

        <br>

        <a
          href="${verificationUrl}"
          style="
            display:inline-block;
            background:#2563eb;
            color:white;
            text-decoration:none;
            padding:14px 28px;
            border-radius:8px;
            font-weight:bold;
          ">
          Verify Email
        </a>

        <br><br>

        <small>
          This verification link is valid for 24 hours.
        </small>

        <br><br>

        If the button doesn't work, copy this link:

        <br><br>

        ${verificationUrl}

        <hr>

        <p style="color:#666">
          Team RevoGen AI
        </p>

      </div>
      `,
    );

    console.log("✅ Verification email sent");

    return info.data;

  } catch (err) {
    console.error("❌ Verification email failed");
    console.error(err);

    throw err;
  }
}
}


