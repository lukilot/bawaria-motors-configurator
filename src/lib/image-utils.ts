
/**
 * Compresses and resizes an image file on the client side.
 * Converts to WebP format with specified quality.
 * 
 * @param file - The original File object
 * @param options - Compression options
 * @returns Promise resolving to the compressed File
 */
export async function compressImage(
    file: File,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

    // Reject if not an image
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context failed'));
                    return;
                }

                // Resize logic (maintain aspect ratio)
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }
                    resolve(blob);
                }, 'image/webp', quality);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}
