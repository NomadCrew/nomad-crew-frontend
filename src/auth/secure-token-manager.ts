import { secureUnlimitedStore } from './secure-unlimited-store';

class BasicTokenManager {
  private secureStore = secureUnlimitedStore;

  public async setItem(key: string, value: string) {
    return this.secureStore.setItem(key, value);
  }
  public async getItem(key: string) {
    return this.secureStore.getItem(key);
  }
  public async removeItem(key: string) {
    return this.secureStore.removeItem(key);
  }
}
export const secureTokenManager = new BasicTokenManager();
