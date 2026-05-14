/**
 * Advanced Device Fingerprinting and Security Utilities
 * Generates a unique hardware-based fingerprint for the browser.
 */

export const getDeviceFingerprint = async (): Promise<string> => {
    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
        screen.width + "x" + screen.height,
        screen.colorDepth.toString(),
        (window.devicePixelRatio || 1).toString(),
        // Canvas Fingerprinting
        getCanvasFingerprint()
    ];
    
    const data = components.join('|');
    return hashString(data);
};

const getCanvasFingerprint = (): string => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Suqafuran-AntiScam-2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Suqafuran-AntiScam-2026", 4, 17);
        
        return canvas.toDataURL();
    } catch (e) {
        return '';
    }
};

const hashString = async (str: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getDeviceMetadata = () => {
    return {
        browser: navigator.userAgent,
        os: getOS(),
        screen: screen.width + "x" + screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        gpu: getWebGLExtension()
    };
};

const getOS = () => {
    const platform = navigator.platform;
    if (platform.indexOf('Win') !== -1) return 'Windows';
    if (platform.indexOf('Mac') !== -1) return 'MacOS';
    if (platform.indexOf('Linux') !== -1) return 'Linux';
    if (platform.indexOf('iPhone') !== -1 || platform.indexOf('iPad') !== -1) return 'iOS';
    if (platform.indexOf('Android') !== -1) return 'Android';
    return 'Unknown';
};

const getWebGLExtension = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') as WebGLRenderingContext;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        return 'Unknown';
    } catch (e) {
        return 'Unknown';
    }
};
