import { readFileSync } from 'fs';

export type MinMaxRequirement = {
  min: number | undefined;
  max: number | undefined;
};

export type ProblemMeta = {
  title: string;
  timeLimit: number;
  memoryLimit: number;
  formats: Record<
    string,
    {
      totalBytes: MinMaxRequirement | undefined;
      fileCount: MinMaxRequirement | undefined;
      files: {
        name: string;
        languages: string[];
        content: string | undefined;
        count: MinMaxRequirement | undefined;
        bytes: MinMaxRequirement | undefined;
      }[];
      scripts: Record<string, string>;
    }
  >;
};

export type TestCase = {
  input: string;
  output: string;
};

const loadProblemMeta = async (problemPath: string): Promise<ProblemMeta> => {
  return JSON.parse(readFileSync(`${problemPath}/problem.json`, 'utf-8'));
};

const loadProblemStatement = async (problemPath: string): Promise<string> => {
  return readFileSync(`${problemPath}/statement.md`, 'utf-8');
};

export { loadProblemMeta, loadProblemStatement };
