import { AgentException } from './agent-exception';

export class ProtectedPathModificationError extends AgentException {
  constructor(public readonly path: string) {
    super(`Attempt to modify protected path: ${path}`, 'PROTECTED_PATH_MODIFICATION');
    this.name = 'ProtectedPathModificationError';
  }
}
