import { hyakuninData as importedData } from "./poems_data";

export type Poem = {
  id: number;
  kamiNoKu: string;
  shimoNoKu: string;
  kamiNoKuKana: string;
  shimoNoKuKana: string;
  kimariji: string;
  author: string;
  authorKana: string;
  imageURL: string;
};

// 型安全なデータ処理
export const hyakuninData: Poem[] = Array.isArray(importedData)
  ? importedData.filter(
      (item: any): item is Poem =>
        item &&
        typeof item.id === "number" &&
        typeof item.kamiNoKu === "string" &&
        item.kamiNoKu.length > 0 &&
        typeof item.shimoNoKu === "string" &&
        item.shimoNoKu.length > 0
    )
  : [];

// デバッグ用
if (typeof window !== "undefined") {
  (window as any).__HYAKUNIN_DATA__ = hyakuninData;
  console.log("Hyakunin data loaded:", hyakuninData.length, "items");
  if (hyakuninData.length > 0) {
    console.log("First item:", hyakuninData[0]);
  }
}
