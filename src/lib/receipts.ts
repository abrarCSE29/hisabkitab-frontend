import { RECEIPTS_BUCKET, supabase } from "@/lib/supabase";
import { processReceiptImage } from "@/utils/compression";

/**
 * FR-5: compress client-side, upload to Supabase Storage, return the public
 * URL the backend will accept as a voucher image_url.
 */
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase Storage is not configured (set NEXT_PUBLIC_SUPABASE_* env vars)");
  }

  const processed = await processReceiptImage(file);
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, processed, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  return supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path).data.publicUrl;
}
