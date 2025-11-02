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
const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_KEY_PATH, "utf8")
);

// Firebase初期化（既存アプリがあれば再利用）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// サーバー設定
const app = express();
const port = 3000;

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
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "あなたは教育に熱心な数学の先生です。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const completion = response.choices[0].message.content;

    // Firestoreに保存
    await db.collection("history").add({
      answers: answers,
      prompt: prompt,
      completion: completion,
      timestamp: new Date(),
    });

    res.json({ completion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "APIリクエストに失敗しました。" });
  }
});

// 2. /api/chat（チャット用・リアルタイム応答）
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
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
