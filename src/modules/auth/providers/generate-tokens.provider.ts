import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/user.entity';
import { IActiveUser } from '../interfaces/active-user.interface';

@Injectable()
export class GenerateTokensProvider {
  constructor(
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  public async signTokens<T>(
    userId: number,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.configService.get<string>('appConfig.jwt.secret'),
        expiresIn: expiresIn,
        audience: this.configService.get<string>(
          'appConfig.jwt.signOptions.audience',
        ),
        issuer: this.configService.get<string>(
          'appConfig.jwt.signOptions.issuer',
        ),
      },
    );
  }

  public async generateTokens(
    user: User,
  ): Promise<{ email: string; accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signTokens<Partial<IActiveUser>>(
        user.id,
        this.configService.get<number>('appConfig.jwt.signOptions.expiresIn'),
        { email: user.email },
      ),

      this.signTokens(
        user.id,
        this.configService.get<number>('appConfig.jwt.refreshTokenTtl'),
      ),
    ]);
    return {
      email: user.email,
      accessToken,
      refreshToken,
    };
  }
}
