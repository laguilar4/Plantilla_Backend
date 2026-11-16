import { Injectable } from '@nestjs/common';

export interface Greeting {
  message: string;
  timestamp: string;
}

@Injectable()
export class HelloService {
  getGreeting(name?: string): Greeting {
    const target = name?.trim() || 'World';
    return {
      message: `Hello, ${target}!`,
      timestamp: new Date().toISOString(),
    };
  }
}
