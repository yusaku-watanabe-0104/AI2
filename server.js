import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path"; 
import admin from "firebase-admin";
import fs from "fs";

// 環境変数読み込み
//dotenv.config();

// Firebaseサービスアカウント読み込み
const serviceAccount = {
  "type": "service_account",
  "project_id": "aichat-e394f",
  "private_key_id": "dabb3308a68e8e49fe2f327747dee428b5cf0883",
  // 不正な制御文字をすべて排除し、改行コード(\n)のみを残した安全な形式
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDmBSMCKlGwji7P\na6J6j96vHedu7oEyuZa/kabojshcS2DFI+Q8cXfpCJjSNUk9+fMBd5YmZdy6fehK\naXJdrD8mg7xWjob1t+iPK3GvY0NTqE0fQiuyDewAFfEhxSWBKwu/qbJ/tAW+Kp2f\nppg0jbX2sAdmHW34seMe3zr7UcKCNrC+p5iGO9CkDmeXqzmxx5ZenPVNYc/kLNCW\nVyWU0DC6GvC2U0au6ZIgO8lMRIfTBEC2ROl+d6X49Wtslhj3bX9sWJvGLG4Rrzvk\nl9fsUdjTFHX1pZ7tH1ONNMnFyocPUh76xEj2g/sSS1J7+wppK4snuNQAuB/SyTXN\n66oT30L3AgMBAAECggEATIhKASbufjWYmpf//BKRb6eeANlncGayozPFmpwjSx4j\naQSLpJbGZGlhW5OyNmZLNeJBua3rtrs8xkF2dXdhnaF4UT5j5i7WOIimb0oyNQwK\n+QsNudULAG5MiEVtuKAHbTJ7uyS9QmwwfNWzz8yUzir8kzvYgsZBQNzaZZNrCeKh\n+/WiAjwYNATjQBcpVG+3bLiTv+6XzIkDeHpThryLOAzxQsiy+sP2GTMJLTwojf/u\ngMRfLj0hta4aq7xgeJqgGuYKKdKlnyQa1TF3Gn8tmbyW7pqjfWvRaFtnCNWeAjPd\nrNro+8NTd0M5tZzr7MPihJL2yxRheMEsCKCUUvNv0QKBgQD5HMSJD8gBzol4Dgu4\nIgxZOpvxBgwl190kBevj95U9b/gbFX7zCqkbTdP7uieKFNT0dVd54RPt0JDx9E9i\nhRitZJdpUT7P8wPxafqlyphT8UB32cc0zFLobrsrxTy/51UDkp25xQzjpfwYcDk1\nYIfKdqomNLVXP/IZUWQLpMp1RwKBgQDsYTuHWtCY1Xij/WxTaOT4iar3su9dGgIh\nWXW1+1yuKxZbXpSFkSm7Hk3UUXNNKciQylLyqDpXf1YeNyisTado9KJWXZpMZKfH\n60ZkOLhokl5UrbLGeboBiao5BDQGuzS0OdKthZpwPIBWDdDmdDYJoLocN+yilLMM\nSZH97BBc0QKBgQDHj7EuL7NFJ0TfJTlkL/p+fMIyCmsu4cfpNMktHcizqAA1Cjph\nzxd7pRR94zoLlvamQ15pZ9MEP4HuIo552S/Ur/HPz+MmyYJOIl1F9Y+kJ29C0/aO\nqGR+iT5uKRqqjVKAgzLRgDb8I5tZpIVf6k299uQFqVHgbHywpZAk98WsvwKBgQDO\nechj3UHknmM4677ZxQBs0OQUZaqMKpG9y8T0Z1J3mI941E7rtPc8yaW2VkdfGaZm\nQzTdXXFIyKPS1N+kUlhvZ3D9+9kx7aJZEPx1ws3iGihn0yocEGwXt8aG81L2pkPN\nQczzYYabj12SzZKyGsSw+EJZL8h142nay9DIepF4YQKBgQCrdd1P6XAulV83fzml\nYfwpB+jhGFhQsnympuwuW9HEfv5qOsN31BtJ5oJMVmk0VRrnKumOzeFFU5R2e87l\nQdo/Uf+kmdDaI3G7bfrVcGc/lUlfyxw1OeiE+nBTGXX37egcEVxnkr9wZ+JOAaMC\nMSqyvcYCdojqPhz4OIQg2j4ehQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@aichat-e394f.iam.gserviceaccount.com",
  "client_id": "108034371290545836195",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40aichat-e394f.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Firebase初期化（serviceAccountがundefinedでなければ初期化）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDKの初期化に成功しました。");
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
      //temperature: 0.7,
    });
    const completion = response.choices[0].message.content;
    res.json({ output: completion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ output: "AIの応答生成に失敗しました。" });
  }
});

// サーバー起動
app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
