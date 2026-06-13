// Modular client compression block (architecture doc §9).
import imageCompression from "browser-image-compression";

export async function processReceiptImage(file: File): Promise<File | Blob> {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_COMPRESSION === "true";

  if (!isEnabled) {
    return file; // Bypass compression, returning original file
  }

  const options = {
    // Receipts have small, dense text the OCR model must read. Keep the full
    // original resolution (alwaysKeepResolution) and only trim bytes via JPEG
    // quality, so line items stay legible. The 1024px/150KB cap blurred them.
    maxSizeMB: 2,
    initialQuality: 0.85,
    alwaysKeepResolution: true,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn("Compression helper failed, processing raw image file:", error);
    return file;
  }
}
