import { IsString, IsNotEmpty } from 'class-validator';

export class ApproveProposalDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  newContent: string;
}
