import { LockerProcessorAbstract, LockerProcessorInitOption, OriginLockerItem } from '@compass-aiden/locker';

export default class LockerMemoryStorageProcessor extends LockerProcessorAbstract {
  private option!: LockerProcessorInitOption;

  private maxBufferSize = 0;

  private bufferSize = 0;

  private buffer = new Map<string, OriginLockerItem>();

  initialize(option: LockerProcessorInitOption) {
    this.option = option;
    this.maxBufferSize = (option.maximum === undefined || option.maximum) < 0
      ? 0
      : (option.maximum || 0);
    this.option.logger.debug('初始化内存大小', this.bufferSize);
    this.option.logger.debug('许可的最大内存大小', this.maxBufferSize);
  }

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

  set(item: OriginLockerItem) {
    if (this.maxBufferSize > 0 && (item.size + this.bufferSize) > this.maxBufferSize) {
      const removeSize = this.clearDataBySize(item.size);
      if (removeSize < item.size) {
        this.option.logger.warn('存储失败,超出最大容量限制!无法清理出指定内存大小的空间,请降低存储的不失效数据体积或提高最大许可存储容量.');
        return;
      }
    }
    this.buffer.set(item.key, item);
    this.updateBufferSize();
    this.option.logger.debug('当前占用内存大小', this.bufferSize, this.buffer);
  }

  get(key: string): OriginLockerItem | null {
    return this.buffer.get(key) || null;
  }

  remove(key: string) {
    this.buffer.delete(key);
    this.updateBufferSize();
  }

  clear() {
    this.getAllKey().forEach((key) => this.remove(key));
  }

  private updateBufferSize() {
    this.bufferSize = this.getAllData().reduce((totalSize, item) => {
      // eslint-disable-next-line no-param-reassign
      totalSize += item.size;
      return totalSize;
    }, 0);
  }

  private clearDataBySize(size: number) {
    if (size <= 0) {
      return 0;
    }
    this.option.logger.debug('内存空间不足,尝试清理对应大小', size);
    return this.getAllData()
      .filter((data) => data.expires > 0)
      .sort((data1, data2) => (
        (data1.updatedAt + data1.expires) > (data2.updatedAt + data2.expires) ? 1 : -1))
      .reduce((removeSize: number, item) => {
        if (removeSize <= size) {
          this.remove(item.key);
          // eslint-disable-next-line no-param-reassign
          removeSize += item.size;
        }
        return removeSize;
      }, 0);
  }

  private getAllData(): OriginLockerItem[] {
    return this.getAllKey()
      .map((key) => this.get(key))
      .filter((data) => !!data) as OriginLockerItem[];
  }

  private getAllKey() {
    const keys: string[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const key of this.buffer.keys()) {
      keys.push(key);
    }
    return keys;
  }
}
