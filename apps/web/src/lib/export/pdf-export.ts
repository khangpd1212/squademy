import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadPdf(
  lessonTitle: string,
  contentHtml: string,
  filename: string,
): Promise<void> {
  const container = document.createElement("div");
  // Note: contentHtml comes from Tiptap editor which sanitizes input.
  // If content comes from external sources, add DOMPurify sanitization.
  container.innerHTML = contentHtml;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "595px";
  container.style.padding = "40px";
  container.style.fontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  container.style.fontSize = "12px";
  container.style.lineHeight = "1.6";
  container.style.color = "#000";
  container.style.backgroundColor = "#fff";

  const style = document.createElement("style");
  style.textContent = `
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px 0; }
    h2 { font-size: 20px; font-weight: 600; margin: 16px 0 12px 0; }
    h3 { font-size: 16px; font-weight: 600; margin: 12px 0 8px 0; }
    p { margin: 0 0 12px 0; }
    ul, ol { margin: 0 0 12px 0; padding-left: 24px; }
    li { margin-bottom: 4px; }
    a { color: #0066cc; text-decoration: underline; }
    blockquote { border-left: 3px solid #ccc; padding-left: 16px; margin: 12px 0; font-style: italic; }
    code { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 2px 4px; }
    pre { background: #f5f5f5; padding: 12px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  `;
  container.appendChild(style);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    const position = -margin;

    pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      const currentPageHeight = pdf.internal.pageSize.getHeight();
      const remainingOnPage = currentPageHeight - margin * 2;
      if (heightLeft > remainingOnPage) {
        pdf.addImage(imgData, "PNG", margin, -margin, contentWidth, contentHeight);
      } else {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, contentHeight);
      }
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}