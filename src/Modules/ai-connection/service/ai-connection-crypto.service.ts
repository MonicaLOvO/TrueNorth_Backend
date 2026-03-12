import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class AiConnectionCryptoService {
  private readonly key: Buffer | null;

  constructor(private readonly config: ConfigService) {
    const rawKey = this.config.get<string>('aiConnectionEncryptionKey')?.trim();
    if (!rawKey) {
      this.key = null;
      return;
    }
    this.key = createHash('sha256').update(rawKey).digest();
  }

  encrypt(plainText: string): string {
    if (!this.key) {
      throw new InternalServerErrorException(
        'AI_CONNECTION_ENCRYPTION_KEY is required to store API keys in DB.',
      );
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(payload: string): string {
    if (!this.key) {
      throw new InternalServerErrorException(
        'AI_CONNECTION_ENCRYPTION_KEY is required to decrypt API keys from DB.',
      );
    }
    const [ivPart, tagPart, dataPart] = payload.split(':');
    if (!ivPart || !tagPart || !dataPart) {
      throw new InternalServerErrorException('Encrypted key payload is invalid.');
    }
    const iv = Buffer.from(ivPart, 'base64');
    const authTag = Buffer.from(tagPart, 'base64');
    const encrypted = Buffer.from(dataPart, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return plain.toString('utf8');
  }
}
