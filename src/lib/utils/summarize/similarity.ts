/**
 * Lexical similarity used to detect near-duplicate task fragments.
 *
 * Character 3-grams (trigrams) are compared with the overlap coefficient: the share of the shorter
 * fragment's trigrams that also occur in the longer one. Two fragments are near-duplicates when
 * one says almost exactly what the other says, whether it repeats the same words in another order
 * or adds a few words to them.
 *
 * This is fully deterministic and needs no model and no network access, but it only sees wording:
 * two fragments that mean the same thing in different words are not similar here.
 */

/**
 * Default threshold for the overlap coefficient.
 *
 * The coefficient does not share the scale of an embedding similarity. On trigrams a threshold of
 * 0.75 catches almost nothing, while 0.9 keeps the pairs that really repeat the same work.
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.9;

/**
 * Lowercases the text and reduces it to letters, digits and single spaces.
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds the set of character trigrams for a piece of text.
 *
 * The text is padded with spaces so that the first and last words produce trigrams of their own.
 */
export function trigrams(text: string): Set<string> {
  const normalized = normalizeForComparison(text);
  if (!normalized) return new Set();

  const padded = `  ${normalized} `;
  const result = new Set<string>();

  for (let i = 0; i <= padded.length - 3; i++) {
    result.add(padded.slice(i, i + 3));
  }

  return result;
}

/**
 * Overlap coefficient of two trigram sets: the share of the smaller set that also occurs in the
 * larger one, between 0 and 1.
 */
export function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];

  let intersection = 0;
  for (const gram of smaller) {
    if (larger.has(gram)) intersection++;
  }

  return intersection / smaller.size;
}

/**
 * Similarity of two pieces of text, between 0 and 1.
 */
export function fragmentSimilarity(a: string, b: string): number {
  return overlapCoefficient(trigrams(a), trigrams(b));
}
