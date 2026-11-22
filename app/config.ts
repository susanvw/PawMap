// The API address comes from EXPO_PUBLIC_API_URL, which eas.json sets per build
// profile (the Render URL for preview and production builds).
//
// For local development, leave it unset and update the fallback to your machine's
// LAN IP so the app works on a real device (localhost on the phone is not the same
// as localhost on your dev machine). Find yours with `ipconfig getifaddr en0` (Mac)
// or `ipconfig` (Windows). You can also point a dev session at Render with
// `EXPO_PUBLIC_API_URL=https://pawmap-api.onrender.com npx expo start`.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.103:5288';

// Photos stored on Cloudinary come back as full URLs; locally stored ones are
// paths on the API.
export function photoUri(photoUrl: string) {
  return /^https?:\/\//.test(photoUrl) ? photoUrl : `${API_URL}${photoUrl}`;
}
