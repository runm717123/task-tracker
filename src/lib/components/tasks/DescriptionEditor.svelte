<script lang="ts">
  import { onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import Document from "@tiptap/extension-document";
  import Paragraph from "@tiptap/extension-paragraph";
  import Text from "@tiptap/extension-text";
  import { BulletList, ListItem, ListKeymap } from "@tiptap/extension-list";
  import { UndoRedo } from "@tiptap/extensions";
  import { Markdown } from "@tiptap/markdown";

  let {
    value = $bindable(""),
    disabled = false,
    onSave,
  }: {
    value?: string;
    disabled?: boolean;
    onSave: () => void;
  } = $props();

  const labelId = $props.id();
  let host: HTMLDivElement;
  let editor = $state<Editor>();
  let bulletsActive = $state(false);
  let lastValue = "";

  export function focus() {
    editor?.view.dom.focus();
  }

  onMount(() => {
    lastValue = value;
    const instance = new Editor({
      element: host,
      extensions: [Document, Paragraph, Text, BulletList, ListItem, ListKeymap, UndoRedo, Markdown],
      content: value,
      contentType: "markdown",
      editable: !disabled,
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-labelledby": labelId,
          "aria-multiline": "true",
          "aria-keyshortcuts": "d Control+Enter Meta+Enter",
        },
        handleKeyDown: (_view, event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            !event.altKey &&
            !event.isComposing &&
            !event.repeat
          ) {
            event.preventDefault();
            if (!disabled) onSave();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        lastValue = editor.getMarkdown();
        value = lastValue;
      },
      onTransaction: ({ editor }) => {
        bulletsActive = editor.isActive("bulletList");
      },
    });
    editor = instance;
    return () => instance.destroy();
  });

  $effect(() => {
    if (editor && value !== lastValue) {
      lastValue = value;
      editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }
  });

  $effect(() => {
    editor?.setEditable(!disabled);
  });
</script>

<div class="description-field">
  <span id={labelId}>description</span>
  <div class="description-editor">
    <div class="editor-toolbar">
      <button
        type="button"
        class="text-button"
        aria-label="Bullet list"
        aria-pressed={bulletsActive}
        aria-keyshortcuts="Control+Shift+8 Meta+Shift+8"
        title="Bullet list (Ctrl/Cmd+Shift+8)"
        disabled={disabled || !editor}
        onmousedown={(event) => event.preventDefault()}
        onclick={() => editor?.chain().focus().toggleBulletList().run()}>• list</button
      >
      <span class="muted">ctrl/cmd+enter saves</span>
    </div>
    <div class="editor-host" bind:this={host}></div>
  </div>
</div>

<style>
  .description-field {
    display: flex;
    flex-direction: column;
    gap: 0.2lh;
    flex: 1;
    min-height: 7lh;
  }
  .description-field > span {
    color: var(--foreground2);
  }
  .description-editor {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: var(--background2);
    color: var(--foreground0);
  }
  .editor-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1ch;
  }
  button[aria-pressed="true"] {
    color: var(--accent);
    background: var(--background1);
  }
  .editor-host {
    display: flex;
    flex: 1;
  }
  .editor-host :global(.tiptap) {
    flex: 1;
    min-width: 0;
    min-height: 5lh;
    padding: 0.3lh 1ch;
    outline: none;
    overflow-wrap: anywhere;
    caret-color: var(--accent);
  }
  .editor-host :global(.tiptap:focus) {
    box-shadow: inset 2px 0 var(--focus);
  }
  .editor-host :global(p) {
    margin: 0;
    min-height: 1lh;
  }
  .editor-host :global(ul) {
    list-style: disc;
    margin: 0;
    padding-left: 3ch;
  }
</style>
