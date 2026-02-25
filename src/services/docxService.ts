import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, LevelFormat } from "docx";
import { saveAs } from "file-saver";

export async function downloadAsDocx(markdown: string, title: string = "CrystalNotes") {
  const lines = markdown.split("\n");
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Check for the special title line
    const isMainTitle = line.startsWith("# TITLE:");
    const isHeader = line.startsWith("**") && line.endsWith("**");
    const cleanLine = line.replace("# TITLE:", "").replace(/\*\*/g, "").replace(/<u>/g, "").replace(/<\/u>/g, "").trim();
    
    // Determine indentation level
    const indentMatch = line.match(/^(\s*)-/);
    const isBullet = !!indentMatch;
    const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 4) : 0;

    if (isMainTitle) {
      children.push(
        new Paragraph({
          text: cleanLine,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        })
      );
    } else if (isHeader) {
      children.push(
        new Paragraph({
          text: cleanLine,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (isBullet) {
      // Handle bold and underline within bullets
      const parts = parseLine(line.trim().substring(1).trim());
      
      children.push(
        new Paragraph({
          children: parts,
          numbering: {
            reference: "hyphen-bullets",
            level: Math.min(indentLevel, 8), // docx supports up to 9 levels (0-8)
          },
          spacing: { before: 40, after: 40 },
        })
      );
    } else {
      // Regular text or question headers
      const isQuestion = cleanLine.includes("?");
      const parts = parseLine(line.trim());

      children.push(
        new Paragraph({
          children: parts,
          heading: isQuestion ? HeadingLevel.HEADING_2 : undefined,
          spacing: { before: 120, after: 80 },
        })
      );
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "hyphen-bullets",
          levels: Array.from({ length: 9 }, (_, i) => ({
            level: i,
            format: LevelFormat.BULLET,
            text: "-",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: (i + 1) * 720, hanging: 360 },
              },
            },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, "_")}.docx`);
}

function parseLine(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Simple regex to find **bold** and <u>underline</u>
  // This is a basic parser and might need refinement for complex nesting
  const regex = /(\*\*.*?\*\*|<u>.*?<\/u>)/g;
  const parts = text.split(regex);

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith("<u>") && part.endsWith("</u>")) {
      runs.push(new TextRun({ text: part.slice(3, -4), underline: {} }));
    } else if (part) {
      runs.push(new TextRun({ text: part }));
    }
  }

  return runs;
}
