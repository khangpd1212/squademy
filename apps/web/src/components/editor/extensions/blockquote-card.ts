import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockquoteCard: {
      toggleBlockquoteCard: () => ReturnType;
    };
  }
}

export const BlockquoteCard = Node.create({
  name: "blockquoteCard",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: 'div[data-blockquote="card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-blockquote": "card" }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleBlockquoteCard:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
    };
  },
});
