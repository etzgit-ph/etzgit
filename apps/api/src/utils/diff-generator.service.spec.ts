import { DiffGeneratorService } from './diff-generator.service';

describe('DiffGeneratorService', () => {
  let service: DiffGeneratorService;

  beforeEach(() => {
    service = new DiffGeneratorService();
  });

  it('generates a unified diff between two small strings', () => {
    const oldContent = 'a\nb';
    const newContent = 'a\nc';
    const diff = service.generateDiff(oldContent, newContent, 'test.txt');
    expect(diff).toContain('-b');
    expect(diff).toContain('+c');
  });
});
