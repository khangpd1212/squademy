import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockquoteTitle: {
      toggleBlockquoteTitle: () => ReturnType;
    };
  }
}

export const BlockquoteTitle = Node.create({
  name: "blockquoteTitle",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: 'h2[data-blockquote="title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h2",
      mergeAttributes(HTMLAttributes, { "data-blockquote": "title" }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleBlockquoteTitle:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
    };
  },
});
