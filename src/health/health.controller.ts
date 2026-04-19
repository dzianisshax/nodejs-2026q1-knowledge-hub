import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  health(): { status: string } {
    return { status: 'ok' };
  }
}
