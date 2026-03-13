import { CloudinaryImage } from '@cloudinary/url-gen';
import { Resize } from '@cloudinary/url-gen/actions/resize';
import { quality, format } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';

const CLOUD_NAME = 'dyyo8cnqc';

export function getCloudinaryUrl(
    url: string | undefined,
    options?: { width?: number; height?: number }
): string {
    if (!url) return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=300';
    if (!url.includes('res.cloudinary.com')) return url;

    // Extract public_id from the URL
    // e.g. https://res.cloudinary.com/dyyo8cnqc/image/upload/v123/suqafuran/abc.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return url;

    const publicId = match[1].replace(/\.[^.]+$/, ''); // strip extension

    const img = new CloudinaryImage(publicId, { cloudName: CLOUD_NAME })
        .delivery(quality(auto()))
        .delivery(format(autoFormat()));

    if (options?.width || options?.height) {
        img.resize(
            Resize.fill()
                .width(options.width ?? undefined)
                .height(options.height ?? undefined)
        );
    }

    return img.toURL();
}
