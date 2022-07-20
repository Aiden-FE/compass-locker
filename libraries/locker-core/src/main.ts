import {
  LockerProcessorAbstract, LockerItem, LockerItemValue, LockerSettings,
} from '~/interfaces';
import Logger from '~/logger';
import {
  getValueSize, getValueType, isExpired,
  valueStringToValue,
  valueToString,
} from '~/utils';

export * from './interfaces';

export class Locker<Processor extends LockerProcessorAbstract> {
  readonly processor: Processor;

  readonly settings: Required<Omit<LockerSettings<Processor>, 'processor'>>;

  readonly logger: Logger;

  readonly prefixKey: string;

  constructor(opts: LockerSettings<Processor>) {
    this.processor = opts.processor;
    this.settings = {
      lockerKey: opts.lockerKey || 'default',
      clearGarbageInterval: opts.clearGarbageInterval === undefined
        ? 15000
        : opts.clearGarbageInterval,
      maximum: opts.maximum === undefined ? 0 : parseInt(String(opts.maximum * 1024 * 1024), 10),
      debug: opts.debug || false,
    };
    this.logger = new Logger({
      debug: this.settings.debug,
    });
    this.prefixKey = `$$COMPASS_LOCKER$$_${this.settings.lockerKey}`;
    this.processor.initialize({
      logger: this.logger,
      maximum: this.settings.maximum,
      prefixKey: this.prefixKey,
    });
    // 定时垃圾回收
    if (this.settings.clearGarbageInterval > 0) {
      setInterval(() => this.processor.clearGarbage(), this.settings.clearGarbageInterval);
    }
    this.logger.success('Locker 准备就绪');
  }

  /**
   * @description 设置存储数据
   */
  async setItem(
    key: string,
    value: LockerItemValue | LockerItemValue[],
    opts?: Pick<LockerItem, 'expires' | 'autoReadRefresh'>,
  ) {
    if (key.length > 64) {
      this.logger.error('key的长度不应超过64位');
      return;
    }
    if (!this.processor.validate('setItem')) {
      this.logger.error('当前运行环境不支持 setItem API.');
      return;
    }

    const valueType = getValueType(value);
    const valueStr = valueToString(value);
    if (valueStr === null) {
      this.logger.error('无法将值进行序列化,请检查数据是否可被 JSON.stringify 处理');
      return;
    }
    const cache = this.getItem<LockerItem>(key, true);
    let expires = 0;
    if (opts?.expires === undefined && cache) {
      expires = cache.expires;
    } else if (opts?.expires !== undefined && opts.expires > 0) {
      expires = opts.expires;
    }
    const item = {
      key: cache?.key || `${this.prefixKey}_${key}`,
      value: valueStr,
      type: valueType,
      expires,
      autoReadRefresh: opts?.autoReadRefresh === undefined && cache
        ? cache.autoReadRefresh
        : (opts?.autoReadRefresh || false),
      size: 0,
      createdAt: cache?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    item.size = getValueSize(JSON.stringify(item));
    this.processor.set(item);
    this.logger.debug('Set item', item);
  }

  /**
   * @description 获取存储数据
   * @param key
   * @param full true 获取全部结构数据, false则只取存储的 value 值
   */
  getItem<T = any>(key: string, full = false): T | null {
    if (!this.processor.validate('getItem')) {
      this.logger.error('当前运行环境不支持 getItem API.');
      return null;
    }
    const originItem = this.processor.get(`${this.prefixKey}_${key}`);
    // 刷新缓存时间
    if (originItem?.autoReadRefresh) {
      originItem.updatedAt = Date.now();
      this.processor.set(originItem);
    }
    const item = valueStringToValue(originItem);
    if (item && isExpired(item)) {
      this.logger.debug(`Get item ${key} 已经过期`);
      return null;
    }
    this.logger.debug(`Get item ${key}`, item);
    if (full) {
      return item as unknown as T;
    } if (item) {
      return item.value as unknown as T;
    }
    return null;
  }

  /**
   * @description 删除存储数据
   * @param key
   */
  async removeItem(key: string) {
    if (!this.processor.validate('removeItem')) {
      this.logger.error('当前运行环境不支持 removeItem API.');
      return;
    }
    this.processor.remove(`${this.prefixKey}_${key}`);
    this.logger.debug(`Remove item ${key}`);
  }

  /**
   * @description 卸载所有存储数据
   */
  async clear() {
    if (!this.processor.validate('clear')) {
      this.logger.error('当前运行环境不支持 clear API.');
      return;
    }
    this.processor.clear();
    this.logger.debug('Clear all items');
  }
}
