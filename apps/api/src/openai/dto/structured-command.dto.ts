import { UpgradeCommandDto, DebugCommandDto } from '../../../../../packages/shared-types/src/command';

export type StructuredCommandDto = UpgradeCommandDto | DebugCommandDto;

export default StructuredCommandDto;
