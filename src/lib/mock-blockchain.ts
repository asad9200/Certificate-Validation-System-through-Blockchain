import { Certificate, VerificationResult } from './certificate-utils';

// Mock blockchain ledger - simulates immutable storage
const blockchainLedger: Map<string, {
  hash: string;
  issuerId: string;
  timestamp: number;
  txId: string;
  revoked: boolean;
}> = new Map();

// Mock certificate storage
const certificateStore: Map<string, Certificate> = new Map();

// Initialize with sample data
const sampleCertificates: Certificate[] = [
  {
    id: 'CERT-M4K8A1-XYZ123',
    hash: 'a7f3c2b1e8d9f6a5c4b3e2d1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1',
    holderName: 'John Doe',
    holderEmail: 'john.doe@email.com',
    courseName: 'Bachelor of Science in Computer Science',
    institutionName: 'University of Technology',
    issueDate: '2024-05-15',
    grade: 'Magna Cum Laude',
    issuerId: 'admin-001',
    status: 'valid',
    blockchainTxId: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    createdAt: '2024-05-15T10:00:00Z'
  },
  {
    id: 'CERT-N5L9B2-ABC456',
    hash: 'b8f4c3b2e9d0f7a6c5b4e3d2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3b2',
    holderName: 'Jane Smith',
    holderEmail: 'jane.smith@email.com',
    courseName: 'Master of Business Administration',
    institutionName: 'Global Business School',
    issueDate: '2024-03-20',
    grade: 'With Distinction',
    issuerId: 'admin-002',
    status: 'valid',
    blockchainTxId: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    createdAt: '2024-03-20T14:30:00Z'
  }
];

// Initialize mock data
sampleCertificates.forEach(cert => {
  certificateStore.set(cert.id, cert);
  blockchainLedger.set(cert.hash, {
    hash: cert.hash,
    issuerId: cert.issuerId,
    timestamp: new Date(cert.createdAt).getTime(),
    txId: cert.blockchainTxId || '',
    revoked: cert.status === 'revoked'
  });
});

export async function issueCertificateToBlockchain(
  hash: string,
  issuerId: string,
  certificate: Certificate
): Promise<{ success: boolean; txId: string }> {
  // Simulate blockchain transaction delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const txId = `0x${Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  blockchainLedger.set(hash, {
    hash,
    issuerId,
    timestamp: Date.now(),
    txId,
    revoked: false
  });

  certificateStore.set(certificate.id, {
    ...certificate,
    blockchainTxId: txId
  });

  return { success: true, txId };
}

export async function verifyCertificateOnBlockchain(
  hash: string
): Promise<VerificationResult> {
  // Simulate blockchain verification delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const blockchainRecord = blockchainLedger.get(hash);

  if (!blockchainRecord) {
    return {
      isValid: false,
      status: 'not_found',
      verifiedAt: new Date().toISOString(),
      blockchainVerified: true
    };
  }

  // Find certificate by hash
  let certificate: Certificate | undefined;
  certificateStore.forEach(cert => {
    if (cert.hash === hash) {
      certificate = cert;
    }
  });

  if (blockchainRecord.revoked) {
    return {
      isValid: false,
      status: 'revoked',
      certificate,
      verifiedAt: new Date().toISOString(),
      blockchainVerified: true
    };
  }

  return {
    isValid: true,
    status: 'valid',
    certificate,
    verifiedAt: new Date().toISOString(),
    blockchainVerified: true
  };
}

export async function revokeCertificateOnBlockchain(
  hash: string
): Promise<{ success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const record = blockchainLedger.get(hash);
  if (record) {
    record.revoked = true;
    blockchainLedger.set(hash, record);

    // Update certificate store
    certificateStore.forEach((cert, id) => {
      if (cert.hash === hash) {
        certificateStore.set(id, { ...cert, status: 'revoked' });
      }
    });

    return { success: true };
  }
  return { success: false };
}

export function getAllCertificates(): Certificate[] {
  return Array.from(certificateStore.values());
}

export function getCertificateById(id: string): Certificate | undefined {
  return certificateStore.get(id);
}

export function getCertificateByHash(hash: string): Certificate | undefined {
  let found: Certificate | undefined;
  certificateStore.forEach(cert => {
    if (cert.hash === hash) {
      found = cert;
    }
  });
  return found;
}

export function addCertificate(certificate: Certificate): void {
  certificateStore.set(certificate.id, certificate);
}
