import { LockerProcessorAbstract, LockerProcessorInitOption, OriginLockerItem } from '@compass-aiden/locker';

export default class LockerLocalStorageProcessor extends LockerProcessorAbstract {
  private option!: LockerProcessorInitOption;

  private maxBufferSize = 0;

  private bufferSize = 0;

  initialize(option: LockerProcessorInitOption) {
    this.option = option;
    this.maxBufferSize = (option.maximum === undefined || option.maximum) < 0
      ? 0
      : (option.maximum || 0);
    this.updateBufferSize();
    this.option.logger.debug('初始化内存大小', this.bufferSize);
    this.option.logger.debug('许可的最大内存大小', this.maxBufferSize);
  }

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

  set(item: OriginLockerItem) {
    if (this.maxBufferSize > 0 && (item.size + this.bufferSize) > this.maxBufferSize) {
      const removeSize = this.clearDataBySize(item.size);
      if (removeSize < item.size) {
        this.option.logger.warn('无法清理出指定内存大小,本次存储存在溢出风险!请降低存储的不失效数据大小或提高最大许可存储容量.');
      }
    }
    try {
      localStorage.setItem(item.key, JSON.stringify(item));
      this.updateBufferSize();
    } catch (err) {
      if (this.isQuotaExceededError(err)) {
        this.option.logger.error('本次存储已溢出!请降低存储的不失效数据大小或提高最大许可存储容量.');
        this.clearDataBySize(item.size);
        localStorage.setItem(item.key, JSON.stringify(item));
        this.updateBufferSize();
      }
    }
    this.option.logger.debug('当前占用内存大小', this.bufferSize);
  }

  // eslint-disable-next-line class-methods-use-this
  get(key: string): OriginLockerItem | null {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as OriginLockerItem) : null;
  }

  remove(key: string) {
    localStorage.removeItem(key);
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
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.option.prefixKey)) {
        keys.push(key);
      }
    }
    return keys;
  }

  // eslint-disable-next-line class-methods-use-this
  private isQuotaExceededError(err: unknown): boolean {
    return (
      err instanceof DOMException
      // everything except Firefox
      && (err.code === 22
        // Firefox
        || err.code === 1014
        // test name field too, because code might not be present
        // everything except Firefox
        || err.name === 'QuotaExceededError'
        // Firefox
        || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }
}
