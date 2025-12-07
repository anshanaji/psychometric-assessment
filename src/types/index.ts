export type Domain = 'N' | 'E' | 'O' | 'A' | 'C';
export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface Item {
  id: string;
  text: string;
  text_ml?: string;
  domain: Domain;
  facet: number | string;
  keyed: 1 | -1;
  input_type?: string;
}

export interface Norms {
  [key: string]: {
    mean: number;
    sd: number;
  };
}

export interface Career {
  title: string;
  zone: number;
  code: string;
}

export interface UserAnswers {
  [itemId: string]: number;
}

export interface ScoreResult {
  raw: number;
  zScore: number;
  percentile: number;
  level: 'Low' | 'Average' | 'High';
}

export interface AssessmentResult {
  domains: Record<Domain, ScoreResult>;
  facets: Record<string, ScoreResult>;
  riasec: Record<RiasecType, number>;
  topRiasec: string; // e.g., "ESA"
  careers: Career[];
  nuancedInsights?: Record<Domain, string>;
  consistencyFlags?: { item1Id: string; item2Id: string; message: string; severity: 'Medium' | 'High' }[];
  answers?: UserAnswers;
}
