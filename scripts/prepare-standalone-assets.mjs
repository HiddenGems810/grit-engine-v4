import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.resolve(root, '.next', 'standalone');
const sourceStaticDir = path.resolve(root, '.next', 'static');
const sourcePublicDir = path.resolve(root, 'public');
const targetStaticDir = path.resolve(standaloneDir, '.next', 'static');
const targetPublicDir = path.resolve(standaloneDir, 'public');

function assertInsideStandalone(target) {
  const relative = path.relative(standaloneDir, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to modify path outside standalone output: ${target}`);
  }
}

async function copyFresh(source, target) {
  assertInsideStandalone(target);
  await rm(target, { recursive: true, force: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

await copyFresh(sourceStaticDir, targetStaticDir);
await copyFresh(sourcePublicDir, targetPublicDir);

