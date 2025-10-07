import { Injectable, Logger } from '@nestjs/common';
import { PlannerService } from './planner/planner.service';
import { LLMService } from '../llm/llm.service';
import { ExecutorService } from './executor/executor.service';
import { UpgradeProposalDTO, PatchRequestDTO } from '@aca/shared-types';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly planner: PlannerService,
    private readonly llm: LLMService,
    private readonly executor: ExecutorService,
  ) {}

  async runAutonomousUpgrade(): Promise<{ success: boolean; details: any }> {
    this.logger.log('Starting autonomous upgrade run');

    const actions: PatchRequestDTO[] = await this.planner.determineNextAction();
    this.logger.log(`Planner returned ${actions.length} actions`);

    const allProposals: UpgradeProposalDTO[] = [];

    for (const action of actions) {
      try {
        const proposals = await this.llm.generatePatch(action);
        allProposals.push(...proposals);
        this.logger.log(`LLM returned ${proposals.length} proposals for ${action.filePath}`);
      } catch (err) {
        this.logger.error('LLM failed to generate patch: ' + String(err));
        return { success: false, details: { error: 'LLM failed', cause: String(err) } };
      }
    }

    try {
      const executed = await this.executor.executeUpgrade(allProposals);
      this.logger.log('Executor finished with: ' + executed);
      return { success: executed, details: { proposals: allProposals.length } };
    } catch (err) {
      this.logger.error('Executor failed: ' + String(err));
      return { success: false, details: { error: 'Executor failed', cause: String(err) } };
    }
  }
}
