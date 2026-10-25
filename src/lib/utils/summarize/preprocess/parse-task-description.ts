const STATUS_WORDS = "(done|in progress|completed|pending|todo|finished)";
const STATUS_REGEX_START = new RegExp(`^${STATUS_WORDS}\\s*(-|->)\\s*`, "i");
const STATUS_REGEX_END = new RegExp(`\\s*(-|->|\\()\\s*${STATUS_WORDS}\\s*\\)?$`, "i");

/** A line that starts with a list marker is a bullet in a list. */
const BULLET_MARKER = /^[-*•]\s*(.*)$/;

/**
 * A fragment that starts with one of these continues the previous one instead of standing on its
 * own, e.g. the "which was in the parser" of "Fixed the parser bug, which was in the parser".
 */
const CONTINUATION = /^(which|that|because|so|but|and then)\b/i;

interface DescriptionLine {
  text: string;
  isBullet: boolean;
}

/**
 * Splits a task description into its task fragments.
 *
 * A description is written as free text and may enumerate its fragments either as a bullet list
 * or as a comma separated list, never both. A bullet list is therefore never split on commas,
 * because a comma inside a bullet is part of that bullet.
 *
 * @param description the free text body of a task
 * @returns the task fragments found in the description
 */
export function parseTaskDescription(description: string): string[] {
  if (!description) return [];

  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const content: DescriptionLine[] = [];

  for (const line of lines) {
    const bullet = line.match(BULLET_MARKER);
    let text = bullet ? bullet[1] : line;

    text = text
      // Remove initial characters that are not alphabet or number
      .replace(/^[^a-zA-Z0-9]*/, "")
      // Remove status at the beginning: "Done -> task", "Done - task"
      .replace(STATUS_REGEX_END, "")
      .replace(STATUS_REGEX_START, "")
      .trim();

    // A line that is only a link is not a task
    if (!text || text.startsWith("http")) continue;

    content.push({ text, isBullet: bullet !== null });
  }

  // If no structured tasks found, treat the whole description as one task
  if (content.length === 0) {
    return description.trim() ? [description.trim()] : [];
  }

  // A description has exactly one list style: bullet or comma separated.
  const isBulletList = content.some((line) => line.isBullet);

  const fragments: string[] = [];

  for (const line of content) {
    if (isBulletList) {
      fragments.push(line.text);
      continue;
    }

    for (const part of line.text.split(",")) {
      const trimmed = part.trim();
      if (trimmed) fragments.push(trimmed);
    }
  }

  const standalone = fragments.filter((fragment) => !CONTINUATION.test(fragment));

  if (standalone.length > 0) return standalone;

  // Every fragment continues the previous one, keep them rather than losing the text
  return fragments;
}
