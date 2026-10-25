# Task Tracker

A browser extension that records the work you do during the day and shows it back to you as a
grouped, de-duplicated view of a time range.

## Language

**Task**:
A single tracked unit of work, with a title and a free-text description.
_Avoid_: Activity, Entry, Item

**Task description**:
The free-text body of a task, written in a text area. It may enumerate several task fragments,
either as a bullet list or as a comma-separated list, but never both.
_Avoid_: Notes, Body, Details

**Task fragment**:
One actionable unit of work extracted from a task's description. A task may yield several fragments.
_Avoid_: Subtask, Bullet, Line

**List style**:
The way a task description enumerates its task fragments: a bullet list, or a comma-separated list.
A description has exactly one list style.
_Avoid_: Format, Syntax

**Normalized title**:
The canonical form of a task title, used to decide that two titles name the same thing.
_Avoid_: Canonical title, Key

**Summary group**:
A set of task fragments that share a normalized title, presented together under one heading.
_Avoid_: Cluster, Bucket, Category

**Near-duplicate fragment**:
A task fragment that describes the same work as another fragment but words it differently. Exactly
one fragment of each set of near-duplicates is kept.
_Avoid_: Similar fragment, Duplicate

**Summary**:
The grouped, de-noised view of the tasks in a time range. It contains no generated text: every line
in it is the user's own wording.
_Avoid_: Report, Digest
