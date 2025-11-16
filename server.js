import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path"; 
import admin from "firebase-admin";
import fs from "fs";

// 環境変数読み込み
dotenv.config();

// Firebaseサービスアカウント読み込み
let serviceAccount;
try {
  const serviceAccountString = process.env.FIREBASE_CREDENTIALS;
  // Render環境でJSON文字列が正しく読み込まれるための処理
  const cleanedString = serviceAccountString.replace(/\\n/g, '\n'); 
  serviceAccount = JSON.parse(cleanedString); 
  console.log("✅ 認証情報パース結果: 成功 (Project ID:", serviceAccount.project_id, ")");
} catch (error) {
  // 認証情報の読み込み失敗を明確にログ出力
  console.error("🔥🔥🔥 デバッグログ: 認証情報の読み込み・パースに失敗 🔥🔥🔥");
  console.error("原因:", error.message);
}

// Firebase初期化（serviceAccountがundefinedでなければ初期化）
if (!admin.apps.length && serviceAccount) { // serviceAccountが存在する場合のみ初期化
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDKの初期化を試行しました。");
}

const db = admin.firestore();

// サーバー設定
const app = express();
const port = process.env.PORT || 3000; 
const host = '0.0.0.0';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), "public")));

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------------
// AI生成用エンドポイント
// ---------------------------

// 1. /api/generate（反省・回答の保存用）
app.post("/api/generate", async (req, res) => {
  console.log("APIにアクセス:", req.body); 
  try {
    const { prompt, answers } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "あなたは教育に熱心な数学の先生です。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const completion = response.choices[0].message.content;

    // Firestoreに保存
    await db.collection("kekka").add({
      answers: answers,
      prompt: prompt,
      completion: completion,
      timestamp: new Date(),
    });

    res.json({ completion });
  } catch (error) {
    console.error("Firestore書き込みエラー:", error.message || error);
    res.status(500).json({ error: "APIリクエストに失敗しました。" });
  }
});

// 2. /api/chat（チャット用・リアルタイム応答）
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "あなたは教育に熱心な高校数学の先生です。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const completion = response.choices[0].message.content;
    res.json({ output: completion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ output: "AIの応答生成に失敗しました。" });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
