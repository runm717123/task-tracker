import { fragmentSimilarity } from "./similarity";

/**
 * Removes near-duplicate fragments of a single group.
 *
 * Fragments are compared with the overlap coefficient of their character 3-grams. Fragments that
 * are similar enough form a cluster and only the longest fragment of each cluster is kept, because
 * it carries the most detail.
 *
 * @param sentences the fragments of one group
 * @param threshold the share of the shorter fragment that must also occur in the longer one
 * @returns the fragments that are not near-duplicates of another fragment
 */
export function removeSimilarSentences(sentences: string[], threshold: number): string[] {
  if (sentences.length <= 1) return [...sentences];

  // Remove exact duplicates first
  const unique = [...new Set(sentences)];
  if (unique.length <= 1) return unique;

  // Union near-duplicates into clusters
  const parents = unique.map((_, index) => index);

  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    return root;
  };

  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parents[rootB] = rootA;
  };

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      if (fragmentSimilarity(unique[i], unique[j]) > threshold) union(i, j);
    }
  }

  // Keep the longest fragment of every cluster
  const longestInCluster = new Map<number, number>();

  for (let i = 0; i < unique.length; i++) {
    const root = find(i);
    const current = longestInCluster.get(root);

    if (current === undefined || unique[i].length > unique[current].length) {
      longestInCluster.set(root, i);
    }
  }

  const kept = new Set(longestInCluster.values());

  return unique.filter((_, index) => kept.has(index));
}
