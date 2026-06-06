import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../../users/user.entity';

/**
 * Handles outbound email delivery using the configured mailer transport.
 * Provides methods for sending transactional emails such as welcome messages.
 */
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a welcome email to a newly registered user using the EJS template.
   *
   * @param user - The newly created {@link User} entity whose email and name are used.
   * @returns Resolves when the email has been handed off to the mail transport.
   * @throws Error if the mailer transport fails to deliver the message.
   */
  public async sendWelcomeEmail(user: User): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: './welcome', // Name of the EJS template file (without extension)
      text: `Hello ${`${user.firstName} ${user.lastName || ''}`.trim()}, welcome to our platform!`,
      context: {
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        // verificationLink: `https://example.com/verify?token=${verificationToken}`,
      },
    });
  }
}
