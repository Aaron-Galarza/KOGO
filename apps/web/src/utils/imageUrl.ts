export function cloudinaryUrl(url: string, width: number): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('res.cloudinary.com')) return url;
    const segs = u.pathname.split('/');
    const i = segs.indexOf('upload');
    if (i === -1 || i >= segs.length - 1) return url;
    let j = i + 1;
    if (segs[j] && segs[j].includes(',')) j += 1;
    const rest = segs.slice(j);
    segs[i + 1] = `q_auto,f_auto,w_${width}`;
    u.pathname = [...segs.slice(0, i + 1), ...rest].join('/');
    return u.toString();
  } catch {
    return url;
  }
}
