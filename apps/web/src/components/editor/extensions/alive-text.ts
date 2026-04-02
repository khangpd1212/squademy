import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aliveText: {
      toggleAliveText: () => ReturnType;
    };
  }
}

export const AliveText = Node.create({
  name: "alive_text",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      hidden: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="alive-text"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "alive-text" }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleAliveText:
        () =>
        ({ commands }) => {
          return commands.toggleWrap("alive_text");
        },
    };
  },
});
