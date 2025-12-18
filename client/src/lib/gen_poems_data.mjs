import fs from "fs";

const inputPath = "./hyakunin_isshu_data.json";
const outputPath = "./poems_data.ts";

// JSON 読み込み
const raw = fs.readFileSync(inputPath, "utf-8");
const data = JSON.parse(raw);

// 必要なキーだけを整形（順序も固定）
const poems = data.map(p => ({
  id: p.id,
  kamiNoKu: p.kamiNoKu,
  shimoNoKu: p.shimoNoKu,
  kamiNoKuKana: p.kamiNoKuKana,
  shimoNoKuKana: p.shimoNoKuKana,
  kimariji: p.kimariji,
  author: p.author,
  authorKana: p.authorKana,
  imageURL: p.imageURL ?? ""
}));

const ts = `// このファイルは JSON から自動生成されています
// 手動編集しないでください
import type { Poem } from "./poems";

export const hyakuninData: Poem[] = ${JSON.stringify(poems, null, 2)} as const;
`;

fs.writeFileSync(outputPath, ts, "utf-8");

console.log("poems_data.ts generated successfully");
