import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Greeting } from '../src/modules/hello/hello.service';

interface SuccessBody {
  success: true;
  statusCode: number;
  data: Greeting;
}

// Requires a reachable MySQL instance (see docker-compose.yml) since
// AppModule wires up TypeOrmModule. Run `docker compose up -d mysql` first.
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/hello (GET) returns a default greeting', () => {
    return request(app.getHttpServer() as unknown as Parameters<typeof request>[0])
      .get('/api/v1/hello')
      .expect(200)
      .expect((res) => {
        expect((res.body as SuccessBody).data.message).toBe('Hello, World!');
      });
  });

  it('/api/v1/hello?name=Claude (GET) returns a personalized greeting', () => {
    return request(app.getHttpServer() as unknown as Parameters<typeof request>[0])
      .get('/api/v1/hello')
      .query({ name: 'Claude' })
      .expect(200)
      .expect((res) => {
        expect((res.body as SuccessBody).data.message).toBe('Hello, Claude!');
      });
  });
});
