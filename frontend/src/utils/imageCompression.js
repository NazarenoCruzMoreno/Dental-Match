// ── Compresor de imágenes en cliente ────────────────────────────────────────
// Antes de subir una foto al backend la pasamos por un canvas y la
// re-encodeamos como JPEG con calidad ajustable. Reduce típicamente 60-85%.

/**
 * Comprime una imagen manteniendo proporción.
 * @param {File}   file    — archivo original
 * @param {Object} options — { maxWidth, maxHeight, quality, mimeType }
 * @returns {Promise<File>} archivo comprimido (o el original si falla)
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth  = 1600,
    maxHeight = 1600,
    quality   = 0.82,
    mimeType  = "image/jpeg",
  } = options;

  // Si no es imagen o es muy chica, no comprimir
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 100 * 1024) return file; // <100KB ya está bien

  try {
    const img = await loadImage(file);
    const { width, height } = scaleToFit(img.width, img.height, maxWidth, maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) return file;

    // Si por algún motivo la "comprimida" pesa más, devolvemos la original
    if (blob.size >= file.size) return file;

    const ext = mimeType === "image/jpeg" ? "jpg" : "png";
    const newName = file.name.replace(/\.[^.]+$/, "") + `-c.${ext}`;
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } catch (e) {
    console.warn("Compresión falló, usando original:", e);
    return file;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function scaleToFit(w, h, maxW, maxH) {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
