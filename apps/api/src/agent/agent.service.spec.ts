import { AgentService } from './agent.service';
import { PlannerService } from './planner/planner.service';
import { LLMService } from '../llm/llm.service';
import { ExecutorService } from './executor/executor.service';
import { PatchRequestDTO, UpgradeProposalDTO } from '@aca/shared-types';

describe('AgentService orchestration', () => {
  it('runs planner -> llm -> executor successfully', async () => {
    const mockPlanner: any = {
      determineNextAction: jest
        .fn()
        .mockResolvedValue([{ filePath: 'README.md', currentContent: '', goal: 'x' }]),
    };
    const mockLLM: any = {
      generatePatch: jest
        .fn()
        .mockResolvedValue([
          { filePath: 'README.md', proposedContent: 'New', rationale: 'Improve' },
        ]),
    };
    const mockExecutor: any = { executeUpgrade: jest.fn().mockResolvedValue(true) };

    const svc = new AgentService(
      mockPlanner as PlannerService,
      mockLLM as LLMService,
      mockExecutor as ExecutorService,
    );
    const out = await svc.runAutonomousUpgrade();
    expect(out.success).toBe(true);
    expect(mockPlanner.determineNextAction).toHaveBeenCalled();
    expect(mockLLM.generatePatch).toHaveBeenCalled();
    expect(mockExecutor.executeUpgrade).toHaveBeenCalled();
  });
});
