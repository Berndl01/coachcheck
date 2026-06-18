import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'reports';

/**
 * Uploads a PDF buffer to Supabase Storage and returns the storage path.
 */
export async function uploadReportPDF(
  assessmentId: string,
  userId: string,
  buffer: Buffer
): Promise<string> {
  const admin = createAdminClient();
  const path = `${userId}/${assessmentId}.pdf`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
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
