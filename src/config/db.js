// src/config/db.js
// 전제: mongoose 설치되어 있음 (npm i mongoose dotenv)
// 실행/롤백 방법: 교체 후 npm start → 연결 확인 → 문제시 원본으로 복구

const mongoose = require("mongoose");

/**
 * MongoDB 연결 함수
 * @param {string} uri - MongoDB 접속 URI (ex. mongodb+srv://... or mongodb://127.0.0.1:27017)
 * @param {string} dbName - 사용할 데이터베이스 이름
 */
async function connectDB(uri, dbName) {
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Set it in environment variables.");
  }

  const effectiveDbName = dbName || process.env.DB_NAME || "foodmap-db";

  // 이벤트 리스너는 connect 이전에 붙여야 'connected' 이벤트를 놓치지 않음
  mongoose.connection.on("connected", () => {
    console.log(`[MongoDB] connected(event): ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] disconnected");
  });

  // 마스킹된 URI 로그 (보안용)
  console.log("[MongoDB] connecting...", {
    uri: uri.replace(/\/\/(.*)@/, "//****:****@"),
    db: effectiveDbName,
  });

  try {
    const conn = await mongoose.connect(uri, {
      dbName: effectiveDbName,
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      family: 4, // IPv4 우선
    });

    if (conn?.connection?.readyState === 1) {
      console.log(`[MongoDB] connected(now): ${conn.connection.name}`);
    } else {
      console.warn(
        "[MongoDB] connected state not ready:",
        conn?.connection?.readyState
      );
    }
  } catch (err) {
    console.error("❌ [MongoDB] connection failed:", err.message);
    throw err;
  }
}

/** Graceful shutdown용 닫기 함수 */
async function closeDB() {
  try {
    await mongoose.connection.close(false);
    console.log("[MongoDB] connection closed");
  } catch (err) {
    console.error("[MongoDB] error on close:", err.message);
  }
}

module.exports = { connectDB, closeDB };