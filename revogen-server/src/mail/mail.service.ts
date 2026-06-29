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
    return this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: '✅ RevoGen AI Email Test',
      html: `
        <h2>RevoGen AI</h2>
        <p>Your email service is configured successfully.</p>
        <hr/>
        <p>If you received this email, Brevo + Nodemailer is working correctly.</p>
      `,
    });
  }
}