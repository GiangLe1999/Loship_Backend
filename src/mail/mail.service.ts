import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfirmationEmailVars } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail({ username, code }: ConfirmationEmailVars) {
    await this.mailerService.sendMail({
      to: username,
      from: '"Uber Eats Support Team" <support@ubers.eats.com>', // override default from
      subject: 'Welcome to Uber Eats! Confirm your Email',
      template: './confirmation-mail.templates.hbs',
      context: { username, code },
    });
  }
}
