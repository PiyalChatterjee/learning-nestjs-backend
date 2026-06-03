import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Global JWT configuration for all modules using JWT authentication.
 * Centralizes JWT secret and sign options from the application config.
 * This configuration is used by the JwtModule in both AuthModule and UsersModule to ensure consistent JWT behavior across the application.
 * The useFactory function retrieves the JWT settings from the global appConfig and returns the necessary configuration for the JwtModule.
 * By defining this configuration in a separate file, we promote reusability and maintainability of JWT settings across different modules that require JWT functionality.
 * @see AuthModule
 * @see UsersModule
 */
export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => {
    const appConfig = configService.get('appConfig');
    return {
      secret: appConfig.jwt.secret,
      signOptions: appConfig.jwt.signOptions,
    };
  },
  inject: [ConfigService],
};
