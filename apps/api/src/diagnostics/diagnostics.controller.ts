import { Controller, Get, UseGuards } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('api/diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnostics: DiagnosticsService) {}

  @Get('failing-tests')
  @UseGuards(AuthGuard)
  getFailingTests() {
    return this.diagnostics.getFailingTests();
  }
}
