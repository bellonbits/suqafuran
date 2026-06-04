import { getCloudinaryUrl } from '../lib/cloudinary';

export const getImageUrl = (path: string | undefined, options?: { width?: number; height?: number; quality?: 'auto' | 'eco' | 'low' }): string => {
    if (!path) return '';
    if (path.includes('res.cloudinary.com')) return getCloudinaryUrl(path, options);
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace(/\/$/, '') : '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // If we're in dev and no explicit API URL is set, use relative path so Vite proxy catches it
    // Wait, the API returns paths like "listings/images/xxx.png" or "avatar_1.png"
    // Let's ensure it has the correct prefix if it's missing
    const finalPath = normalizedPath.startsWith('/api/v1') ? normalizedPath : (normalizedPath.startsWith('/listings/images') ? `/api/v1${normalizedPath}` : `/api/v1/listings/images${normalizedPath}`);
    return `${backendUrl}${finalPath}`;
};

export const getAvatarUrl = (path: string | undefined | null, options?: { width?: number; height?: number; quality?: 'auto' | 'eco' | 'low' }): string | null => {
    if (!path) return null;
    if (path.includes('res.cloudinary.com')) return getCloudinaryUrl(path, options);
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace(/\/$/, '') : '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const finalPath = normalizedPath.startsWith('/api/v1') ? normalizedPath : (normalizedPath.startsWith('/listings/images') ? `/api/v1${normalizedPath}` : `/api/v1/listings/images${normalizedPath}`);
    return `${backendUrl}${finalPath}`;
};
