import { parseMarkdownToTiptap, parseInline, preprocessLiteralMarkdown, tiptapDocToHtml } from "./markdown-import";

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

  describe("literal mode", () => {
    describe("parseInline in literal mode", () => {
      it("returns text as-is without parsing marks", () => {
        const nodes = parseInline("**bold** and *italic*", "literal");
        expect(nodes).toEqual([{ type: "text", text: "**bold** and *italic*" }]);
      });
    });

    describe("preprocessLiteralMarkdown", () => {
      it("escapes bold markers", () => {
        const result = preprocessLiteralMarkdown("This is **bold** text");
        expect(result).toContain("\u200B**\u200Bbold\u200B**\u200B");
      });

      it("does not escape single asterisks", () => {
        const result = preprocessLiteralMarkdown("This is *italic* text");
        expect(result).toBe("This is *italic* text");
      });

      it("preserves underscores for italic detection", () => {
        const result = preprocessLiteralMarkdown("This is _italic_ text");
        expect(result).toBe("This is _italic_ text");
      });

      it("preserves blockquote markers", () => {
        const result = preprocessLiteralMarkdown("> Quote text");
        expect(result).toBe("> Quote text");
      });

      it("preserves list markers", () => {
        const result = preprocessLiteralMarkdown("- Bullet item\n* Another item");
        expect(result).toContain("- Bullet item");
        expect(result).toContain("* Another item");
      });

      it("adds paragraph breaks between lines", () => {
        const result = preprocessLiteralMarkdown("Line 1\nLine 2");
        expect(result).toBe("Line 1\n\nLine 2");
      });

      it("handles mixed content", () => {
        const result = preprocessLiteralMarkdown("**bold**\n\nNormal text with _italic_");
        expect(result).toContain("\u200B**\u200B");
        expect(result).toContain("_italic_");
      });
    });

    describe("parseMarkdownToTiptap in literal mode", () => {
      it("creates separate paragraphs for each line", () => {
        const doc = parseMarkdownToTiptap("Line 1\nLine 2\nLine 3", "literal");
        expect(doc.content).toHaveLength(3);
        expect(doc.content[0].type).toBe("paragraph");
        expect(doc.content[1].type).toBe("paragraph");
        expect(doc.content[2].type).toBe("paragraph");
      });

      it("preserves markdown syntax as plain text", () => {
        const doc = parseMarkdownToTiptap("**bold text**", "literal");
        expect(doc.content[0].content).toEqual([
          { type: "text", text: "\u200B**\u200Bbold text\u200B**\u200B" }
        ]);
      });

      it("does not parse headings as headings", () => {
        const doc = parseMarkdownToTiptap("# Heading text", "literal");
        expect(doc.content).toHaveLength(1);
        expect(doc.content[0].type).toBe("paragraph");
      });

      it("handles empty input gracefully", () => {
        const doc = parseMarkdownToTiptap("", "literal");
        expect(doc.content).toEqual([{ type: "paragraph" }]);
      });

      it("skips blank lines", () => {
        const doc = parseMarkdownToTiptap("Text 1\n\n\nText 2", "literal");
        expect(doc.content).toHaveLength(2);
      });

      it("detects blockquote with italic as card", () => {
        const doc = parseMarkdownToTiptap("> _Nền tảng: Hãy thành thạo_", "literal");
        expect(doc.content).toHaveLength(1);
        expect(doc.content[0].type).toBe("blockquoteCard");
      });

      it("detects blockquote without italic as title", () => {
        const doc = parseMarkdownToTiptap("> IELTS WRITING MASTERY", "literal");
        expect(doc.content).toHaveLength(1);
        expect(doc.content[0].type).toBe("blockquoteTitle");
      });

      it("detects blockquote with # as title", () => {
        const doc = parseMarkdownToTiptap("> # IELTS WRITING MASTERY", "literal");
        expect(doc.content).toHaveLength(1);
        expect(doc.content[0].type).toBe("blockquoteTitle");
      });
    });

    describe("tiptapDocToHtml (literal mode)", () => {
      it("converts blockquoteCard with literal underscores", () => {
        const doc = parseMarkdownToTiptap("> _Nền tảng_", "literal");
        const html = tiptapDocToHtml(doc);
        expect(html).toContain('data-blockquote="card"');
        expect(html).toContain("_Nền tảng_");
      });

      it("converts blockquoteTitle with uppercase", () => {
        const doc = parseMarkdownToTiptap("> IELTS WRITING", "literal");
        const html = tiptapDocToHtml(doc);
        expect(html).toContain('data-blockquote="title"');
        expect(html).toContain("IELTS WRITING");
      });
    });

    // Note: tiptapDocToViewHtml tests removed - view mode now uses react-markdown directly
  });
});
