import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image File to Storage under `gallery/` and return its public
 * download URL plus the storage path (kept so the file can be deleted later).
 */
export const uploadGalleryImage = async (file) => {
  const path = `gallery/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, path };
};

/** Delete a gallery image from Storage by its stored path. */
export const deleteGalleryImage = async (path) => {
  await deleteObject(ref(storage, path));
};
