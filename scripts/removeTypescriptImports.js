import fs from 'fs';
import path from 'path';

const codeDir = path.join('src', 'constants', 'code');

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content
    .replace(/import tsCode from '@ts-default\/.*?raw';(\r?\n|\r)?/g, '')
    .replace(/import tsTailwind from '@ts-tailwind\/.*?raw';(\r?\n|\r)?/g, '');

  fs.writeFileSync(filePath, newContent);
  console.log(`Processed: ${filePath}`);
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && item.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

processDirectory(codeDir);
console.log('All TypeScript imports removed.');
