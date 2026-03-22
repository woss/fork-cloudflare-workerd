// Copyright (c) 2025 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { glob, globSync, mkdirSync, writeFileSync, promises } from 'node:fs';

function setupGlobFixtures() {
  mkdirSync('/tmp/globtest', { recursive: true });
  mkdirSync('/tmp/globtest/sub', { recursive: true });
  mkdirSync('/tmp/globtest/sub/deep', { recursive: true });
  mkdirSync('/tmp/globtest/other', { recursive: true });
  writeFileSync('/tmp/globtest/a.js', 'a');
  writeFileSync('/tmp/globtest/b.ts', 'b');
  writeFileSync('/tmp/globtest/c.txt', 'c');
  writeFileSync('/tmp/globtest/sub/d.js', 'd');
  writeFileSync('/tmp/globtest/sub/e.ts', 'e');
  writeFileSync('/tmp/globtest/sub/deep/f.js', 'f');
  writeFileSync('/tmp/globtest/other/g.js', 'g');
}

const cwd = '/tmp/globtest';

export const globSyncStarTest = {
  test() {
    setupGlobFixtures();
    // * should match files in the cwd only (not subdirectories)
    const result = globSync('*.js', { cwd });
    deepStrictEqual(result.sort(), ['a.js']);
  },
};

export const globSyncDoubleStarTest = {
  test() {
    setupGlobFixtures();
    // **/*.js should match .js files at any depth
    const result = globSync('**/*.js', { cwd });
    deepStrictEqual(result.sort(), [
      'a.js',
      'other/g.js',
      'sub/d.js',
      'sub/deep/f.js',
    ]);
  },
};

export const globSyncBraceExpansionTest = {
  test() {
    setupGlobFixtures();
    // *.{js,ts} should match both .js and .ts files in cwd
    const result = globSync('*.{js,ts}', { cwd });
    deepStrictEqual(result.sort(), ['a.js', 'b.ts']);
  },
};

export const globSyncQuestionMarkTest = {
  test() {
    setupGlobFixtures();
    // ?.js should match single-character name .js files
    const result = globSync('?.js', { cwd });
    deepStrictEqual(result.sort(), ['a.js']);
  },
};

export const globSyncCharacterClassTest = {
  test() {
    setupGlobFixtures();
    // [ab].* should match a.js, b.ts
    const result = globSync('[ab].*', { cwd });
    deepStrictEqual(result.sort(), ['a.js', 'b.ts']);
  },
};

export const globSyncNegatedCharacterClassTest = {
  test() {
    setupGlobFixtures();
    // [!bc].* should match a.js but not b.ts or c.txt
    const result = globSync('[!bc].*', { cwd });
    deepStrictEqual(result, ['a.js']);
  },
};

export const globSyncSubdirectoryPatternTest = {
  test() {
    setupGlobFixtures();
    // sub/*.js should match files directly under sub/
    const result = globSync('sub/*.js', { cwd });
    deepStrictEqual(result, ['sub/d.js']);
  },
};

export const globSyncDoubleStarAllTest = {
  test() {
    setupGlobFixtures();
    // ** should match everything
    const result = globSync('**', { cwd });
    ok(result.length > 0);
    ok(result.includes('a.js'));
    ok(result.includes('sub/d.js'));
    ok(result.includes('sub/deep/f.js'));
  },
};

export const globSyncNoMatchTest = {
  test() {
    setupGlobFixtures();
    // Pattern that matches nothing
    const result = globSync('*.xyz', { cwd });
    deepStrictEqual(result, []);
  },
};

export const globSyncMultiplePatternsTest = {
  test() {
    setupGlobFixtures();
    // Multiple patterns should union results (deduplicated)
    const result = globSync(['*.js', '*.ts'], { cwd });
    deepStrictEqual(result.sort(), ['a.js', 'b.ts']);
  },
};

export const globSyncWithFileTypesTest = {
  test() {
    setupGlobFixtures();
    const result = globSync('*.js', { cwd, withFileTypes: true });
    strictEqual(result.length, 1);
    strictEqual(result[0].name, 'a.js');
    ok(result[0].isFile());
    ok(!result[0].isDirectory());
  },
};

export const globSyncExcludeTest = {
  test() {
    setupGlobFixtures();
    // Exclude .ts files
    const result = globSync('*.*', { cwd, exclude: (p) => p.endsWith('.ts') });
    ok(!result.includes('b.ts'));
    ok(result.includes('a.js'));
    ok(result.includes('c.txt'));
  },
};

export const globSyncCwdDefaultTest = {
  test() {
    // Without cwd, should use process.cwd()
    // Just verify it doesn't throw
    const result = globSync('*.nonexistent');
    deepStrictEqual(result, []);
  },
};

export const globCallbackTest = {
  async test() {
    setupGlobFixtures();
    const result = await new Promise((resolve, reject) => {
      glob('*.js', { cwd }, (err, matches) => {
        if (err) reject(err);
        else resolve(matches);
      });
    });
    deepStrictEqual(result, ['a.js']);
  },
};

export const globCallbackNoOptionsTest = {
  async test() {
    // Callback as second argument (no options)
    const result = await new Promise((resolve, reject) => {
      glob('*.nonexistent', (err, matches) => {
        if (err) reject(err);
        else resolve(matches);
      });
    });
    deepStrictEqual(result, []);
  },
};

export const globPromisesTest = {
  async test() {
    setupGlobFixtures();
    const results = [];
    for await (const entry of promises.glob('*.js', { cwd })) {
      results.push(entry);
    }
    deepStrictEqual(results, ['a.js']);
  },
};

export const globPromisesDoubleStarTest = {
  async test() {
    setupGlobFixtures();
    const results = [];
    for await (const entry of promises.glob('**/*.js', { cwd })) {
      results.push(entry);
    }
    deepStrictEqual(results.sort(), [
      'a.js',
      'other/g.js',
      'sub/d.js',
      'sub/deep/f.js',
    ]);
  },
};

export const globSyncDirectoryMatchTest = {
  test() {
    setupGlobFixtures();
    // Directories should also be matchable
    const result = globSync('sub', { cwd });
    deepStrictEqual(result, ['sub']);
  },
};

export const globSyncDoubleStarSlashTest = {
  test() {
    setupGlobFixtures();
    // sub/**/*.js should match .js files under sub/ at any depth
    const result = globSync('sub/**/*.js', { cwd });
    deepStrictEqual(result.sort(), ['sub/d.js', 'sub/deep/f.js']);
  },
};
