import CryptoJS from 'crypto-js';

export interface Certificate {
  id: string;
  hash: string;
  holderName: string;
  holderEmail: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  issuerId: string;
  status: 'valid' | 'revoked' | 'expired';
  blockchainTxId?: string;
  createdAt: string;
}

export interface VerificationResult {
  isValid: boolean;
  status: 'valid' | 'invalid' | 'revoked' | 'tampered' | 'not_found';
  certificate?: Certificate;
  verifiedAt: string;
  blockchainVerified: boolean;
}

export function generateCertificateHash(data: {
  holderName: string;
  holderEmail: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  issuerId: string;
}): string {
  const dataString = JSON.stringify({
    ...data,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  });
  return CryptoJS.SHA256(dataString).toString();
}

export function verifyCertificateHash(originalHash: string, storedHash: string): boolean {
  return originalHash === storedHash;
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function truncateHash(hash: string, length: number = 16): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}
