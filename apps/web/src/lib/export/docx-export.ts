import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  NumberFormat,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

function createParagraph(node: TiptapNode): Paragraph {
  const runs: TextRun[] = [];

  if (!node?.content) {
    runs.push(new TextRun({ text: "" }));
    return new Paragraph({ children: runs });
  }

  for (const child of node.content) {
    if (child.type === "text") {
      const marks = child.marks || [];
      const isBold = marks.some((m) => m.type === "bold");
      const isItalic = marks.some((m) => m.type === "italic");
      const isUnderline = marks.some((m) => m.type === "underline");
      const linkMark = marks.find((m) => m.type === "link");

      runs.push(
        new TextRun({
          text: child.text || "",
          bold: isBold,
          italics: isItalic,
          underline: isUnderline ? {} : undefined,
          ...(linkMark?.attrs?.href
            ? { link: linkMark.attrs.href as string }
            : {}),
        }),
      );
    } else if (child.type === "hardBreak") {
      runs.push(new TextRun({ text: "", break: 1 }));
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: "" }));
  }

  return new Paragraph({ children: runs });
}

function createListItem(node: TiptapNode, isOrdered: boolean): Paragraph {
  const runs: TextRun[] = [];

  if (node.content) {
    for (const child of node.content) {
      if (child.type === "text") {
        const marks = child.marks || [];
        runs.push(
          new TextRun({
            text: child.text || "",
            bold: marks.some((m) => m.type === "bold"),
            italics: marks.some((m) => m.type === "italic"),
          }),
        );
      }
    }
  }

  return new Paragraph({
    children: runs,
    numbering: {
      reference: isOrdered ? "ordered-list" : "bullet-list",
      level: 0,
    },
  });
}

function getHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    default:
      return HeadingLevel.HEADING_1;
  }
}

function processContent(node: TiptapNode): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (!node.content) return paragraphs;

  for (const child of node.content) {
    switch (child.type) {
      case "heading": {
        const level = (child.attrs?.level as number) || 1;
        const headingLevel = getHeadingLevel(level);

        const runs: TextRun[] = [];
        if (child.content) {
          for (const textNode of child.content) {
            if (textNode.type === "text" && textNode.text) {
              const marks = textNode.marks || [];
              runs.push(
                new TextRun({
                  text: textNode.text,
                  bold: marks.some((m) => m.type === "bold"),
                  italics: marks.some((m) => m.type === "italic"),
                }),
              );
            }
          }
        }

        paragraphs.push(
          new Paragraph({
            children: runs,
            heading: headingLevel,
            spacing: { before: 200, after: 100 },
          }),
        );
        break;
      }

      case "paragraph": {
        paragraphs.push(createParagraph(child));
        break;
      }

      case "bulletList": {
        for (const listItem of child.content || []) {
          if (listItem.type === "listItem") {
            paragraphs.push(createListItem(listItem, false));
          }
        }
        break;
      }

      case "orderedList": {
        for (const listItem of child.content || []) {
          if (listItem.type === "listItem") {
            paragraphs.push(createListItem(listItem, true));
          }
        }
        break;
      }

      case "blockquote": {
        const text = extractText(child);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                italics: true,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
        );
        break;
      }

      case "codeBlock": {
        const text = extractText(child);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                font: "Courier New",
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
        );
        break;
      }

      case "horizontalRule": {
        paragraphs.push(new Paragraph({ children: [] }));
        break;
      }
    }
  }

  return paragraphs;
}

function extractText(node: TiptapNode): string {
  if (!node.content) return "";
  return node.content
    .map((child) => {
      if (child.type === "text") return child.text || "";
      if (child.content) return extractText(child);
      return "";
    })
    .join("");
}

export async function downloadDocx(
  lessonTitle: string,
  content: string,
  filename: string,
): Promise<void> {
  if (typeof document === "undefined") return;

  let tiptapJson: TiptapNode;

  try {
    tiptapJson = JSON.parse(content);
  } catch {
    tiptapJson = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: content }],
        },
      ],
    };
  }

  const paragraphs = processContent(tiptapJson);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            { level: 0, format: NumberFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START },
          ],
        },
        {
          reference: "bullet-list",
          levels: [
            { level: 0, format: NumberFormat.BULLET, text: "\u2022", alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: lessonTitle,
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 },
          }),
          ...paragraphs,
        ],
      },
    ],
    creator: "Squademy",
  });

  const buffer = await Packer.toBlob(doc);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}