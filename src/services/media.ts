import type * as ImagePicker from "expo-image-picker";

/**
 * Largest image the API will store. Must stay in step with `MAX_IMAGE_BYTES`
 * in roommate-mach-be/src/common/constants/media.ts — the server rejects
 * anything larger, and catching it here gives a better message than a 400.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Image types the API accepts. */
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif)$/;

export type ImagePickResult =
  | { ok: true; dataUri: string }
  | { ok: false; reason: string };

/**
 * Converts a picked asset into the base64 data URI the API expects.
 *
 * The picker is asked for `base64: true`, but it is not guaranteed to return
 * it. When it does not, the only other thing on hand is a `file://` path that
 * means nothing to the server — previously that path was uploaded verbatim and
 * stored as a broken photo, so it is now reported as a failure instead.
 */
export async function toImageDataUriAsync(
  asset: ImagePicker.ImagePickerAsset,
): Promise<ImagePickResult> {
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      reason: `Please choose an image smaller than ${Math.round(
        MAX_IMAGE_BYTES / (1024 * 1024),
      )} MB.`,
    };
  }

  const mimeType = asset.mimeType ?? "image/jpeg";
  if (!ALLOWED_MIME.test(mimeType)) {
    return { ok: false, reason: "Please choose a JPEG, PNG, WebP or GIF image." };
  }

  if (asset.base64) {
    return { ok: true, dataUri: `data:${mimeType};base64,${asset.base64}` };
  }

  if (asset.uri?.startsWith("data:")) {
    return { ok: true, dataUri: asset.uri };
  }

  if (typeof fetch !== "undefined" && asset.uri) {
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve({ ok: true, dataUri: reader.result });
          } else {
            resolve({ ok: false, reason: "That image could not be read." });
          }
        };
        reader.onerror = () =>
          resolve({ ok: false, reason: "That image could not be read." });
        reader.readAsDataURL(blob);
      });
    } catch {
      // fallback
    }
  }

  return {
    ok: false,
    reason: "That image could not be read. Please pick a different one.",
  };
}

export function toImageDataUri(
  asset: ImagePicker.ImagePickerAsset,
): ImagePickResult {
  if (asset.base64) {
    return {
      ok: true,
      dataUri: `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`,
    };
  }
  if (asset.uri?.startsWith("data:")) {
    return { ok: true, dataUri: asset.uri };
  }
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      reason: `Please choose an image smaller than ${Math.round(
        MAX_IMAGE_BYTES / (1024 * 1024),
      )} MB.`,
    };
  }

  const mimeType = asset.mimeType ?? "image/jpeg";
  if (!ALLOWED_MIME.test(mimeType)) {
    return { ok: false, reason: "Please choose a JPEG, PNG, WebP or GIF image." };
  }

  return {
    ok: false,
    reason: "That image could not be read. Please pick a different one.",
  };
}
