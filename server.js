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
const serviceAccount = {
  "type": "service_account",
  "project_id": "aichat-e394f",
  "private_key_id": "dabb3308a68e8e49fe2f327747dee428b5cf0883",
  // 不正な制御文字をすべて排除し、改行コード(\n)のみを残した安全な形式
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrhBGJ0o81SNq4\npLruSuWVPNfA4istkuw5dbe8mBQZ+9tsbb/aj1Uy+fU/VN+7COYYaUHi3ZOtkzsO\nPSLiY/mDqQvStqc/Nz1sJLpKJCD4DOddYmyXZWvdCiplwi3GHxGiV3HgacX4RHzf\nswf+LyoY93eWSWY871VoTn/sJO7VVE+sAJndQRqiuzWAOoJkHIxVlPXy8+A02DX0\nzE2/QoyLumpdTlBMdlumf/8kZuSzxcR4zlfW3NyYrUi5mUSqfDX3KH7AKdjQpNdZ\nymWd4wLYGxYwXLEB5LBaKFGbIZLeT/esYcoFboUAqGkMkWqY69kOzjlklV/jWHyT\nQXlzS4d3AgMBAAECggIAAlP6lkwZlRQ9MDlN9nhI5Qgf8SL2F/a2WFlRXc1MbBsz\nRpd+xLgFyEB2h/OI+I5/ee6ufELxrf091YWksZLc7pmtBy9jDxm3Swy1diu4tCxW\n4yspuixZIyAMa7hIksXdL6JBjhyvp3JdpcVyVMWU5OwVNJKSCHd7ntlFesrbw+9F\nx5sHHz1yLc7bXfP8Mqv5LGfGSu20tN+tmf9tOijJQxluzFWrTBsyLUu3knWXCpj/\nd4eG4ZImU4vTjPTlp2gdJnA2zK9TD71vXGbppMu6fvitfPpoSx0b2UkCS+q3Hdu0\nfwPUPFhT4wVjGDvtCMw6dm6rapuP4W0T0Bi9oRbz8QKBgQDdSHD6IB/nEG2ezUjR\nI8xV78ygN+hlDUsamiorc43DBHhUXjrre0qoQYuw8Hd2fGfvZJ0gvysmD5zDVs8I\nJG5AGjyLzGQp9Oa6Q1dWFZCIBi3XJhBEffpBVX0ddPc8WiGm1lhd0pmIAlNEDVDP\nxaGWUJ515A3OrerT7eZQb+ciJQKBgQDGbMslUktSOjLm+0S4/gJ9yXd9j/ELxmzd\nu8zilzrOKnSjNJjW+N7w1rEIsz/FIxUZrPGHWy/KxI9XkBEs5ViPYXxAlk12VpRb\nGqfO1T7LY9jnt4K8qDh/d+tXDmde213sCEYCTs8JtyvMVzZkIUSXCI6FKjuEAYsa\nlyCYVq6aawKBgEdOs9F2jrFIMvsMjh2PGqbKyrcKrSH7QauF6HbuGs2wYBJX90ax\nCWLlFF3lb6nH9zpGwvetgvsV5t9v1vF5w+l2SvKF3/VBTSTS1I8SDew3iYgeZPmd\nWwq4wMPAUHerV9LKmdlKJ12T2j9AxzzdI/ArdJTq86QZmWXH8QMUvHfdAoGAPfVa\nuZyoyFRD8LwlCV7HiF+QYDTCH9slw1cQ8vAl/JplMVELKJUtiCaBwSW3k+cQf6Px\nB0MB+V7HI6BovIwgyyS1l7VXGsyOJqR8IamUog3bfP9gY2hju+nGIrjsrkHxYfJz\naeUR4QbBNl1FLp70u/SADDTTwLR6qyLlmqv2eWECgYAIFKSSZvOBncgeFushdGnd\n9X/Xv54FN2RR1hiWPAvWDkQdd6o1hBFwwix3w81cU6DdzSfXXAwXyj2gMfIstgam\nl22hBYQmyhWDwTJZRyJQhVEcrLezG6zpj4tSfg2GR/Ocdcbdm8As1RDwKcC8kF2e\nDtQfQXE89qvvnEEMkhb2WQ==\n-----END PRIVATE KEY-----\n",
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
app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
