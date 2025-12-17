// DKIM key generation using WebCrypto API
// Generates RSA key pair and exports public key in base64 for TXT record

export interface DkimKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function toPem(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY') {
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

export async function generateDkimKeyPair(): Promise<DkimKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const pubB64 = arrayBufferToBase64(spki);
  const privB64 = arrayBufferToBase64(pkcs8);

  return {
    publicKeyPem: toPem(pubB64, 'PUBLIC KEY'),
    privateKeyPem: toPem(privB64, 'PRIVATE KEY'),
  };
}

// Extract base64 payload from PEM for DKIM TXT record (p=...)
export function extractPublicKeyBase64(pem: string) {
  const cleaned = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/g, '');
  return cleaned;
}
