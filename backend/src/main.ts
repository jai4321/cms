import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';

class RedisIoAdapter extends IoAdapter {
  private pubClient: Redis;
  private subClient: Redis;

  async connectToRedis(redisUrl: string) {
    this.pubClient = new Redis(redisUrl);
    this.subClient = this.pubClient.duplicate();
    await Promise.all([
      new Promise<void>((res) => this.pubClient.once('ready', res)),
      new Promise<void>((res) => this.subClient.once('ready', res)),
    ]);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as ReturnType<
      IoAdapter['createIOServer']
    >;
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(4000);
}
bootstrap();
