import JSZip from "jszip";
import initSqlJs, { type SqlJsStatic } from "sql.js";

let SQL: SqlJsStatic | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!SQL) {
    const wasmResponse = await fetch("/sql-wasm/sql-wasm.wasm");
    const wasmBinary = await wasmResponse.arrayBuffer();
    SQL = await initSqlJs({
      wasmBinary,
    });
  }
  return SQL;
}

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

  const allDbFiles = Object.keys(zip.files).filter((name) => 
    name.includes("collection") || name.includes(".db")
  );
  console.log("Files in APK:", allDbFiles);

  const dbFiles = zip.file(/collection\.anki2[0-9]?$/);
  const dbFile = dbFiles?.length 
    ? dbFiles[0] 
    : zip.file("collection.db") 
    || zip.file("collection.anki2")
    || zip.file(/collection\.anki21?$/)[0];
  
  if (!dbFile) {
    console.log("Available files:", allDbFiles);
    throw new Error("Could not find database in Anki package");
  }

  const dbData = await dbFile.async("uint8array");
  const sqljs = await getSqlJs();
  const db = new sqljs.Database(dbData);

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
