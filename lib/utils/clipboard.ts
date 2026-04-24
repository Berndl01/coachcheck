/**
 * Robuste Clipboard-Kopie mit Fallback für iOS/ältere Browser
 * ohne Secure-Context.
 */
export function copyToClipboard(text: string): boolean {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        /* Fallback wird angewandt */
      });
      return true;
    }
  } catch {
    // fall through to fallback
  }
  // Fallback für ältere Browser
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch {
    return false;
  }
}
