import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('api/v1')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  getStatus() {
    return this.systemService.getStatus();
  }
}
