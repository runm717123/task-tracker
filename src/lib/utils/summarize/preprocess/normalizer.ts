/**
 * Converts an ITrackedTask array to a parsed task array
 */
export function normalizeTasks(tasks: ITrackedTask[]): IParsedTask[] {
  return tasks.map((task) => {
    const title = normalizeTitle(task.title) || "General Task";

    return {
      title,
      displayTitle: task.title.trim() || title,
      description: normalizeSentence(task.description || title),
    };
  });
}

export function normalizeSentence(sentence: string): string {
  // any text in the key replaced by the value
  const map = {
    " pr ": " pull request ",
    "self-explore": "self explore",
  };
  Object.entries(map).forEach(([key, value]) => {
    sentence = sentence.replace(new RegExp(key, "gi"), value);
  });

  return sentence.trim();
}

/**
 * Reduces a title to the form used to decide that two titles name the same thing.
 *
 * Two tasks with the same normalized title belong to the same summary group, even when they were
 * written with different casing or trailing punctuation.
 */
export function normalizeTitle(title: string): string {
  return normalizeSentence(title)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?,;:]+$/, "");
}
