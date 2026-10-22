/**
 * Unit Test for Ticket 03: Client URL Parser & Hybrid Launcher Engine
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Path to client module
const launcherModulePath = path.join(__dirname, 'chiron-ide-launcher.js');
let launcher;

try {
  launcher = require(launcherModulePath);
} catch (e) {
  console.log("Module not found yet (RED phase):", e.message);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'chiron_config.json'), 'utf8'));

console.log("--- [TEST 1: Parse Multi-segment Branch GitLab URL] ---");
const url1 = "http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift#L54-L75";
const parsed1 = launcher.parseGitLabUrl(url1, config);

assert.strictEqual(parsed1.project, "samir_it/samir-mobile");
assert.strictEqual(parsed1.branch, "learn/iOS-Arch");
assert.strictEqual(parsed1.filePath, "ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift");
assert.strictEqual(parsed1.startLine, 54);
assert.strictEqual(parsed1.endLine, 75);
console.log("   -> Parsed complex GitLab URL successfully!");

console.log("--- [TEST 2: Parse Single Line & Single-segment Branch URL] ---");
const url2 = "http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/develop/ios/Podfile#L12";
const parsed2 = launcher.parseGitLabUrl(url2, config);

assert.strictEqual(parsed2.project, "samir_it/samir-mobile");
assert.strictEqual(parsed2.branch, "develop");
assert.strictEqual(parsed2.filePath, "ios/Podfile");
assert.strictEqual(parsed2.startLine, 12);
assert.strictEqual(parsed2.endLine, null);
console.log("   -> Parsed single line URL successfully!");

console.log("--- [TEST 3: Resolve Local File Path from Config] ---");
const localPath = launcher.resolveLocalPath(parsed1, config);
assert.strictEqual(
  localPath,
  "/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift"
);
console.log("   -> Local path resolved correctly via config mappings!");

console.log("--- [TEST 4: Build IDE URI Schemes] ---");
const uriAg = launcher.buildIdeUri("antigravity", localPath, 54);
assert.strictEqual(uriAg, `antigravity-ide://file/${localPath}:54`);

const uriCursor = launcher.buildIdeUri("cursor", localPath, 54);
assert.strictEqual(uriCursor, `cursor://file/${localPath}:54`);

const uriVscode = launcher.buildIdeUri("vscode", localPath, 54);
assert.strictEqual(uriVscode, `vscode://file/${localPath}:54`);
console.log("   -> IDE URI Schemes constructed correctly!");

console.log("\n🎉 ALL TESTS IN TICKET 03 PASSED!");
