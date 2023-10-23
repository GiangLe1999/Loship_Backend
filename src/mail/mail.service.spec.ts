import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationMail', () => {
    it('should send email', async () => {
      const sendVerificationEmailArgs = {
        username: 'email',
        code: 'code',
      };

      await service.sendVerificationEmail(sendVerificationEmailArgs);

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: sendVerificationEmailArgs.username,
        from: expect.any(String),
        subject: expect.any(String),
        template: expect.any(String),
        context: {
          username: sendVerificationEmailArgs.username,
          code: sendVerificationEmailArgs.code,
        },
      });
    });
  });
});
