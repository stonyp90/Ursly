export interface Model {
  name: string;
  size: number;
  digest: string;
  modifiedAt: Date;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameterSize?: string;
    quantizationLevel?: string;
  };
}

export interface ModelPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface PullModelDto {
  name: string;
  insecure?: boolean;
  stream?: boolean;
}

