/**
 * Automated Test for W3C Fuzzy Text-Quote Anchoring Engine
 */

const assert = require('assert');

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1) return s2.length;
  if (!s2) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;
  const d = [];

  for (let i = 0; i <= len1; i++) d[i] = [i];
  for (let j = 0; j <= len2; j++) d[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[len1][len2];
}

function stringSimilarity(s1, s2) {
  const norm1 = normalizeText(s1).toLowerCase();
  const norm2 = normalizeText(s2).toLowerCase();
  if (norm1 === norm2) return 1.0;
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - (levenshteinDistance(norm1, norm2) / maxLen);
}

function findBestMatchInDocument(docText, anchor) {
  const { exact, prefix = '', suffix = '' } = anchor;
  if (!exact) return null;

  // 1. Find all exact occurrences of exact
  const occurrences = [];
  let pos = docText.indexOf(exact);
  while (pos !== -1) {
    occurrences.push(pos);
    pos = docText.indexOf(exact, pos + 1);
  }

  if (occurrences.length === 1) {
    return {
      type: 'exact_single',
      start: occurrences[0],
      end: occurrences[0] + exact.length,
      confidence: 1.0
    };
  }

  if (occurrences.length > 1) {
    // Score based on prefix and suffix match
    let bestScore = -1;
    let bestPos = occurrences[0];

    for (const p of occurrences) {
      const actualPrefix = docText.substring(Math.max(0, p - prefix.length), p);
      const actualSuffix = docText.substring(p + exact.length, p + exact.length + suffix.length);

      const prefScore = prefix ? stringSimilarity(actualPrefix, prefix) : 0.5;
      const suffScore = suffix ? stringSimilarity(actualSuffix, suffix) : 0.5;
      const totalScore = (prefScore + suffScore) / 2;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestPos = p;
      }
    }

    return {
      type: 'disambiguated_by_context',
      start: bestPos,
      end: bestPos + exact.length,
      confidence: bestScore
    };
  }

  // 3. Fuzzy search if exact text was slightly edited (typo fix, small wording change)
  const windowSize = exact.length;
  let bestFuzzyScore = 0;
  let bestFuzzyPos = -1;

  for (let i = 0; i <= docText.length - windowSize; i += 2) {
    const candidate = docText.substring(i, i + windowSize);
    const sim = stringSimilarity(candidate, exact);
    if (sim > bestFuzzyScore) {
      bestFuzzyScore = sim;
      bestFuzzyPos = i;
    }
  }

  if (bestFuzzyScore >= 0.75) {
    return {
      type: 'fuzzy_matched',
      start: bestFuzzyPos,
      end: bestFuzzyPos + windowSize,
      confidence: bestFuzzyScore
    };
  }

  return {
    type: 'orphaned',
    start: -1,
    end: -1,
    confidence: 0
  };
}

// ==================== TEST CASES ====================

console.log("Running W3C Fuzzy Anchoring Test Suite...");

// Scenario 1: Exact Match Single
const doc1 = "Inisialisasi yang dijalankan di dalam IDSamirMainModule.application(_:didFinishLaunchingWithOptions:). Selesai.";
const anchor1 = { exact: "IDSamirMainModule.application(_:didFinishLaunchingWithOptions:)" };
const res1 = findBestMatchInDocument(doc1, anchor1);
assert.strictEqual(res1.type, 'exact_single');
assert.strictEqual(res1.confidence, 1.0);
console.log("✓ Scenario 1: Exact Single Match PASSED");

// Scenario 2: Multiple Occurrences Disambiguated by Context (Prefix/Suffix)
const doc2 = `
Bagian 1: Memanggil prewarm().
Bagian 2: prewarm() harus dipanggil sebelum UIWindow siap.
Bagian 3: Jangan panggil prewarm() dua kali.
`;
const anchor2 = {
  exact: "prewarm()",
  prefix: "Bagian 2: ",
  suffix: " harus dipanggil"
};
const res2 = findBestMatchInDocument(doc2, anchor2);
assert.strictEqual(res2.type, 'disambiguated_by_context');
assert(res2.confidence > 0.85);
assert(doc2.substring(res2.start, res2.end) === "prewarm()");
// Check it selected the second instance
assert(doc2.substring(0, res2.start).includes("Bagian 2: "));
console.log("✓ Scenario 2: Multiple Occurrences Disambiguated PASSED");

// Scenario 3: Minor Typo / Refactoring Drift (Fuzzy Match)
const doc3 = "Fungsi FlutterEngineManager.shared.prewarmNow() telah dioptimalkan.";
const anchor3 = {
  exact: "FlutterEngineManager.shared.prewarm()"
};
const res3 = findBestMatchInDocument(doc3, anchor3);
assert.strictEqual(res3.type, 'fuzzy_matched');
assert(res3.confidence >= 0.85);
console.log(`✓ Scenario 3: Fuzzy Matched Drift (Confidence: ${(res3.confidence * 100).toFixed(1)}%) PASSED`);

// Scenario 4: Content Completely Deleted (Orphaned Gracefully)
const doc4 = "Halaman ini telah diganti seluruh isinya dengan materi baru.";
const anchor4 = {
  exact: "Fungsi Lama Yang Sudah Dihapus Total"
};
const res4 = findBestMatchInDocument(doc4, anchor4);
assert.strictEqual(res4.type, 'orphaned');
console.log("✓ Scenario 4: Gracefully Flagged as Orphaned PASSED");

console.log("\n🎉 ALL FUZZY ANCHORING TESTS PASSED!");
