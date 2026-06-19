import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('Hotfix · profiles.email NOT NULL', () => {
  it('Setup-Route gibt email beim Upsert immer mit', () => {
    const r = read('app', 'api', 'profil', 'setup', 'route.ts');
    expect(r).toMatch(/upsert\(\{\s*id:\s*user\.id,\s*email:\s*user\.email/);
  });
});
