export class AgentException extends Error {
  public readonly code?: string;
  constructor(message?: string, code?: string) {
    super(message);
    this.name = 'AgentException';
    this.code = code;
  }
}
