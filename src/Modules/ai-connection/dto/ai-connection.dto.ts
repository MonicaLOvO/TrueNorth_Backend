export class AiConnectionDto {
  id: string;
  name: string;
  providerType: string;
  endpointUrl: string | null;
  modelName: string | null;
  isEnabled: boolean;
  isSelected: boolean;
  priority: number;
  keyPreview: string;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
}
