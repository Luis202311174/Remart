#!/usr/bin/env node
// scripts/populateEmbeddings.js

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// 1️⃣ Load .env.local manually
// ----------------------
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, { encoding: "utf8" });
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      value = value.replace(/^['"]|['"]$/g, ""); // remove quotes
      process.env[key] = value;
    }
  });
}

// ----------------------
// 2️⃣ Initialize OpenAI client
// ----------------------
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ----------------------
// 3️⃣ Initialize Supabase client
// ----------------------
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ----------------------
// 4️⃣ Helper to update embeddings
// ----------------------
async function updateAllProductEmbeddings(batchSize = 50) {
  let offset = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from("products")
      .select("product_id, title, description")
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!products || products.length === 0) break;

    console.log(`Processing batch ${offset} → ${offset + products.length - 1}`);

    for (const product of products) {
      const text = `${product.title || ""} ${product.description || ""}`.trim();

      if (!text) continue; // skip empty text

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Update Supabase
      const { error: updateError } = await supabase
        .from("products")
        .update({ embedding })
        .eq("product_id", product.product_id);

      if (updateError) {
        console.error(`Failed to update product ${product.product_id}:`, updateError);
      } else {
        console.log(`✅ Updated product ${product.product_id}`);
      }
    }

    offset += batchSize;
  }
}

// ----------------------
// 5️⃣ Run the script
// ----------------------
(async () => {
  try {
    console.log("Starting to update all product embeddings...");
    await updateAllProductEmbeddings(50); // batch size
    console.log("✅ All product embeddings updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating embeddings:", err);
    process.exit(1);
  }
})();
