import { readFileSync } from 'fs';

export type ProblemMeta = {
  title: string;
  timeLimit: number;
  memoryLimit: number;
  languages: string[];
};

const loadProblemMeta = async (problemPath: string): Promise<ProblemMeta> => {
  return JSON.parse(readFileSync(`${problemPath}/problem.json`, 'utf-8'));
};

const loadProblemStatement = async (problemPath: string): Promise<string> => {
  return readFileSync(`${problemPath}/statement.md`, 'utf-8');
};

export { loadProblemMeta, loadProblemStatement };
