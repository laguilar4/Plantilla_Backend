import { Test, TestingModule } from '@nestjs/testing';
import { HelloService } from './hello.service';

describe('HelloService', () => {
  let service: HelloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelloService],
    }).compile();

    service = module.get<HelloService>(HelloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('greets the world by default', () => {
    const result = service.getGreeting();
    expect(result.message).toBe('Hello, World!');
  });

  it('greets a given name', () => {
    const result = service.getGreeting('Claude');
    expect(result.message).toBe('Hello, Claude!');
  });

  it('falls back to World for blank input', () => {
    const result = service.getGreeting('   ');
    expect(result.message).toBe('Hello, World!');
  });
});
