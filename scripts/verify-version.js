import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();

// 1. Read package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const pkgVersion = pkg.version;

// 2. Read src-tauri/tauri.conf.json
const tauriPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
const tauriVersion = tauriConf.version;

// 3. Read src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
const cargoContent = fs.readFileSync(cargoPath, 'utf8');
const cargoMatch = cargoContent.match(/\[package\][\s\S]*?version\s*=\s*"([^"]+)"/);
const cargoVersion = cargoMatch ? cargoMatch[1] : null;

console.log('--- Version Consistency Check ---');
console.log(`package.json:            ${pkgVersion}`);
console.log(`src-tauri/tauri.conf.json: ${tauriVersion}`);
console.log(`src-tauri/Cargo.toml:     ${cargoVersion}`);

const errors = [];

if (pkgVersion !== tauriVersion) {
  errors.push(`Mismatch: package.json (${pkgVersion}) != tauri.conf.json (${tauriVersion})`);
}

if (pkgVersion !== cargoVersion) {
  errors.push(`Mismatch: package.json (${pkgVersion}) != Cargo.toml (${cargoVersion})`);
}

if (errors.length > 0) {
  console.error('\n❌ Version parity check failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('\n✅ All versions are consistent!\n');
