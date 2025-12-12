// /lib/chatService.js
import { supabase } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** 🧩 Get Supabase client for both client/server environments */
async function getSupabaseClient(context = null) {
  const isServer = typeof window === "undefined";
  return isServer ? createSupabaseServerClient(context) : supabase;
}

/** 🔹 Fetch multiple profiles by auth_id */
async function getProfilesForAuthIds(supabase, authIds) {
  if (!authIds?.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("auth_id, fname, lname")
    .in("auth_id", authIds);

  if (error) {
    console.error("❌ getProfilesForAuthIds error:", error.message);
    return [];
  }
  return data || [];
}

/** 🧱 Get existing chat (both directions buyer↔seller) */
export async function getChat(userId, otherUserId, productId, context = null) {
  try {
    const supabase = await getSupabaseClient(context);
    const { data, error } = await supabase
      .from("chats")
      .select("chat_id,buyer_auth_id,seller_auth_id,product_id")
      .or(
        `and(buyer_auth_id.eq.${userId},seller_auth_id.eq.${otherUserId},product_id.eq.${productId}),` +
        `and(buyer_auth_id.eq.${otherUserId},seller_auth_id.eq.${userId},product_id.eq.${productId})`
      )
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("❌ getChat error:", err.message);
    return null;
  }
}

/** Get chat and include participant names */
export async function getChatWithProfiles(userId, otherUserId, productId, context = null) {
  const supabase = await getSupabaseClient(context);
  const chat = await getChat(userId, otherUserId, productId, context);
  if (!chat) return null;

  const authIds = [chat.buyer_auth_id, chat.seller_auth_id];
  const profiles = await getProfilesForAuthIds(supabase, authIds);

  const buyerProfile = profiles.find((p) => p.auth_id === chat.buyer_auth_id);
  const sellerProfile = profiles.find((p) => p.auth_id === chat.seller_auth_id);

  return {
    ...chat,
    buyer_name: buyerProfile
      ? `${buyerProfile.fname || ""} ${buyerProfile.lname || ""}`.trim()
      : "Unknown Buyer",
    seller_name: sellerProfile
      ? `${sellerProfile.fname || ""} ${sellerProfile.lname || ""}`.trim()
      : "Unknown Seller",
  };
}

/** Fetch all messages in a chat (includes sender names) */
export async function fetchMessages(chat_id, context = null) {
  if (!chat_id) return [];
  try {
    const supabase = await getSupabaseClient(context);

    // 1️⃣ Fetch all messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("message_id,chat_id,sender_auth_id,content,created_at,read")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!messages?.length) return [];

    // 2️⃣ Get unique sender IDs
    const authIds = [...new Set(messages.map((m) => m.sender_auth_id))];

    // 3️⃣ Fetch their names
    const profiles = await getProfilesForAuthIds(supabase, authIds);

    // 4️⃣ Merge names into each message
    return messages.map((m) => {
      const profile = profiles.find((p) => p.auth_id === m.sender_auth_id);
      const name = profile
        ? `${profile.fname || ""} ${profile.lname || ""}`.trim() || "Unnamed User"
        : "Unknown";
      return { ...m, sender_name: name };
    });
  } catch (err) {
    console.error("❌ fetchMessages error:", err.message);
    return [];
  }
}

/** ✉️ Send message (auto-creates chat if needed) */
export async function sendMessageLazy({ otherUserId, product_id, content, context = null }) {
  if (!product_id) throw new Error("Missing product_id for chat creation");
  if (!content?.trim()) return null;

  const supabase = await getSupabaseClient(context);

  // Get logged-in user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("User not logged in");

  const userId = user.id;

  // Check if user is a seller
  const { data: sellerData } = await supabase
    .from("seller")
    .select("id")
    .eq("auth_id", userId)
    .maybeSingle();

  // Determine both users' roles relative to the chat
  let buyer_auth_id, seller_auth_id;

  // Check if the other user is registered as a seller
  const { data: otherSellerData } = await supabase
    .from("seller")
    .select("id")
    .eq("auth_id", otherUserId)
    .maybeSingle();

  // If current user is seller, use that role — otherwise, infer from other user
  if (sellerData) {
    buyer_auth_id = otherUserId;
    seller_auth_id = userId;
  } else if (otherSellerData) {
    buyer_auth_id = userId;
    seller_auth_id = otherUserId;
  } else {
    // fallback — treat sender as buyer if both aren’t sellers
    buyer_auth_id = userId;
    seller_auth_id = otherUserId;
  }

  // Check existing chat
  let chat = await getChat(buyer_auth_id, seller_auth_id, product_id, context);
  let chat_id = chat?.chat_id;

  // Create new chat if not found
  if (!chat_id) {
    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .insert([{ buyer_auth_id, seller_auth_id, product_id }])
      .select("chat_id")
      .single();

    if (chatError) throw chatError;
    chat_id = newChat.chat_id;
  }

  // Insert message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert([{ chat_id, sender_auth_id: userId, content }])
    .select()
    .single();

  if (messageError) throw messageError;

  // Notify client UI that a chat was created/used so sidebars can refresh
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat:created", {
          detail: { chat_id, buyer_auth_id, seller_auth_id, product_id },
        })
      );
    }
  } catch (e) {
    // ignore
  }

  return { ...message, chat_id };
}

/** Real-time message listener */
export function subscribeToMessages(chat_id, callback) {
  if (!chat_id) return () => {};
  
  // use shared singleton client
  const channel = supabase
    .channel(`chat_${chat_id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chat_id}` },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/** Mark a message as read */
export async function markMessageAsRead(message_id, context = null) {
  try {
    const supabase = await getSupabaseClient(context);
    const { data, error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("message_id", message_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("❌ markMessageAsRead error:", err.message);
    return null;
  }
} 