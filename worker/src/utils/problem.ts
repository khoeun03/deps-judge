import { readdirSync, readFileSync } from 'fs';

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
      files: Record<
        string,
        {
          languages: string[];
          content: string | undefined;
          count: MinMaxRequirement | undefined;
          bytes: MinMaxRequirement | undefined;
        }
      >;
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

const loadTestCases = async (problemPath: string): Promise<TestCase[]> => {
  const dirs = readdirSync(`${problemPath}/testcases`, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const testCases = dirs.map((dir) => {
    const basePath = `${problemPath}/testcases/${dir.name}`;
    const input = readFileSync(`${basePath}/input.txt`, 'utf-8');
    const output = readFileSync(`${basePath}/output.txt`, 'utf-8');
    return { input, output };
  });

  return testCases;
};

export { loadProblemMeta, loadTestCases };
