"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hyakuninData, type Poem } from "@/lib/poems";
import { Shuffle, RefreshCw, Volume2, VolumeX, Play, CheckCircle } from "lucide-react";

// ゲームの状態
type GameState = "start" | "playing" | "result";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [handCards, setHandCards] = useState<Poem[]>([]);
  const [displayedText, setDisplayedText] = useState("");
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(400); // ミリ秒/文字
  const [canStartReading, setCanStartReading] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const readingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const readingIndexRef = useRef(0);

  // デバッグ用
  useEffect(() => {
    console.log("Hyakunin data available:", hyakuninData.length, "poems");
    if (hyakuninData.length > 0) {
      console.log("First poem:", hyakuninData[0]);
    }
  }, []);

  // ゲーム開始
  const startGame = useCallback(() => {
    setScore(0);
    setTotalQuestions(0);
    setGameState("playing");
    setCanStartReading(false);
    setDisplayedText("");
    setIsReading(false);
    setShowCorrectEffect(false);
    readingIndexRef.current = 0;
    if (readingIntervalRef.current) clearInterval(readingIntervalRef.current);
    nextTurn();
  }, []);

  // 次の問題へ
  const nextTurn = useCallback(() => {
    // 既存のインターバルをクリア
    if (readingIntervalRef.current) clearInterval(readingIntervalRef.current);

    if (!hyakuninData || hyakuninData.length === 0) {
      console.error("No valid poem data available");
      return;
    }

    // 全データからランダムに1つ選ぶ（正解の札）
    const randomIndex = Math.floor(Math.random() * hyakuninData.length);
    const targetPoem = hyakuninData[randomIndex];

    if (!targetPoem) {
      console.error("Invalid poem data at index:", randomIndex);
      return;
    }

    console.log("Selected poem:", targetPoem.kamiNoKu, targetPoem.shimoNoKu);
    setCurrentPoem(targetPoem);

    // 手札を生成（正解を含む10枚）
    // 手札は下の句（shimoNoKu）で表示
    const otherPoems = hyakuninData.filter((p) => p.id !== targetPoem.id);
    const shuffledOthers = [...otherPoems].sort(() => 0.5 - Math.random());
    const hand = [targetPoem, ...shuffledOthers.slice(0, 9)];
    // 手札をシャッフル
    setHandCards(hand.sort(() => 0.5 - Math.random()));

    // 読み上げリセット
    setDisplayedText("");
    setIsReading(false);
    setShowCorrectEffect(false);
    readingIndexRef.current = 0;
    setCanStartReading(true);
  }, []);

  // 読み上げ開始
  const startReading = useCallback(() => {
    if (!currentPoem || isReading) return;

    setDisplayedText("");
    readingIndexRef.current = 0;
    setIsReading(true);
  }, [currentPoem, isReading]);

  // 読み上げ処理
  useEffect(() => {
    if (!isReading || !currentPoem) return;

    // 上の句と下の句を合わせた全文を読み上げ
    const fullText = currentPoem.kamiNoKu + " " + currentPoem.shimoNoKu;

    if (!fullText || typeof fullText !== "string" || fullText.length === 0) {
      console.error("Invalid poem text:", fullText, "Type:", typeof fullText);
      setIsReading(false);
      return;
    }

    console.log("Starting reading:", fullText);

    // 既存のインターバルをクリア
    if (readingIntervalRef.current) clearInterval(readingIntervalRef.current);

    readingIntervalRef.current = setInterval(() => {
      if (readingIndexRef.current < fullText.length) {
        const char = fullText[readingIndexRef.current];
        setDisplayedText((prev) => prev + char);
        readingIndexRef.current++;
      } else {
        if (readingIntervalRef.current) clearInterval(readingIntervalRef.current);
        setIsReading(false);
      }
    }, readingSpeed);

    return () => {
      if (readingIntervalRef.current) clearInterval(readingIntervalRef.current);
    };
  }, [isReading, currentPoem, readingSpeed]);

  // カード選択
  const selectCard = useCallback(
    (selectedPoem: Poem) => {
      setTotalQuestions((prev) => prev + 1);

      if (selectedPoem.id === currentPoem?.id) {
        setScore((prev) => prev + 1);
        setShowCorrectEffect(true);
        // 正解時の処理
        setTimeout(() => {
          nextTurn();
        }, 1500);
      } else {
        // 不正解時の処理
        setGameState("result");
      }
    },
    [currentPoem, nextTurn]
  );

  // 手札をシャッフル
  const shuffleHand = useCallback(() => {
    setHandCards((prev) => [...prev].sort(() => 0.5 - Math.random()));
  }, []);

  // パス（スキップ）
  // const passQuestion = useCallback(() => {
  //   nextTurn();
  // }, [nextTurn]);

  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // スペースキーで読み上げ開始
      if (e.code === "Space" && gameState === "playing" && canStartReading && !isReading) {
        e.preventDefault();
        startReading();
        return;
      }

      // 不正解時からの復帰
      if (e.code === "Space" && gameState === "result"){
        e.preventDefault();
        setGameState("playing");
        nextTurn();
        return;
      }

      if (gameState !== "playing" || !handCards.length) return;

      const key = e.key;
      const keyIndex = key === "0" ? 9 : parseInt(key) - 1;

      if (keyIndex >= 0 && keyIndex < handCards.length) {
        selectCard(handCards[keyIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, handCards, selectCard, canStartReading, isReading, startReading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* ヘッダー */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2">百人一首</h1>
            <p className="text-slate-400 text-sm">雅な心で札を取る</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm mb-1">得点</p>
            <p className="text-3xl font-bold text-amber-400">
              {score} / {totalQuestions}
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-12">
        {gameState === "start" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8">
              <h2 className="text-5xl font-bold text-amber-300">いざ、勝負。</h2>
              <div className="space-y-4 text-slate-300 text-lg">
                <p>まず手札の内容を確認してください。</p>
                <p>準備ができたら「札を読む」ボタンで読み上げを開始します。</p>
                <p>（スペースキーでも開始できます）</p>
                <p>対応する下の句の札を選んでください。</p>
                <p>キーボードの数字キー（1〜0）でも操作できます。</p>
              </div>
              <Button
                onClick={startGame}
                className="px-12 py-6 text-xl bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold"
              >
                ゲーム開始
              </Button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-8">
            {/* 読み上げ表示 */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-amber-300 min-h-16 flex items-center justify-center">
                    {displayedText || "..."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* コントロールボタン */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={startReading}
                disabled={!canStartReading || isReading}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Play size={18} />
                札を読む
              </Button>
              <Button
                onClick={shuffleHand}
                variant="outline"
                className="gap-2 border-slate-600 text-white hover:bg-slate-700"
              >
                <Shuffle size={18} />
                手札を混ぜる
              </Button>
              <Button
                // onClick={passQuestion}
                onClick={() => setGameState("result")}
                variant="outline"
                className="gap-2 border-slate-600 text-white hover:bg-slate-700"
              >
                <RefreshCw size={18} />
                パスする
              </Button>
            </div>

            {/* 手札表示 */}
            <div className="grid grid-cols-5 gap-4 relative">
              {handCards.map((card, index) => (
                <button
                  key={`${card.id}-${index}`}
                  onClick={() => selectCard(card)}
                  className="group relative h-48 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 overflow-hidden"
                >
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1 === 10 ? "0" : index + 1}
                  </div>
                  <div className="p-4 h-full flex flex-col justify-between">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-2">{card.author}</p>
                    </div>
                    <div className="text-center flex-1 flex items-center justify-center">
                      <p className="text-sm text-slate-800 font-semibold leading-relaxed">
                        {card.shimoNoKu}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* 正解エフェクト */}
              {showCorrectEffect && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="mb-4 animate-bounce">
                      <CheckCircle size={80} className="text-green-400 mx-auto" />
                    </div>
                    <p className="text-3xl font-bold text-green-400">正解！</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === "result" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-red-400 mb-4">残念...</h2>
                  <p className="text-slate-300 mb-6">正解は以下の札でした：</p>
                </div>

                {currentPoem && (
                  <div className="bg-slate-700 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-lg text-white">{currentPoem.id + "番\t" + currentPoem.kimariji.length + "字決まり"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-2">上の句</p>
                        <p className="text-lg text-white">
                        {(() => {
                          const text = currentPoem.kamiNoKu ?? "";
                          const keep = currentPoem.kimariji?.length ?? 0;
                          const k = Math.max(0, Math.min(keep, text.length));
                          return (
                          <>
                            <span className="text-amber-400">{text.slice(0, k)}</span>
                            <span>{text.slice(k)}</span>
                          </>
                          );
                        })()}
                        </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-2">下の句</p>
                      <p className="text-lg text-white">{currentPoem.shimoNoKu}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-2">作者</p>
                      <p className="text-white">{currentPoem.author}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setGameState("playing");
                      nextTurn();
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    次の問題へ
                  </Button>
                  <Button
                    onClick={() => setGameState("start")}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    ゲーム終了
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
