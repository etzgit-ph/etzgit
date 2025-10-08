import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FileAccessService } from '../filesystem/file-access.service';
import { OpenaiService } from './openai.service';
import { ProposalDetail, ProposalResponse } from '../../../packages/shared-types/src/command';
import { GitCommandService } from '../git/git-command.service';
import { GithubApiService } from '../github/github-api.service';

@Injectable()
export class OpenaiCommandRouterService {
  private readonly logger = new Logger(OpenaiCommandRouterService.name);
  constructor(
    private readonly fileAccessService: FileAccessService,
    private readonly gitCommandService?: GitCommandService,
    private readonly githubApiService?: GithubApiService,
    private readonly openaiService?: OpenaiService,
  ) {}

  // Accept structured commands (UpgradeCommandDto / DebugCommandDto) and translate them
  // into a deterministic, explicit prompt suitable for generating tool-calls.
  async routeStructuredCommand(dto: any): Promise<ProposalResponse | string | null> {
    const parts: string[] = [];
    parts.push('You are an automated assistant. Follow instructions exactly and use tool calling when needed.');
    parts.push(`Command type: ${dto.type}`);
    parts.push(`Target: ${dto.target}`);
    parts.push(`Action: ${dto.action}`);

    // Create a detailed system-level instruction
    const prompt = parts.join('\n');

    this.logger.log(`Structured prompt generated:\n${prompt}`);

    // Call OpenAI to generate a response if available. Tests may not inject OpenaiService.
    if (!this.openaiService) {
      this.logger.debug('OpenaiService not available; returning prompt');
      return prompt;
    }

    const responseText = await this.openaiService.generateChatCompletion(prompt);
    this.logger.log(`OpenAI response for structured command: ${responseText}`);

    // Try to parse JSON tool-call response: { toolName: 'writeFileProposal', arguments: { path, newContent, rationale } }
    try {
      const parsed = JSON.parse(responseText);
      if (parsed && parsed.toolName && parsed.arguments) {
        const toolRes = await this.processToolCall(parsed.toolName, parsed.arguments);
        return toolRes;
      }
    } catch (err) {
      this.logger.debug('Response not JSON or not a tool-call; returning raw response');
    }

    return responseText;
  }

  async processToolCall(toolName: string, args: any): Promise<ProposalResponse | null> {
    if (toolName !== 'writeFileProposal') return null;

    const path = args.path as string;
    const newContent = args.newContent as string;
    const rationale = args.rationale as string | undefined;

    this.logger.log(`Processing writeFileProposal for ${path}`);

    const oldContent = await this.fileAccessService.readFile(path);

    const proposal: ProposalDetail = {
      id: uuidv4(),
      path,
      oldContent,
      newContent,
      rationale,
      author: 'ai',
      createdAt: new Date().toISOString(),
    };

    return { type: 'proposal', payload: proposal };
  }

  async approveProposal(id: string, path: string, newContent: string): Promise<{ branch: string }> {
    // create branch
    const branchName = `ai-upgrade-${id}`;
    if (this.gitCommandService) {
      await this.gitCommandService.checkoutBranch(branchName);
    }

    // write file via FileAccessService
    await this.fileAccessService.writeFile(path, newContent);

    // commit
    if (this.gitCommandService) {
      await this.gitCommandService.commitFile(path, `AI Upgrade Proposal: ${id}`);
      await this.gitCommandService.pushBranch(branchName);

      // attempt to create a PR if GitHub service is available
      try {
        if (this.githubApiService) {
          // derive owner/repo from package.json repository or environment; for now use env
          const owner = process.env.GITHUB_REPO_OWNER || process.env.GITHUB_OWNER || 'etzgit-ph';
          const repo = process.env.GITHUB_REPO_NAME || process.env.GITHUB_REPO || 'etzgit';
          const base = process.env.GITHUB_BASE_BRANCH || 'main';
              const title = `feat(ai): Auto-generated upgrade for ${path} (ID: ${id})`;
              const body = 'AI-generated change for ' + path + '\n\nRationale:\n' + 'No rationale provided' + '\n\nID: ' + id;
          await this.githubApiService.createPullRequest(owner, repo, branchName, base, title, body);
        }
      } catch (err) {
        this.logger.warn(`PR creation failed: ${err}`);
      }
    }

    return { branch: branchName };
  }
}
