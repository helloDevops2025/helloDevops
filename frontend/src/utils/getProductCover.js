export async function fetchProductCover(API_URL, productId) {
    try {
        const r = await fetch(`${API_URL}/api/products/${productId}/images`);
        if (!r.ok) return null;

        const imgs = await r.json();
        if (!Array.isArray(imgs) || imgs.length === 0) return null;

        const cover = imgs.find(img => img.isCover) || imgs[0];

        // คืน URL ตรงๆ
        return `${API_URL}/api/products/${productId}/images/${cover.id}/raw`;
    } catch {
        return null;
    }
}
