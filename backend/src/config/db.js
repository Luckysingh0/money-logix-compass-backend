import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    console.warn("⚠️  MONGODB_URI not set — using in-memory storage only.");
    return false;
  }
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected");
    return true;
  } catch (err) {
    console.warn(
      `⚠️  MongoDB connection failed (${err.message}). ` +
        "Continuing with in-memory storage for local/demo usage.",
    );
    return false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
