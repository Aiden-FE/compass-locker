import { LockerProcessorAbstract, OriginLockerItem} from '@compass-aiden/locker';

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
        this.option.logger.warn('无法清理出指定内存大小,本次存储存在溢出风险!请移除部分永久数据或提高最大存储容量.');
      }
    }
    try {
      localStorage.setItem(item.key, JSON.stringify(item));
      this.refreshBufferSize();
    } catch (err) {
      if (this.isQuotaExceededError(err)) {
        this.option.logger.warn('本次存储已溢出!尝试腾出对应存储空间大小');
        const removedSize = await this.clearDataBySize(item.size);
        if (removedSize < item.size) {
          this.option.logger.error('本次存储已溢出!无法设置数据.');
          return;
        }
        localStorage.setItem(item.key, JSON.stringify(item));
        this.option.logger.warn('本次存储已写入,请移除部分永久数据或提高最大存储容量,否则将影响后续写入.');
        this.refreshBufferSize();
      } else {
        this.option.logger.error(err);
      }
    }
    this.option.logger.debug('当前占用内存大小', this.bufferSize);
  }

  // eslint-disable-next-line class-methods-use-this
  async get(key: string) {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as OriginLockerItem) : null;
  }

  async remove(key: string) {
    localStorage.removeItem(key);
    this.refreshBufferSize();
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
