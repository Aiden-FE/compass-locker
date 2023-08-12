import Logger from '~/logger';
import LockerProcessorAbstract from '~/processor-abstract';
import Locker from '~/core';

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
   * @description 运行实例
   */
  instance: Locker;

  /**
   * @description 最大容量限制, 单位MB, 0就是不限制
   * @default 0
   */
  maximum?: number
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

  /**
   * @description 实例创建完成后的回调函数
   */
  created?: () => void
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
