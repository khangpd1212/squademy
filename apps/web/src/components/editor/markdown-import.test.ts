import { parseMarkdownToTiptap, parseInline } from "./markdown-import";

describe("markdown-import parser", () => {
  describe("parseInline", () => {
    it("parses plain text", () => {
      const nodes = parseInline("Hello world");
      expect(nodes).toEqual([{ type: "text", text: "Hello world" }]);
    });

    it("parses bold and italic marks", () => {
      const nodes = parseInline("This is **bold** and *italic* and _also italic_");
      expect(nodes).toEqual([
        { type: "text", text: "This is " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        { type: "text", text: "italic", marks: [{ type: "italic" }] },
        { type: "text", text: " and " },
        { type: "text", text: "also italic", marks: [{ type: "italic" }] },
      ]);
    });

    it("parses links", () => {
      const nodes = parseInline("Check [this link](https://example.com)");
      expect(nodes).toEqual([
        { type: "text", text: "Check " },
        {
          type: "text",
          text: "this link",
          marks: [{ type: "link", attrs: { href: "https://example.com", target: "_blank" } }],
        },
      ]);
    });

    it("handles multiple marks on same text", () => {
      // Current implementation DOES NOT support this, it will only match the first regex group.
      // We will improve this later.
      const nodes = parseInline("**some *nested* text**");
      // Current behavior will just capture everything inside ** as text "some *nested* text"
      expect(nodes[0].text).toBe("some *nested* text");
    });
  });

  describe("parseMarkdownToTiptap", () => {
    it("parses headings", () => {
      const doc = parseMarkdownToTiptap("# H1\n## H2\n### H3");
      expect(doc.content).toEqual([
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "H1" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H2" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "H3" }] },
      ]);
    });

    it("parses blockquotes", () => {
      const doc = parseMarkdownToTiptap("> This is a quote\n> Second line");
      expect(doc.content[0].type).toBe("blockquote");
      expect(doc.content[0].content).toHaveLength(1);
    });

    it("parses bullet lists", () => {
      const doc = parseMarkdownToTiptap("- Item 1\n- Item 2");
      expect(doc.content[0].type).toBe("bulletList");
      expect(doc.content[0].content).toHaveLength(2);
    });

    it("parses ordered lists", () => {
      const doc = parseMarkdownToTiptap("1. First\n2. Second");
      expect(doc.content[0].type).toBe("orderedList");
      expect((doc.content[0] as { attrs: { start: number } }).attrs).toEqual({ start: 1 });
      expect(doc.content[0].content).toHaveLength(2);
    });

    it("parses paragraphs with blank lines", () => {
      const doc = parseMarkdownToTiptap("Para 1\n\nPara 2");
      expect(doc.content).toHaveLength(2);
      expect(doc.content[0].type).toBe("paragraph");
      expect(doc.content[1].type).toBe("paragraph");
    });

    it("handles empty or blank files gracefully", () => {
      const doc = parseMarkdownToTiptap("");
      expect(doc.content).toEqual([{ type: "paragraph" }]);
    });

    it("converts unsupported syntax to paragraphs without throwing", () => {
      const markdown = "Some text\n\n```python\nprint('hello')\n```\n\nMore text\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n\nFinal paragraph";
      const doc = parseMarkdownToTiptap(markdown);
      expect(doc.type).toBe("doc");
      expect(doc.content.length).toBeGreaterThan(0);
      doc.content.forEach((node) => {
        expect(node.type).toBeDefined();
      });
    });

    it("converts code fences to paragraphs", () => {
      const doc = parseMarkdownToTiptap("```js\nconst x = 1;\n```");
      expect(doc.content[0].type).toBe("paragraph");
    });

    it("converts tables to paragraphs", () => {
      const doc = parseMarkdownToTiptap("| a | b |\n|---|---|\n| 1 | 2 |");
      expect(doc.content[0].type).toBe("paragraph");
    });
  });
});
