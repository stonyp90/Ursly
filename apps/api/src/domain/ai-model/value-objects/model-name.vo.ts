const VALID_MODELS = [
  'llama2',
  'llama2:7b',
  'llama2:13b',
  'llama2:70b',
  'mistral',
  'mixtral',
  'codellama',
  'vicuna',
  'orca-mini',
];

export class ModelName {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Model name cannot be empty');
    }
  }

  static create(value: string): ModelName {
    return new ModelName(value.trim());
  }

  isValid(): boolean {
    return VALID_MODELS.some(m => this.value.startsWith(m));
  }

  equals(other: ModelName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

