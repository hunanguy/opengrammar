import { getEnglishDictionary } from './dictionary.js';
import type { Issue } from './shared-types.js';

const v0 = new Uint8Array(64);
const v1 = new Uint8Array(64);
const v2 = new Uint8Array(64);

/**
 * Levenshtein distance between two strings.
 * Used to find the closest dictionary words for a misspelled word.
 */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;
  if (a === b) return 0;

  // Fast path: if lengths differ by more than max edit distance, skip
  if (Math.abs(la - lb) > 2) return Math.abs(la - lb);

  for (let i = 0; i <= lb; i++) v0[i] = i;

  for (let i = 0; i < la; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < lb; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      let min = v1[j]! + 1; // insertion
      if (v0[j + 1]! + 1 < min) min = v0[j + 1]! + 1; // deletion
      if (v0[j]! + cost < min) min = v0[j]! + cost; // substitution

      // Transposition (Damerau extension)
      if (i > 0 && j > 0 && a[i] === b[j - 1] && a[i - 1] === b[j]) {
        if (v2[j - 1]! + cost < min) min = v2[j - 1]! + cost;
      }
      
      v1[j + 1] = min;
    }
    for (let j = 0; j <= lb; j++) {
      v2[j] = v0[j]!;
      v0[j] = v1[j]!;
    }
  }

  return v1[lb]!;
}

/**
 * Simple Soundex implementation for phonetic matching.
 */
function soundex(word: string): string {
  const w = word.toUpperCase();
  const codes: Record<string, string> = {
    B: '1',
    F: '1',
    P: '1',
    V: '1',
    C: '2',
    G: '2',
    J: '2',
    K: '2',
    Q: '2',
    S: '2',
    X: '2',
    Z: '2',
    D: '3',
    T: '3',
    L: '4',
    M: '5',
    N: '5',
    R: '6',
  };

  let result = w[0] || '';
  let lastCode = codes[result] || '0';

  for (let i = 1; i < w.length && result.length < 4; i++) {
    const code = codes[w[i]!] || '0';
    if (code !== '0' && code !== lastCode) {
      result += code;
    }
    lastCode = code;
  }

  return result.padEnd(4, '0');
}

// Words that should never be flagged as misspelled
const COMMON_ABBREVIATIONS = new Set([
  'ok',
  'tv',
  'vs',
  'etc',
  'eg',
  'ie',
  'mr',
  'mrs',
  'ms',
  'dr',
  'jr',
  'sr',
  'am',
  'pm',
  'ad',
  'bc',
  'ai',
  'ui',
  'ux',
  'api',
  'url',
  'html',
  'css',
  'js',
  'ts',
  'npm',
  'git',
  'cli',
  'sql',
  'http',
  'https',
  'www',
  'io',
  'id',
  'pdf',
  'json',
  'xml',
  'csv',
]);

// Words that look like misspellings but are legitimate.
// Also includes words our rule engine handles intentionally —
// they shouldn't be double-flagged by the spellchecker with garbled suggestions.
const SAFE_WORDS = new Set([
  // Common valid short words
  'seed',
  'feed',
  'weed',
  'breed',
  'speed',
  'bleed',
  'freed',
  'treed',
  'nice',
  'stuff',
  'ain',

  // Tech / Internet
  'email',
  'emails',
  'online',
  'offline',
  'website',
  'username',
  'inbox',
  'login',
  'logout',
  'signup',
  'podcast',
  'hashtag',
  'emoji',
  'selfie',
  'bitcoin',
  'crypto',
  'startup',
  'app',
  'apps',
  'blog',
  'blogs',
  'wifi',
  'backend',
  'frontend',
  'middleware',
  'webhook',
  'localhost',
  'devops',
  'repo',
  'changelog',
  'dataset',
  'workflow',
  'timestamp',
  'configs',
  'endpoints',

  // Words handled by our formality/style rules (DO NOT spellcheck-flag these)
  'gonna',
  'wanna',
  'gotta',
  'kinda',
  'sorta',
  'lemme',
  'gimme',
  'dunno',
  'outta',
  'lotsa',
  'coulda',
  'shoulda',
  'woulda',
  'musta',
  'hafta',
  'btw',
  'tbh',
  'fyi',
  'wrt',
  'imo',
  'lol',
  'omg',
  'ngl',
  'bruh',
  'nah',

  // Words handled by our inclusive language rules
  'policeman',
  'policemen',
  'policewoman',
  'fireman',
  'firemen',
  'chairman',
  'chairwoman',
  'stewardess',
  'mailman',
  'mankind',
  'manpower',
  'businessman',
  'businessmen',
  'spokesman',
  'congressman',
  'craftsman',
  'salesman',
  'waitress',
  'actress',
  'housewife',
  'manhole',

  // Words handled by our business/readability rules
  'ameliorate',
  'ascertain',
  'cognizant',
  'elucidate',
  'expedite',
  'remuneration',
  'disseminate',
  'promulgate',
  'effectuate',
  'incentivize',
  'operationalize',
  'onboard',
  'onboarding',
  'heretofore',
  'aforementioned',
  'henceforth',
  'notwithstanding',
  'inasmuch',
  'commensurate',
  'dichotomy',
  'juxtapose',
  'ubiquitous',
  'quintessential',
  'multifaceted',
  'exacerbate',
  'proliferate',

  // Words handled by confused-words rules
  'irregardless',
  'conversate',
  'orientate',
  'preventative',
  'alright',

  // Inclusive language targets
  'handicapped',
  'ableist',

  // Stative verbs in progressive (we flag "is knowing" → "knows", not "knowing" itself)
  'knowing',
  'believing',
  'owning',
  'belonging',
  'consisting',
  'containing',
  'depending',
  'preferring',
  'seeming',
  'appearing',
]);

// Cache for Soundex values to speed up suggestions
let _soundexCache: Map<string, string> | null = null;

function getSoundexCache(dictionary: Set<string>): Map<string, string> {
  if (!_soundexCache) {
    _soundexCache = new Map();
    for (const word of dictionary) {
      _soundexCache.set(word, soundex(word));
    }
  }
  return _soundexCache;
}

let _lengthIndexCache: Map<number, string[]> | null = null;

function getLengthIndex(dictionary: Set<string>): Map<number, string[]> {
  if (!_lengthIndexCache) {
    _lengthIndexCache = new Map();
    for (const word of dictionary) {
      const len = word.length;
      let list = _lengthIndexCache.get(len);
      if (!list) {
        list = [];
        _lengthIndexCache.set(len, list);
      }
      list.push(word);
    }
  }
  return _lengthIndexCache;
}

/**
 * Find the best spelling suggestions for a misspelled word.
 * Uses Levenshtein distance + Soundex phonetic matching.
 */
function findSuggestions(
  word: string,
  dictionary: Set<string>,
  maxSuggestions: number = 3,
): string[] {
  const lower = word.toLowerCase();
  const len = lower.length;
  const wordSoundex = soundex(lower);
  const soundexMap = getSoundexCache(dictionary);
  const lengthIndex = getLengthIndex(dictionary);

  // Candidates: words with similar length and either similar sound or close edit distance
  const candidates: Array<{ word: string; distance: number; score: number }> = [];

  for (let l = Math.max(1, len - 2); l <= len + 2; l++) {
    const list = lengthIndex.get(l);
    if (!list) continue;

    for (let i = 0; i < list.length; i++) {
      const dictWord = list[i]!;
      
      const sameStart = dictWord[0] === lower[0];
      if (!sameStart && Math.abs(l - len) > 1) continue;

      const dist = levenshtein(lower, dictWord);
      if (dist <= 2) {
        // Phonetic bonus
        const phoneticMatch = soundexMap.get(dictWord) === wordSoundex;
        const score = dist - (phoneticMatch ? 0.5 : 0) - (sameStart ? 0.3 : 0);
        candidates.push({ word: dictWord, distance: dist, score });
      }
    }
  }

  // Sort by score (lower is better), then alphabetically
  candidates.sort((a, b) => a.score - b.score || a.word.localeCompare(b.word));

  return candidates.slice(0, maxSuggestions).map((c) => c.word);
}

/**
 * Check text for spelling errors using a real dictionary.
 * Returns issues for words not found in the dictionary.
 */
export function checkSpelling(text: string, userDictionary?: Set<string>): Issue[] {
  const dictionary = getEnglishDictionary();
  const issues: Issue[] = [];

  // Tokenize text into words with their positions
  const wordRegex = /\b([a-zA-Z]{2,})\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[1]!;
    const lower = word.toLowerCase();

    // Skip checks for:
    // 1. Words in the dictionary
    if (dictionary.has(lower)) continue;

    // 2. Words in the user's custom dictionary
    if (userDictionary?.has(lower)) continue;

    // 3. Common abbreviations and tech terms
    if (COMMON_ABBREVIATIONS.has(lower)) continue;

    // 4. Safe words that should never be flagged
    if (SAFE_WORDS.has(lower)) continue;

    // 5. Words that look like proper nouns (capitalized, not at sentence start)
    if (word[0] === word[0]!.toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
      // Check if it's at the start of a sentence
      const before = text.slice(Math.max(0, match.index - 3), match.index).trim();
      if (
        before.length > 0 &&
        !before.endsWith('.') &&
        !before.endsWith('!') &&
        !before.endsWith('?')
      ) {
        continue; // Likely a proper noun
      }
    }

    // 6. All-caps words (acronyms)
    if (word === word.toUpperCase()) continue;

    // 7. Words with numbers mixed in
    if (/\d/.test(word)) continue;

    // 8. Very short words (2 chars) — too many false positives
    if (word.length <= 2) continue;

    // This word is not in the dictionary — find suggestions
    const suggestions = findSuggestions(lower, dictionary);
    if (suggestions.length > 0) {
      issues.push({
        type: 'spelling',
        original: word,
        suggestion: suggestions[0]!,
        reason: `"${word}" may be misspelled. Did you mean "${suggestions[0]}"?${suggestions.length > 1 ? ` Other suggestions: ${suggestions.slice(1).join(', ')}` : ''}`,
        offset: match.index,
        length: word.length,
      });
    } else {
      // No close suggestions found — still flag it
      issues.push({
        type: 'spelling',
        original: word,
        suggestion: word,
        reason: `"${word}" is not in the dictionary. Check the spelling.`,
        offset: match.index,
        length: word.length,
      });
    }
  }

  return issues;
}

export { COMMON_ABBREVIATIONS, SAFE_WORDS };
