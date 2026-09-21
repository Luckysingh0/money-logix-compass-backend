import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    targetAmount: { type: Number, default: null },
    targetYear: { type: Number, default: null },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const planSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    templateId: { type: String, required: true },
    templateName: { type: String, required: true },
    tagline: { type: String, default: "" },
    expectedReturn: { type: String, default: "" },
    monthlySIP: { type: Number, default: null },
    allocation: { type: Array, default: [] },
    returnAssumptions: { type: Map, of: Number, default: {} },
    milestones: { type: [milestoneSchema], default: [] },
    disclaimer: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
