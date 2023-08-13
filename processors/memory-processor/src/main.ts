import { LockerProcessorAbstract, OriginLockerItem } from '@compass-aiden/locker';

export default class LockerMemoryStorageProcessor extends LockerProcessorAbstract {
  private buffer = new Map<string, OriginLockerItem>();

  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    switch (key) {
      case 'setItem':
        return this.buffer && typeof this.buffer.set === 'function';
      case 'getItem':
        return this.buffer && typeof this.buffer.get === 'function';
      case 'removeItem':
        return this.buffer && typeof this.buffer.delete === 'function';
      case 'clear':
        return this.buffer && typeof this.buffer.clear === 'function';
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
    this.buffer.set(item.key, item);
  }

  async get(key: string) {
    return this.buffer.get(key) || null;
  }

  async remove(key: string) {
    this.buffer.delete(key);
  }

  async getAllData() {
    const result: OriginLockerItem[] = [];
    this.buffer.forEach((item) => {
      result.push(item);
    });
    return result;
  }
}
