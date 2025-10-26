// lib/chatHelpers.js
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** 🧱 Helper to get the Supabase client with auth */
async function getSupabaseClient(context = null) {
  const isServer = typeof window === "undefined";
  return isServer
    ? createSupabaseServerClient(context)
    : createClientComponentClient();
}

/** 🧱 Get existing chat if it exists (supports reversed roles) */
export async function getChat(userId, otherUserId, productId, context = null) {
  try {
    const supabase = await getSupabaseClient(context);
    const { data, error } = await supabase
      .from("chats")
      .select("chat_id")
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

/** 💬 Fetch messages for a given chat */
export async function fetchMessages(chat_id, context = null) {
  if (!chat_id) return [];
  try {
    const supabase = await getSupabaseClient(context);
    const { data, error } = await supabase
      .from("messages")
      .select("message_id, chat_id, sender_auth_id, content, created_at, read")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("❌ fetchMessages error:", err.message);
    return [];
  }
}

/** ✉️ Send message (lazy-create chat if needed, always use logged-in user) */
export async function sendMessageLazy({ otherUserId, product_id, content, context = null }) {
  if (!product_id) throw new Error("Missing product_id for chat creation");
  if (!content?.trim()) return null;

  const supabase = await getSupabaseClient(context);

  // ✅ Get current logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not logged in");

  const userId = user.id;

  // 1️⃣ Check for existing chat
  let existingChat = await getChat(userId, otherUserId, product_id, context);
  let chat_id = existingChat?.chat_id;

  // 2️⃣ Create chat if it doesn't exist (safe for concurrency)
  if (!chat_id) {
    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .upsert(
        [
          {
            buyer_auth_id: userId,
            seller_auth_id: otherUserId,
            product_id,
          },
        ],
        { onConflict: "buyer_auth_id,seller_auth_id,product_id" }
      )
      .select("chat_id")
      .single();

    if (chatError) throw chatError;
    chat_id = newChat.chat_id;
  }

  // 3️⃣ Insert message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert([
      {
        chat_id,
        sender_auth_id: userId,
        content,
      },
    ])
    .select()
    .single();

  if (messageError) throw messageError;
  return message;
}

/** 🔔 Subscribe to messages in real-time */
export function subscribeToMessages(chat_id, callback) {
  if (!chat_id) return () => {};

  const supabase = createClientComponentClient();
  const channel = supabase
    .channel(`chat_${chat_id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chat_id}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/** 👀 Mark a message as read */
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
