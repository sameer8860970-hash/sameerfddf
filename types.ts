export enum RowStatus {
  Active = 'Active',
  Analyzing = 'Analyzing',
  Completed = 'Completed',
  Locked = 'Locked'
}

export interface ReasoningRow {
  id: string;
  stepNumber: number;
  content: string;
  aiInterrogation: string | null;
  status: RowStatus;
  depthScore?: number; // 1-10 implied depth
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Junior' | 'Senior' | 'Staff' | 'Principal';
  context: string;
}

export interface SessionResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}
