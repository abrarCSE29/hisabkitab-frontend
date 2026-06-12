// Modular client compression block (architecture doc §9).
import imageCompression from "browser-image-compression";

export async function processReceiptImage(file: File): Promise<File | Blob> {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_COMPRESSION === "true";

  if (!isEnabled) {
    return file; // Bypass compression, returning original file
  }

  const options = {
    maxSizeMB: 0.15, // Keep files under 150KB for rapid upload
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn("Compression helper failed, processing raw image file:", error);
    return file;
  }
}
