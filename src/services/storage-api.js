import { supabase } from '../lib/supabase.js';

export const PRIVATE_BUCKET = 'app612_aislekin_private';
export const PUBLIC_BUCKET = 'app612_aislekin_public';

export async function uploadHouseholdImage(file, householdId) {
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `households/${householdId}/cover-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(path, file, {
    upsert: true
  });

  if (error) {
    throw error;
  }

  return path;
}

export async function createSignedHouseholdImageUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}