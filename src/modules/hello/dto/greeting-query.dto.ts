import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GreetingQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}
