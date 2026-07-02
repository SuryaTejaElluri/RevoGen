import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

 async sendTestEmail(email: string) {
  try {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "✅ RevoGen AI Email Test",
      html: `
        <h2>RevoGen AI</h2>
        <p>Your email service is configured successfully.</p>
        <hr/>
        <p>If you received this email, Brevo + Nodemailer is working correctly.</p>
      `,
    });

    console.log(info);

    return info;
  } catch (err) {
    console.error("MAIL ERROR:", err);
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

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `You're Invited to "${testTitle}" | RevoGen AI`,
      html: `
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
    });

    console.log("✅ Invitation email sent.");
    console.log(info);

    return info;

  } catch (err) {
    console.error("❌ Invitation email failed");
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

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Verify Your RevoGen Account",
      html: `
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
    });

    console.log("✅ Verification email sent");

    return info;
  } catch (err) {
    console.error("❌ Verification email failed");
    console.error(err);
    throw err;
  }
}


}