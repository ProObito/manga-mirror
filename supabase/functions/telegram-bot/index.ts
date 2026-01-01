import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    document?: {
      file_id: string;
      file_name: string;
      mime_type: string;
    };
    photo?: Array<{
      file_id: string;
    }>;
    caption?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const update: TelegramUpdate = await req.json();
    const message = update.message;

    if (!message) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text || "";

    // Helper to send telegram message
    const sendMessage = async (text: string, parseMode = "HTML") => {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });
    };

    // Handle commands
    if (text === "/start") {
      await sendMessage(
        `🎉 <b>Welcome to ComickTown Bot!</b>\n\n` +
        `Available commands:\n` +
        `/upload - Start uploading manga\n` +
        `/list - List all manga\n` +
        `/help - Show help message\n\n` +
        `To upload a chapter:\n` +
        `1. Use /upload command\n` +
        `2. Send manga title\n` +
        `3. Send chapter number\n` +
        `4. Send images (photos or documents)`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (text === "/help") {
      await sendMessage(
        `📚 <b>ComickTown Bot Help</b>\n\n` +
        `<b>Commands:</b>\n` +
        `/upload - Start uploading a chapter\n` +
        `/list - List all available manga\n` +
        `/new [title] - Create new manga\n` +
        `/addchapter [manga_id] [chapter_num] - Add chapter\n\n` +
        `<b>Upload Process:</b>\n` +
        `1. Create manga with /new Title Name\n` +
        `2. Start upload with /addchapter manga_id 1\n` +
        `3. Send all images for the chapter\n` +
        `4. Send /done when finished`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (text === "/list") {
      const { data: mangaList, error } = await supabase
        .from("manga")
        .select("id, title, status")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        await sendMessage("❌ Error fetching manga list");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (!mangaList || mangaList.length === 0) {
        await sendMessage("📭 No manga found. Use /new [title] to create one.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      const list = mangaList
        .map((m, i) => `${i + 1}. <b>${m.title}</b>\n   ID: <code>${m.id}</code>\n   Status: ${m.status || 'ongoing'}`)
        .join("\n\n");

      await sendMessage(`📚 <b>Manga List:</b>\n\n${list}`);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Create new manga: /new Title Name
    if (text.startsWith("/new ")) {
      const title = text.substring(5).trim();
      if (!title) {
        await sendMessage("❌ Please provide a title: /new Manga Title");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      const { data: newManga, error } = await supabase
        .from("manga")
        .insert({ title, source: "telegram" })
        .select()
        .single();

      if (error) {
        await sendMessage(`❌ Error creating manga: ${error.message}`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      await sendMessage(
        `✅ <b>Manga Created!</b>\n\n` +
        `Title: ${newManga.title}\n` +
        `ID: <code>${newManga.id}</code>\n\n` +
        `To add a chapter:\n` +
        `/addchapter ${newManga.id} 1`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Add chapter: /addchapter manga_id chapter_num
    if (text.startsWith("/addchapter ")) {
      const parts = text.substring(12).trim().split(" ");
      if (parts.length < 2) {
        await sendMessage("❌ Usage: /addchapter [manga_id] [chapter_number]");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      const mangaId = parts[0];
      const chapterNum = parseFloat(parts[1]);

      if (isNaN(chapterNum)) {
        await sendMessage("❌ Chapter number must be a valid number");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Check if manga exists
      const { data: manga, error: mangaError } = await supabase
        .from("manga")
        .select("title")
        .eq("id", mangaId)
        .single();

      if (mangaError || !manga) {
        await sendMessage("❌ Manga not found. Use /list to see available manga.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Create chapter
      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          manga_id: mangaId,
          number: chapterNum,
          title: `Chapter ${chapterNum}`,
          images: [],
        })
        .select()
        .single();

      if (chapterError) {
        await sendMessage(`❌ Error creating chapter: ${chapterError.message}`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Store session data
      await supabase.from("telegram_sessions").upsert({
        chat_id: chatId.toString(),
        manga_id: mangaId,
        chapter_id: chapter.id,
        images: [],
        updated_at: new Date().toISOString(),
      });

      await sendMessage(
        `✅ <b>Chapter Created!</b>\n\n` +
        `Manga: ${manga.title}\n` +
        `Chapter: ${chapterNum}\n\n` +
        `Now send me the images for this chapter.\n` +
        `When done, send /done to finish.`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Handle images
    if (message.photo || message.document) {
      // Get session
      const { data: session } = await supabase
        .from("telegram_sessions")
        .select("*")
        .eq("chat_id", chatId.toString())
        .single();

      if (!session) {
        await sendMessage("❌ No active upload session. Use /addchapter first.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      let fileId: string | undefined;
      let fileName = `image_${Date.now()}.jpg`;

      if (message.photo) {
        // Get largest photo
        fileId = message.photo[message.photo.length - 1].file_id;
      } else if (message.document) {
        fileId = message.document.file_id;
        fileName = message.document.file_name;
      }

      if (!fileId) {
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Get file path from Telegram
      const fileRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
      );
      const fileData = await fileRes.json();

      if (!fileData.ok) {
        await sendMessage("❌ Error getting file from Telegram");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

      // Download file
      const imageRes = await fetch(fileUrl);
      const imageBlob = await imageRes.blob();

      // Upload to Supabase Storage
      const storagePath = `${session.manga_id}/${session.chapter_id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("manga-chapters")
        .upload(storagePath, imageBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        await sendMessage(`❌ Upload error: ${uploadError.message}`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("manga-chapters")
        .getPublicUrl(storagePath);

      // Update session with new image
      const newImages = [...(session.images || []), publicUrl.publicUrl];
      await supabase
        .from("telegram_sessions")
        .update({ images: newImages, updated_at: new Date().toISOString() })
        .eq("chat_id", chatId.toString());

      await sendMessage(`✅ Image ${newImages.length} uploaded!\nSend more or /done to finish.`);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Done uploading
    if (text === "/done") {
      const { data: session } = await supabase
        .from("telegram_sessions")
        .select("*")
        .eq("chat_id", chatId.toString())
        .single();

      if (!session || !session.images || session.images.length === 0) {
        await sendMessage("❌ No images uploaded. Send images first.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Update chapter with images
      const { error: updateError } = await supabase
        .from("chapters")
        .update({ images: session.images })
        .eq("id", session.chapter_id);

      if (updateError) {
        await sendMessage(`❌ Error saving chapter: ${updateError.message}`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Clear session
      await supabase
        .from("telegram_sessions")
        .delete()
        .eq("chat_id", chatId.toString());

      await sendMessage(
        `✅ <b>Chapter Saved!</b>\n\n` +
        `Total images: ${session.images.length}\n\n` +
        `Use /addchapter to add more chapters.`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Default response
    await sendMessage("❓ Unknown command. Use /help for available commands.");
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});