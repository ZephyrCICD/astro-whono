import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve('.');
const checkedFiles = [
  'src/lib/admin-console/content.ts',
  'src/lib/admin-console/content-source-index.ts',
  'src/lib/admin-console/content-entry-source.ts',
  'src/lib/admin-console/content-editor-payload.ts',
  'src/lib/admin-console/content-write-plan.ts'
];

const forbiddenPatterns = [
  {
    label: 'astro:content import',
    pattern: /from\s+['"]astro:content['"]/
  },
  {
    label: 'public content module import',
    pattern: /from\s+['"]\.\.\/content['"]/
  },
  {
    label: 'public bits module import',
    pattern: /from\s+['"]\.\.\/bits['"]/
  },
  {
    label: 'astro content entry type',
    pattern: /\b(?:EssayEntry|BitsEntry|MemoEntry|CollectionEntry)\b/
  },
  {
    label: 'public content query',
    pattern: /\b(?:getSortedEssays|getSortedBits|getPublished|getEssayDerivedText|getBitsDerivedText|getMemoDerivedText|getEssaySlug|getBitSlug)\b/
  }
];

const failures = [];

for (const relativePath of checkedFiles) {
  const filePath = path.join(projectRoot, relativePath);
  const source = await readFile(filePath, 'utf8');

  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(source)) {
      failures.push(`${relativePath}: ${label}`);
    }
  }
}

if (failures.length > 0) {
  console.error('[check:admin-content-source-boundary] Admin Content source boundary violations:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[check:admin-content-source-boundary] OK');
