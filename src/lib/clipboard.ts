/** Copy text to the clipboard, returning whether it succeeded.
 *
 * The modern `navigator.clipboard` API only exists in secure contexts
 * (HTTPS or localhost). On a phone hitting the dev server over LAN
 * (http://192.168.x.x) it's undefined, so we fall back to the legacy
 * execCommand("copy") path using a temporary off-screen textarea.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
