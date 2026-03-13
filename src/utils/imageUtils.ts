import { getCloudinaryUrl } from '../lib/cloudinary';

export const getImageUrl = (path: string | undefined): string => {
    if (!path) return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=300';
    if (path.includes('res.cloudinary.com')) return getCloudinaryUrl(path);
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '').replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}${normalizedPath}`;
};

export const getAvatarUrl = (path: string | undefined | null): string | null => {
    if (!path) return null;
    if (path.includes('res.cloudinary.com')) return getCloudinaryUrl(path);
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '').replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}${normalizedPath}`;
};
