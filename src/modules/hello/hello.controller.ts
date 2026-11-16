import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { GreetingQueryDto } from './dto/greeting-query.dto';
import { Greeting, HelloService } from './hello.service';

@Controller('hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Public()
  @Get()
  getHello(@Query() query: GreetingQueryDto): Greeting {
    return this.helloService.getGreeting(query.name);
  }
}
