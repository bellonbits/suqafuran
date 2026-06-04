export function getCloudinaryUrl(
    url: string | undefined,
    options?: { width?: number; height?: number; quality?: 'auto' | 'eco' | 'low' }
): string {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com')) return url;

    // Inject transformations into the Cloudinary URL
    const qStr = options?.quality === 'eco' ? 'q_auto:eco' : (options?.quality === 'low' ? 'q_auto:low' : 'q_auto');
    const transformations = ['f_auto', qStr];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.width || options?.height) transformations.push('c_fill');

    return url.replace(
        /\/upload\//,
        `/upload/${transformations.join(',')}/`
    );
}
