// src/common/services/crypto.service.ts
import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.SECRET_KEY || 'mi_clave_secreta_default';

@Injectable()
export class CryptoService {
  encrypt(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    return encrypted;
  }

  decrypt(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    console.log(bytes);

    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
