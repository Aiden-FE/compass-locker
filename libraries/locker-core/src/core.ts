import {
  LockerItem, LockerItemValue, LockerSettings,
} from '~/interfaces';
import Logger from '~/logger';
import {
  getValueSize,
  getValueType,
  INTERNAL_PREFIX,
  isExpired,
  STRING_DELIMITER,
  valueStringToValue,
  valueToString,
} from '~/utils';
import LockerProcessorAbstract from '~/processor-abstract';

/**
 * @todo
 *  1. 支持设置全局默认超时与是否读取刷新
 *  2. 更新session与memory处理器
 *  3. 支持CI/CD
 */
export default class Locker<Processor extends LockerProcessorAbstract = LockerProcessorAbstract> {
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
      created: () => {},
    };
    this.logger = new Logger({
      debug: this.settings.debug,
    });
    this.prefixKey = `${INTERNAL_PREFIX}${this.settings.lockerKey}`;
    this.processor.initialize({
      logger: this.logger,
      maximum: this.settings.maximum,
      prefixKey: this.prefixKey,
      instance: this,
    }).then(() => {
      // 定时垃圾回收
      if (this.settings.clearGarbageInterval > 0) {
        setInterval(() => this.clearGarbage(), this.settings.clearGarbageInterval);
      }
      opts.created?.();
      this.logger.success('Locker 准备就绪');
    });
  }

  /**
   * @description 设置存储数据
   */
  async setItem(
    key: string,
    value: LockerItemValue | LockerItemValue[],
    opts?: Pick<Partial<LockerItem>, 'expires' | 'autoReadRefresh'>,
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
    const cache = await this.getItem<LockerItem>(key, true);
    let expires = 0;
    if (opts?.expires === undefined && cache) {
      expires = cache.expires;
    } else if (opts?.expires !== undefined && opts.expires > 0) {
      expires = opts.expires;
    }
    const item = {
      key: cache?.key || `${this.prefixKey}${STRING_DELIMITER}${key}`,
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
    await this.processor.set(item);
    this.logger.debug('Set item', item);
  }

  /**
   * @description 获取存储数据
   * @param key
   * @param full true 获取全部结构数据, false则只取存储的 value 值
   */
  async getItem<T = any>(key: string, full = false): Promise<T | null> {
    if (!this.processor.validate('getItem')) {
      this.logger.error('当前运行环境不支持 getItem API.');
      return null;
    }
    const originItem = await this.processor.get(`${this.prefixKey}${STRING_DELIMITER}${key}`);
    // 刷新缓存时间
    if (originItem?.autoReadRefresh) {
      originItem.updatedAt = Date.now();
      await this.processor.set(originItem);
    }
    const item = valueStringToValue(originItem);
    if (item && isExpired(item)) {
      this.logger.debug(`Get item ${key} 已经过期`);
      await this.processor.remove(item.key);
      return null;
    }
    this.logger.debug(`Get item ${key}`, full ? item : item?.value);
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
    await this.processor.remove(`${this.prefixKey}${STRING_DELIMITER}${key}`);
    this.logger.debug(`Remove item ${key}`);
  }

  /**
   * @description 卸载所有存储数据
   */
  async clear() {
    const promiseArr = [] as Promise<unknown>[];
    (await this.processor.getAllData())
      .forEach((item) => promiseArr.push(this.processor.remove(item.key)));
    await Promise.all(promiseArr);
    this.logger.debug('Clear all items');
  }

  /**
   * @description 定期执行的垃圾清理方法
   */
  private async clearGarbage() {
    this.logger.debug('主动垃圾回收机制执行');
    const promiseArr = [] as Promise<unknown>[];
    (await this.processor.getAllData()).forEach((item) => {
      if (isExpired(item)) {
        promiseArr.push(this.processor.remove(item.key));
      }
    });
    await Promise.all(promiseArr);
  }
}
