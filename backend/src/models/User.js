import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Friend" },
    email: {
      type: String,
      default: null,
      required: true,
      unique: true,
      index: true,
    },
    password: { type: String, default: null },
    image: { type: String, default: null },

    // Basic details collected via the post-login form.
    age: { type: Number, default: null },
    city: { type: String, default: null },
    occupation: { type: String, default: null },
    phone: { type: String, default: null },
    basicInfoComplete: { type: Boolean, default: false },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
