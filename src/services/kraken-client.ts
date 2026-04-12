import axios from 'axios';
import * as crypto from 'crypto';

const BASE_URL = 'https://api.kraken.com';

function sign(path: string, params: Record<string, any>, secret: string): string {
    const encoded = new URLSearchParams(params as Record<string, string>).toString();
    const sha256Hash = crypto
        .createHash('sha256')
        .update(params.nonce + encoded)
        .digest();
    const message = Buffer.concat([Buffer.from(path), sha256Hash]);
    return crypto
        .createHmac('sha512', Buffer.from(secret, 'base64'))
        .update(message)
        .digest('base64');
}

export async function krakenPublic(method: string, params: Record<string, any> = {}): Promise<any> {
    const { data } = await axios.get(`${BASE_URL}/0/public/${method}`, { params });
    if (data.error?.length) {
        throw new Error(`Kraken error [${method}]: ${data.error.join(', ')}`);
    }
    return data;
}

export async function krakenPrivate(
    method: string,
    apiKey: string,
    apiSecret: string,
    params: Record<string, any> = {}
): Promise<any> {
    const path = `/0/private/${method}`;
    const nonce = Date.now().toString();
    const body = { nonce, ...params };
    const encoded = new URLSearchParams(body as Record<string, string>).toString();
    const { data } = await axios.post(`${BASE_URL}${path}`, encoded, {
        headers: {
            'API-Key': apiKey,
            'API-Sign': sign(path, body, apiSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    if (data.error?.length) {
        throw new Error(`Kraken error [${method}]: ${data.error.join(', ')}`);
    }
    return data;
}
