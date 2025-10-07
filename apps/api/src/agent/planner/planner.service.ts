import { Injectable } from '@nestjs/common';
import { PatchRequestDTO } from '@aca/shared-types';

@Injectable()
export class PlannerService {
  async determineNextAction(): Promise<PatchRequestDTO[]> {
    // Return a safe, non-critical initial action: update README with version placeholder
    return [
      {
        filePath: 'README.md',
        currentContent: '',
        goal: 'Ensure README contains project version',
      },
    ];
  }
}
