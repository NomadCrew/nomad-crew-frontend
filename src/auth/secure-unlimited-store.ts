import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';

class SecureUnlimitedStore {
  private async generateKey(): Promise<CryptoJS.lib.WordArray> {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    return CryptoJS.enc.Base64.parse(Buffer.from(keyBytes).toString('base64'));
  }

  private async storeKey(keyWordArray: CryptoJS.lib.WordArray, identifier: string): Promise<void> {
    const keyBase64 = keyWordArray.toString(CryptoJS.enc.Base64);
    await SecureStore.setItemAsync(`encryption_key_${identifier}`, keyBase64);
  }

  private encryptData(data: string, keyWordArray: CryptoJS.lib.WordArray): string {
    return CryptoJS.AES.encrypt(data, keyWordArray).toString();
  }

  private async storeEncryptedData(encryptedData: string, identifier: string): Promise<void> {
    const filePath = `${FileSystem.documentDirectory}secure_${identifier}.enc`;
    await FileSystem.writeAsStringAsync(filePath, encryptedData);
  }

  private async getKey(identifier: string): Promise<CryptoJS.lib.WordArray | null> {
    const keyBase64 = await SecureStore.getItemAsync(`encryption_key_${identifier}`);
    if (!keyBase64) return null;
    return CryptoJS.enc.Base64.parse(keyBase64);
  }

  private async getEncryptedData(identifier: string): Promise<string | null> {
    const filePath = `${FileSystem.documentDirectory}secure_${identifier}.enc`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) return null;
      return await FileSystem.readAsStringAsync(filePath);
    } catch (error) {
      return null;
    }
  }

  private decryptData(encryptedData: string, keyWordArray: CryptoJS.lib.WordArray): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  public async setItem(key: string, value: string): Promise<void> {
    try {
      const keyWordArray = await this.generateKey();
      await this.storeKey(keyWordArray, key);
      const encryptedData = this.encryptData(value, keyWordArray);
      await this.storeEncryptedData(encryptedData, key);
    } catch (error) {
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  public async getItem(key: string): Promise<string | null> {
    try {
      const keyWordArray = await this.getKey(key);
      if (!keyWordArray) return null;

      const encryptedData = await this.getEncryptedData(key);
      if (!encryptedData) return null;

      return this.decryptData(encryptedData, keyWordArray);
    } catch (error) {
      return null;
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`encryption_key_${key}`);
      const filePath = `${FileSystem.documentDirectory}secure_${key}.enc`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to remove data: ${error}`);
    }
  }
}

export const secureUnlimitedStore = new SecureUnlimitedStore();