import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI must be set when NODE_ENV=production.");
    }
    console.warn("⚠️  MONGODB_URI not set — using in-memory storage only.");
    return false;
  }
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected");
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`MongoDB connection failed in production: ${err.message}`);
    }
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
