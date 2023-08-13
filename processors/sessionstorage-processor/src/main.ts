import { LockerProcessorAbstract, OriginLockerItem } from '@compass-aiden/locker';

export default class LockerSessionStorageProcessor extends LockerProcessorAbstract {
  // eslint-disable-next-line class-methods-use-this
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    switch (key) {
      case 'setItem':
        return sessionStorage?.setItem && typeof sessionStorage.setItem === 'function';
      case 'getItem':
        return sessionStorage?.getItem && typeof sessionStorage.getItem === 'function';
      case 'removeItem':
        return sessionStorage?.removeItem && typeof sessionStorage.removeItem === 'function';
      case 'clear':
        return sessionStorage?.clear && typeof sessionStorage.clear === 'function';
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
    sessionStorage.setItem(item.key, JSON.stringify(item));
  }

  // eslint-disable-next-line class-methods-use-this
  async get(key: string) {
    const data = sessionStorage.getItem(key);
    return data ? (JSON.parse(data) as OriginLockerItem) : null;
  }

  // eslint-disable-next-line class-methods-use-this
  async remove(key: string) {
    sessionStorage.removeItem(key);
  }

  async getAllData() {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
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
