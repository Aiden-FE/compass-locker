import { Logger } from '@compass-aiden/utils';
import {
  LockerItem, LockerItemValue, LockerSettings,
} from '~/interfaces';
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

export default class Locker<Processor extends LockerProcessorAbstract = LockerProcessorAbstract> {
  private readonly processor: Processor;

  private readonly settings: Required<Omit<LockerSettings<Processor>, 'processor'>>;

  private readonly logger: Logger;

  private readonly prefixKey: string;

  private garbageTimer?: number;

  constructor(opts: LockerSettings<Processor>) {
    this.processor = opts.processor;
    this.settings = {
      lockerKey: opts.lockerKey || 'default',
      clearGarbageInterval: opts.clearGarbageInterval === undefined
        ? 1000 * 15
        : opts.clearGarbageInterval,
      maximum: opts.maximum === undefined ? 0 : parseInt(String(opts.maximum * 1024 * 1024), 10),
      debug: opts.debug || false,
      autoReadRefresh: opts.autoReadRefresh || false,
      defaultExpires: typeof opts.defaultExpires === 'undefined' ? 1000 * 10 : opts.defaultExpires,
      created: () => {},
    };
    this.logger = new Logger();
    this.logger.updateConfig({
      subject: 'CPLocker',
      logLevel: this.settings.debug ? 'debug' : 'log',
    });
    this.prefixKey = `${INTERNAL_PREFIX}${this.settings.lockerKey}`;
    this.processor.initialize({
      logger: this.logger,
      maximum: this.settings.maximum,
      prefixKey: this.prefixKey,
      instance: this,
    }).then(() => {
      // 定时垃圾回收
      if (this.settings.clearGarbageInterval > 0 && this.garbageTimer === undefined) {
        this.garbageTimer = setInterval(
          () => this.clearGarbage(),
          this.settings.clearGarbageInterval,
        );
      }
      opts.created?.();
      this.logger.success('Locker 准备就绪');
    });
  }

  /**
   * @description 主动卸载释放内部资源
   */
  destroy() {
    this.logger.debug('开始执行卸载');
    this.processor.destroy();
    if (this.garbageTimer) {
      clearInterval(this.garbageTimer);
      this.garbageTimer = undefined;
    }
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
    const cache = await this.getItem<LockerItem>(key, { full: true });
    let { autoReadRefresh, defaultExpires } = this.settings;
    if (opts?.expires === undefined && cache) {
      defaultExpires = cache.expires;
    } else if (opts?.expires !== undefined) {
      defaultExpires = opts.expires;
    }
    if (opts?.autoReadRefresh === undefined && cache) {
      autoReadRefresh = cache.autoReadRefresh;
    } else if (opts?.autoReadRefresh !== undefined) {
      autoReadRefresh = opts.autoReadRefresh;
    }
    const item = {
      key: cache?.key || `${this.prefixKey}${STRING_DELIMITER}${key}`,
      value: valueStr,
      type: valueType,
      expires: defaultExpires,
      autoReadRefresh,
      size: 0,
      createdAt: cache?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    item.size = getValueSize(JSON.stringify(item));
    await this.processor.set(item);
    this.logger.debug('Set item', item);
    this.processor.refreshBufferSize();
  }

  /**
   * @description 获取存储数据
   * @param key
   * @param [option]
   */
  async getItem<T = any>(key: string, option?: { full?: boolean }): Promise<T | null> {
    const { full } = {
      full: false,
      ...option,
    };

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
    this.processor.refreshBufferSize();
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
    this.processor.refreshBufferSize();
  }

  /**
   * @description 定期执行的垃圾清理方法
   */
  private async clearGarbage() {
    const promiseArr = [] as Promise<unknown>[];
    const removedSize = (await this.processor.getAllData()).reduce<number>((rmSize, item) => {
      if (isExpired(item)) {
        promiseArr.push(this.processor.remove(item.key));
        return item.size + rmSize;
      }
      return rmSize;
    }, 0);
    await Promise.all(promiseArr);
    this.logger.debug('主动垃圾回收机制执行,本次回收大小: ', removedSize);
    if (removedSize > 0) {
      this.processor.refreshBufferSize();
    }
  }
}
