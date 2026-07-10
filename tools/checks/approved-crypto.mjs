#!/usr/bin/env node
// SP 800-131A approved-algorithm guard (HOS-2026-015-02, Judge D4).
//
// Locks in the currently-clean state: the only cryptographic primitives in the
// tree are node:crypto randomUUID (ids) and timingSafeEqual (token compare),
// both SP 800-131A approved. This check fails the build if a *banned* legacy
// primitive is introduced, so the good state cannot silently regress.
//
// Scope is deliberately narrow and high-confidence: it flags unambiguous
// weak/broken algorithms (MD5, SHA-1, DES/3DES, RC4, AES-ECB) and the
// deprecated key-less createCipher/createDecipher API. Context-dependent
// misuse that greps can't tell apart from legitimate use -- notably
// `Math.random` for a security purpose -- stays a review-only rule in
// AGENTS.md sec 3 rather than being false-positive-prone here. When in doubt
// this check stays silent rather than crying wolf.
//
// Usage:
//   node tools/checks/approved-crypto.mjs            # scan default source dirs
//   node tools/checks/approved-crypto.mjs <path...>  # scan given files/dirs (tests/CI)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

// Default scan roots: our own first-party source only (never node_modules).
const DEFAULT_ROOTS = ["apps/web/app", "tools/hos-cli/src"];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".cjs", ".js", ".jsx"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", "coverage"]);

// This checker itself names the banned tokens as documentation/patterns, so it
// must never scan itself.
const SELF = fileURLToPath(import.meta.url);

// Each rule: a name, a regex, and a short reason with the approved alternative.
// Regexes are matched per line so we can report line numbers.
const BANNED = [
  {
    name: "weak-hash",
    re: /\bcreate(?:Hash|Hmac)\s*\(\s*[`'"]\s*(?:md5|sha1|sha-1|ripemd160)\b/i,
    reason: "MD5/SHA-1/RIPEMD are banned (SP 800-131A). Use SHA-256/SHA-384/SHA-512.",
  },
  {
    name: "weak-cipher-algo",
    re: /[`'"](?:aes-\d+-ecb|des(?:-[a-z0-9]+)?|des-ede3(?:-[a-z]+)?|3des|rc4|rc2|bf|blowfish)[`'"]/i,
    reason: "DES/3DES/RC4/RC2/Blowfish and AES-ECB are banned. Use AES-256-GCM.",
  },
  {
    name: "deprecated-cipher-api",
    re: /\bcreate(?:Cipher|Decipher)\s*\(/,
    reason:
      "createCipher/createDecipher (key-less, MD5-derived key, no IV) is banned. Use createCipheriv/createDecipheriv with AES-256-GCM.",
  },
];

function collectFiles(target, out) {
  let st;
  try {
    st = statSync(target);
  } catch {
    return; // path may not exist when passed explicitly; skip quietly
  }
  if (st.isDirectory()) {
    for (const entry of readdirSync(target)) {
      if (SKIP_DIRS.has(entry)) continue;
      collectFiles(join(target, entry), out);
    }
    return;
  }
  if (!st.isFile()) return;
  if (resolve(target) === SELF) return;
  const dot = target.lastIndexOf(".");
  if (dot === -1 || !SCAN_EXTENSIONS.has(target.slice(dot))) return;
  out.push(target);
}

function scan(files) {
  const violations = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const rule of BANNED) {
        if (rule.re.test(line)) {
          violations.push({
            file: relative(REPO_ROOT, file) || file,
            line: i + 1,
            rule: rule.name,
            reason: rule.reason,
            text: line.trim().slice(0, 120),
          });
        }
      }
    });
  }
  return violations;
}

const argRoots = process.argv.slice(2);
const roots = (argRoots.length ? argRoots : DEFAULT_ROOTS).map((r) =>
  resolve(REPO_ROOT, r),
);

const files = [];
for (const root of roots) collectFiles(root, files);

const violations = scan(files);

if (violations.length === 0) {
  const scope = argRoots.length ? argRoots.join(", ") : DEFAULT_ROOTS.join(", ");
  console.log(
    `approved-crypto: OK - ${files.length} files scanned (${scope}), no banned algorithms found.`,
  );
  process.exit(0);
}

console.error("approved-crypto: BANNED algorithm(s) detected (SP 800-131A):\n");
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.text}`);
  console.error(`    -> ${v.reason}\n`);
}
console.error(
  `${violations.length} violation(s). See AGENTS.md sec 3 (approved-algorithm rule).`,
);
process.exit(1);
