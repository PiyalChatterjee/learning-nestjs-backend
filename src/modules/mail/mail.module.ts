import { Global, Module } from '@nestjs/common';
import { MailService } from './providers/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('appConfig.mail.host'),
          secure: false, // Set to true if using SSL/TLS
          port: configService.get<number>('appConfig.mail.port'),
          auth: {
            user: configService.get<string>('appConfig.mail.username'),
            pass: configService.get<string>('appConfig.mail.password'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('appConfig.mail.username')}@example.com>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new EjsAdapter({
            inlineCssEnabled: true, // Enable inline CSS for better email client compatibility
            // You can add more EJS options here if needed
          }),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
