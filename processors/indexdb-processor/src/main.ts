import { LockerProcessorAbstract, OriginLockerItem } from '@compass-aiden/locker';
import { set, get, del, values } from 'idb-keyval';

export default class LockerLocalStorageProcessor extends LockerProcessorAbstract {
  // eslint-disable-next-line class-methods-use-this
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
      return true;
    } else {
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
    await set(item.key, JSON.stringify(item));
  }

  // eslint-disable-next-line class-methods-use-this
  async get(key: string) {
    const data = await get(key);
    try {
      return data ? (JSON.parse(data) as OriginLockerItem) : null;
    } catch (e) {
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async remove(key: string) {
    await del(key);
  }

  async getAllData() {
    return (await values()).map((item) => {
      try {
        return item ? (JSON.parse(item) as OriginLockerItem) : null;
      } catch (e) {
        return null;
      }
    }).filter((data) => !!data) as OriginLockerItem[];
  }
}
