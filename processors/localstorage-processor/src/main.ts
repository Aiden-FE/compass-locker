import { LockerProcessorAbstract, OriginLockerItem } from '@compass-aiden/locker';

export default class LockerLocalStorageProcessor extends LockerProcessorAbstract {
  // eslint-disable-next-line class-methods-use-this
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    switch (key) {
      case 'setItem':
        return localStorage?.setItem && typeof localStorage.setItem === 'function';
      case 'getItem':
        return localStorage?.getItem && typeof localStorage.getItem === 'function';
      case 'removeItem':
        return localStorage?.removeItem && typeof localStorage.removeItem === 'function';
      case 'clear':
        return localStorage?.clear && typeof localStorage.clear === 'function';
      default:
        return false;
    }
  }

  async set(item: OriginLockerItem) {
    if (this.maxBufferSize > 0 && (item.size + this.bufferSize) > this.maxBufferSize) {
      const removeSize = await this.clearDataBySize(item.size);
      if (removeSize < item.size) {
        this.option.logger.error('存储失败,超出最大容量限制!请移除部分永久数据或提高最大存储容量.');
        throw new Error('存储失败,超出最大容量限制!请移除部分永久数据或提高最大存储容量.');
      }
    }
    localStorage.setItem(item.key, JSON.stringify(item));
  }

  // eslint-disable-next-line class-methods-use-this
  async get(key: string) {
    const data = localStorage.getItem(key);
    try {
      return data ? (JSON.parse(data) as OriginLockerItem) : null;
    } catch (e) {
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async remove(key: string) {
    localStorage.removeItem(key);
  }

  async getAllData() {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.option.prefixKey)) {
        keys.push(key);
      }
    }
    const getDataPromise = [] as Promise<OriginLockerItem | null>[];
    keys.forEach((key) => getDataPromise.push(this.get(key)));
    return (await Promise.all(getDataPromise))
      .filter((data) => !!data) as OriginLockerItem[];
  }
}
