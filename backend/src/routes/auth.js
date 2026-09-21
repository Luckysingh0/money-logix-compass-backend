import express from "express";
import bcrypt from "bcrypt";
import { setUserIdentity, updateProfile } from "../services/store.js";

import User from "../models/User.js";

const router = express.Router();

function serializeUser(user) {
  return {
    _id: user?._id?.toString() ?? null,
    name: user?.name ?? "Friend",
    email: user?.email ?? null,
    image: user?.image ?? null,
    age: user?.age ?? null,
    city: user?.city ?? null,
    occupation: user?.occupation ?? null,
    phone: user?.phone ?? null,
    basicInfoComplete: Boolean(user?.basicInfoComplete),
  };
}

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email and password are required." });

    let user = await User.findOne({ email });

    if (!user) {
      // First time we see this email — remember them (UI lets users pick any password).
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        password: hashedPassword,
        basicInfoComplete: false,
      });
    } else if (user.password) {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "Incorrect password." });
    }

    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/login error:", err);
    res.status(500).json({ error: "Could not sign you in." });
  }
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email and password are required." });

    let user = await User.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        password: hashedPassword,
        basicInfoComplete: false,
      });
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/register error:", err);
    res.status(500).json({ error: "Could not register you." });
  }
});

router.post("/basic-info", async (req, res) => {
  const { name, age, city, occupation, phone, income, goal, email } = req.body;

  try {
    const ageNum = Number(age);

    const basicInfoComplete =
      name.trim() &&
      !Number.isNaN(ageNum) &&
      ageNum > 0 &&
      city.trim() &&
      occupation.trim() &&
      phone.trim()
        ? true
        : false;

    const user = await setUserIdentity(email, {
      name: clean(name),
      age: !Number.isNaN(ageNum) && ageNum > 0 ? ageNum : null,
      city: clean(city),
      occupation: clean(occupation),
      phone: clean(phone),
      basicInfoComplete,
    });

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/basic-info error:", err);
    res.status(500).json({ error: "Could not save your details." });
  }
});

router.post("/sync-user", async (req, res) => {
  const { name, email, image } = req.body;

  try {
    if (!email || !name)
      return res.status(400).json({ error: "Name and Email are required." });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        image,
        basicInfoComplete: false,
      });
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("/auth/sync-user error:", err);
    res.status(500).json({ error: "Could not sync user." });
  }
});

export default router;
