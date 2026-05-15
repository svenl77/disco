const VERSION = 1;
function base64UrlEncode(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++)
        bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(s) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const norm = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(norm);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        bytes[i] = bin.charCodeAt(i);
    return bytes;
}
export function encodeSet(set) {
    const payload = { v: VERSION, ...set };
    const json = JSON.stringify(payload);
    return base64UrlEncode(new TextEncoder().encode(json));
}
export function decodeSet(encoded) {
    try {
        const bytes = base64UrlDecode(encoded);
        const json = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(json);
        if (parsed?.v !== VERSION)
            return null;
        if (!parsed.patterns || typeof parsed.bpm !== 'number')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function shareURL(set) {
    const encoded = encodeSet(set);
    const url = new URL(window.location.href);
    url.hash = `s=${encoded}`;
    return url.toString();
}
export function setFromCurrentURL() {
    if (!window.location.hash)
        return null;
    const m = window.location.hash.match(/s=([^&]+)/);
    if (!m)
        return null;
    return decodeSet(m[1]);
}
export function downloadJSON(set, filename = 'boys-club-set.json') {
    const payload = { v: VERSION, ...set };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
