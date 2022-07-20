import Logger from '~/logger';

/**
 * @description locker处理器的初始化选项
 */
export interface LockerProcessorInitOption {
  /**
   * @description 日志实例
   */
  logger: Logger

  /**
   * @description 前缀key
   */
  prefixKey: string

  /**
   * @description 最大容量限制, 单位MB, 0就是不限制
   * @default 0
   */
  maximum?: number
}

/**
 * @description 实际处理locker的抽象类
 */
export class LockerProcessorAbstract {
  /**
   * @description 初始化
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  initialize(option: LockerProcessorInitOption) {}

  /**
   * @description 定期执行的垃圾清理方法
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  clearGarbage() {}

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
   * @param item
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  set(item: OriginLockerItem): void {}

  /**
   * @description 获取存储
   * @param key
   * @abstract
   */
  // @ts-ignore
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  get(key: string): OriginLockerItem | null {}

  /**
   * @description 移除存储
   * @param key
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  remove(key: string): void {}

  /**
   * @description 清空所有存储
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  clear(): void {}
}

export interface OriginLockerItem extends LockerItem {
  value: string
}

export interface LockerSettings<Processor extends LockerProcessorAbstract> {
  /**
   * @description 实际处理器
   */
  processor: Processor

  /**
   * @description 唯一存储key,用来跟其他Locker实例区分
   */
  lockerKey?: string

  /**
   * @description 垃圾回收间隔,0就是不主动清理,单位ms
   * @default 15000
   */
  clearGarbageInterval?: number

  /**
   * @description 最大容量限制, 单位MB, 0就是不限制
   * @default 0
   */
  maximum?: number

  /**
   * @description 调试模式
   * @default false
   */
  debug?: boolean
}

export type LockerItemType = 'undefined'
| 'null'
| 'string'
| 'number'
| 'boolean'
| 'object'
| 'array';

export type LockerItemValue = undefined
| null
| string
| number
| boolean
| object;

/**
 * @description 单个存储单元
 */
export interface LockerItem {
  /**
   * @description 标识key,长度不应超过64位
   */
  key: string

  /**
   * @description 存储值
   */
  value: LockerItemValue | LockerItemValue[]

  /**
   * @description 超时时间, 单位ms, 0=永不超时
   * @default 0
   */
  expires: number // ms

  /**
   * @description 数据被读取后自动刷新超时时间
   * @default false
   */
  autoReadRefresh: boolean

  /**
   * @description 数据存储的类型,自动推断
   */
  type: LockerItemType

  /**
   * @description 数据大小,自动推断
   */
  size: number // Byte

  /**
   * @description 创建时间
   */
  createdAt: number;

  /**
   * @description 更新时间,依据更新时间来决定超时时间
   */
  updatedAt: number;
}
