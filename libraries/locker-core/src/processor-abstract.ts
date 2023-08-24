import debounce from 'lodash-es/debounce';
import Locker from '~/core';
import { LockerItem, LockerProcessorInitOption, OriginLockerItem } from './interfaces';

/**
 * @description 实际处理locker的基类
 */
export default class LockerProcessorAbstract {
  protected option!: LockerProcessorInitOption;

  protected maxBufferSize = 0;

  protected bufferSize = 0;

  protected instance!: Locker<LockerProcessorAbstract>;

  /**
   * @description API 可用性检查
   * @param key
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    return false;
  }

  /**
   * @description 设置存储
   *
   * 1. 检查插入新的数据项后是否会溢出最大存储限制
   * 2. 如果会溢出限制,调用基类 clearDataBySize 方法,尝试清理指定空间
   * 3. 如果清理的空间大小仍旧小于插入项大小停止写入并抛出异常
   * 4. 不会溢出限制则执行写入
   * 5. 写入失败抛出异常
   *
   * @param item
   * @abstract
   */
  async set(item: OriginLockerItem): Promise<void> {
    this.option.logger.error('处理器未实现 set 方法', item);
  }

  /**
   * @description 获取存储
   * @param key
   * @abstract
   */
  async get(key: string): Promise<OriginLockerItem | null> {
    this.option.logger.error('处理器未实现 get 方法', key);
    return null;
  }

  /**
   * @description 需要实现移除存储功能
   * @param key
   * @abstract
   */
  async remove(key: string): Promise<void> {
    this.option.logger.error('处理器未实现 remove 方法', key);
  }

  /**
   * @description 获取所有数据,垃圾回收需要扫描数据是否过期, 如果扫描开销较大建议根据实际情况返回计算属性或缓存结果集
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  async getAllData(): Promise<LockerItem<any>[]> {
    this.option.logger.error('处理器未实现 getAllData 方法');
    return [];
  }

  /**
   * @description 初始化
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  async initialize(option: LockerProcessorInitOption) {
    this.option = option;
    this.maxBufferSize = (option.maximum === undefined || option.maximum) < 0
      ? 0
      : (option.maximum || 0);
    this.instance = option.instance;
    await this.refreshBufferSize();
    this.option.logger.debug('许可的最大内存大小', this.maxBufferSize);
  }

  /**
   * @description 卸载阶段释放资源
   */
  destroy() {
    this.maxBufferSize = 0;
    this.bufferSize = 0;
  }

  /**
   * @description 刷新占用缓冲区大小
   */
  refreshBufferSize = debounce(async () => {
    this.bufferSize = (await this.getAllData()).reduce((totalSize, item) => {
      // eslint-disable-next-line no-param-reassign
      totalSize += item.size;
      return totalSize;
    }, 0);
    this.option.logger.debug('当前占用内存大小: ', this.bufferSize);
  });

  /**
   * @description 按需释放对应空间,不影响超时时间为0的数据
   * @param size 需要腾出的空间大小
   */
  async clearDataBySize(size: number) {
    if (size <= 0) {
      return 0;
    }
    const promiseArr: Promise<unknown>[] = [];
    const removedSize = (await this.getAllData())
      .filter((data) => data.expires > 0)
      .sort((data1, data2) => (
        (data1.updatedAt + data1.expires) > (data2.updatedAt + data2.expires) ? 1 : -1))
      .reduce((removeSize: number, item) => {
        if (removeSize <= size) {
          promiseArr.push(this.remove(item.key));
          // eslint-disable-next-line no-param-reassign
          removeSize += item.size;
        }
        return removeSize;
      }, 0);
    await Promise.all(promiseArr);
    return removedSize;
  }
}
