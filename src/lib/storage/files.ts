import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ORIGINAL_DIR = path.join(UPLOAD_DIR, 'original');
const OPTIMIZED_DIR = path.join(UPLOAD_DIR, 'optimized');

export async function ensureUploadDirs() {
  await mkdir(ORIGINAL_DIR, { recursive: true });
  await mkdir(OPTIMIZED_DIR, { recursive: true });
}

export async function savePhoto(
  eventId: string,
  buffer: Buffer
): Promise<{ filename: string; originalPath: string; optimizedPath: string }> {
  await ensureUploadDirs();

  const filename = `${randomUUID()}.jpg`;
  const eventOriginalDir = path.join(ORIGINAL_DIR, eventId);
  const eventOptimizedDir = path.join(OPTIMIZED_DIR, eventId);

  await mkdir(eventOriginalDir, { recursive: true });
  await mkdir(eventOptimizedDir, { recursive: true });

  const originalPath = path.join(eventOriginalDir, filename);
  const optimizedPath = path.join(eventOptimizedDir, filename);

  await writeFile(originalPath, buffer);

  // For MVP, just copy the same file as "optimized"
  // In production, you'd resize/compress here
  await writeFile(optimizedPath, buffer);

  return {
    filename,
    originalPath: `original/${eventId}/${filename}`,
    optimizedPath: `optimized/${eventId}/${filename}`,
  };
}

export async function deletePhotoFiles(
  originalPath: string,
  optimizedPath: string
): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, originalPath));
  } catch {
    // File may not exist
  }
  try {
    await unlink(path.join(UPLOAD_DIR, optimizedPath));
  } catch {
    // File may not exist
  }
}

export function getPhotoFilePath(photoPath: string): string {
  return path.join(UPLOAD_DIR, photoPath);
}
