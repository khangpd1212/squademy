import JSZip from "jszip";
import initSqlJs from "sql.js";

export interface AnkiParsedCard {
  front: string;
  back?: string;
  pronunciation?: string;
  exampleSentence?: string;
  tags?: string[];
  extraNotes?: string;
}

export async function parseAnkiDeck(file: File): Promise<AnkiParsedCard[]> {
  const zip = await JSZip.loadAsync(file);

  const dbFiles = zip.file(/collection\.anki2[0-9]$/);
  const dbFile = dbFiles?.length ? dbFiles[0] : zip.file("collection.db");
  if (!dbFile) {
    throw new Error("Could not find database in Anki package");
  }

  const dbData = await dbFile.async("uint8array");
  const SQL = await initSqlJs();
  const db = new SQL.Database(dbData);

  try {
    const results = db.exec("SELECT flds, tags FROM notes");
    if (!results.length || !results[0].values.length) {
      return [];
    }

    return results[0].values.map((row) => {
      const flds = String(row[0] ?? "");
      const tags = String(row[1] ?? "");
      const fields = flds.split("\x1f");

      return {
        front: fields[0]?.trim() || "",
        back: fields[1]?.trim() || undefined,
        pronunciation: fields[2]?.trim() || undefined,
        exampleSentence: fields[3]?.trim() || undefined,
        tags:
          tags.split(" ").filter(Boolean).length > 0
            ? tags.split(" ")
            : undefined,
        extraNotes: fields.slice(4).filter(Boolean).join(" | ") || undefined,
      };
    });
  } finally {
    db.close();
  }
}
