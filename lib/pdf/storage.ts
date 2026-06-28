import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'node:crypto';

const BUCKET = 'reports';

/**
 * Lädt ein PDF in den Storage und gibt den (versionierten) Pfad zurück.
 *
 * (P0.7) Jeder Lauf schreibt unter einen EIGENEN, versionierten Pfad
 * (`userId/assessmentId/uuid.pdf`) mit `upsert:false`. Damit überschreibt eine
 * Report-Regeneration NIE das bestehende PDF, bevor die DB-Transaktion steht.
 * Schlägt die Finalisierung fehl, wird nur die NEUE Datei aufgeräumt; der
 * bestehende Report-Datensatz zeigt weiter auf seine (unberührte) Datei.
 * Ein vorheriger Pfad wird erst NACH erfolgreicher Transaktion gelöscht.
 */
export async function uploadReportPDF(
  assessmentId: string,
  userId: string,
  buffer: Buffer
): Promise<string> {
  const admin = createAdminClient();
  const versionId = randomUUID();
  const path = `${userId}/${assessmentId}/${versionId}.pdf`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  return path;
}

/**
 * Returns a signed URL to download the PDF. Expires in 7 days by default.
 */
export async function getReportSignedUrl(
  storagePath: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Signed URL failed: ${error?.message ?? 'unknown'}`);
  }
  return data.signedUrl;
}

/**
 * Löscht Report-PDF-Dateien aus dem Storage. Wird beim Löschen von Reports,
 * Assessments und bei Kontolöschungen aufgerufen, damit keine personenbezogenen
 * PDFs im Bucket zurückbleiben (DSGVO). Gibt zurück, ob die Löschung gelang.
 */
export async function deleteReportFiles(storagePaths: Array<string | null | undefined>): Promise<boolean> {
  const paths = storagePaths.filter((p): p is string => typeof p === 'string' && p.length > 0);
  if (paths.length === 0) return true;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error('[storage] report file delete failed:', error.message);
    return false;
  }
  return true;
}
