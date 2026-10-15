/**
 * Helper to resolve image paths across environments (Vite dev, GitHub Pages, PWA, Capacitor).
 * Handles absolute URLs, relative URLs, BASE_URL prefixing and legacy paths.
 */
export function getAssetUrl(path: string | undefined | null): string {
  if (!path) return '';

  const cleanPath = path.trim();

  // If already an absolute http/https URL, data URI, or blob URL, return as-is
  if (
    cleanPath.startsWith('http://') ||
    cleanPath.startsWith('https://') ||
    cleanPath.startsWith('data:') ||
    cleanPath.startsWith('blob:')
  ) {
    return cleanPath;
  }

  // Get base URL from Vite (e.g. './' or '/YourOrA/')
  const baseUrl = import.meta.env.BASE_URL || './';

  // Normalize path: strip leading slashes and any legacy src/assets/ prefix
  let relativePath = cleanPath;
  if (relativePath.startsWith('/src/assets/images/')) {
    relativePath = relativePath.replace('/src/assets/images/', 'images/');
  } else if (relativePath.startsWith('src/assets/images/')) {
    relativePath = relativePath.replace('src/assets/images/', 'images/');
  } else if (relativePath.startsWith('/assets/images/')) {
    relativePath = relativePath.replace('/assets/images/', 'images/');
  } else if (relativePath.startsWith('/images/')) {
    relativePath = relativePath.substring(1); // 'images/...'
  } else if (relativePath.startsWith('./images/')) {
    relativePath = relativePath.substring(2); // 'images/...'
  } else if (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1);
  }

  // If baseUrl ends with '/', e.g. './' or '/YourOrA/'
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${relativePath}`;
  }

  return `${baseUrl}/${relativePath}`;
}
