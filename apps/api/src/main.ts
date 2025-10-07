import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // retrieve interceptors via DI so they can receive ConfigService and other providers
  const logging = app.get(LoggingInterceptor);
  const security = app.get(SecurityHeadersInterceptor);
  app.useGlobalInterceptors(logging, security);
  await app.listen(3000);
}
bootstrap();
