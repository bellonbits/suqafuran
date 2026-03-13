export function getCloudinaryUrl(
    url: string | undefined,
    options?: { width?: number; height?: number }
): string {
    if (!url) return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=300';
    if (!url.includes('res.cloudinary.com')) return url;

    // Inject transformations into the Cloudinary URL
    // e.g. https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
    //   → https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto,w_400/v123/folder/file.jpg
    const transformations = ['f_auto', 'q_auto'];
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.width || options?.height) transformations.push('c_fill');

    return url.replace(
        /\/upload\//,
        `/upload/${transformations.join(',')}/`
    );
}
