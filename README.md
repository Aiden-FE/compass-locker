# @compass-aiden/locker
> 数据存储工具

## Feature

* 适用于各平台的数据管理工具
* 跨平台适用,可以运行在任何js环境内,仅需选择对应环境可执行的处理器即可
* 易扩展,自由的定制适用于自身业务的存储工具
* 无依赖的核心模块,Gzip后仅3.88kB
* 可控制存储数据的失效时间,并支持数据读取后刷新失效时间
* 支持限制存储数据的最大容量

## Roadmap

- [x] 增加 localStorage 存储处理器
- [x] 增加 sessionStorage 存储处理器
- [x] 增加 memory 存储处理器
- [ ] 增加 IndexDB 存储处理器
- [ ] 增加 Redis 存储处理器

## Getting Started

### 安装依赖

`npm install @compass-aiden/locker`

### 安装处理器

`npm install @compass-aiden/locker-[processor_name]-processor`

可用的处理列表:

* `@compass-aiden/locker-localstorage-processor` localStorage处理器,可运行在web环境中
* `@compass-aiden/locker-sessionstorage-processor` sessionStorage处理器,可运行在web环境中
* `@compass-aiden/locker-memory-processor` memory处理器,可运行在任何js环境中

### 使用

```typescript
import {Locker} from "@compass-aiden/locker";
import LockerLocalStorageProcessor from "@compass-aiden/locker-localstorage-processor";

// 初始化实例
const localLocker = new Locker({
  processor: new LockerLocalStorageProcessor(), // 实际处理器,可任意替换当前环境可用的处理器
  lockerKey: 'user_id', // 可选, 唯一存储key,用来跟其他Locker实例区分或用来隔离用户数据
  // 更多可配置项参考
});

// 设置存储 option可选,对象结构. expires 超时时间, 单位ms, 0=永不超时,默认为0;autoReadRefresh 数据被读取后自动刷新超时时间,默认为false
localLocker.setItem(key, value, [option]);

// 读取存储 option.full 是否获取全部的存储结构化数据,默认为false,false则只取存储的value数据
localLocker.getItem(key, [option]);

// 移除存储
localLocker.removeItem(key);

// 清空存储
localLocker.clear();

// 页面卸载阶段前主动释放内部变量
localLocker.destroy();
```

### 初始化配置项

```typescript
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
   * @description 默认写入数据的超时设置,0就是不超时,单位ms
   * @default 1000 * 10
   */
  defaultExpires?: number;

  /**
   * @description 数据被读取后是否自动刷新,从读取时间重新计算超时
   * @default false
   */
  autoReadRefresh?: boolean;

  /**
   * @description 实例创建完成后的回调函数
   */
  created?: () => void
}
```

### 定制自己的处理器

继承基类 LockerProcessorAbstract

```typescript
import { LockerProcessorAbstract } from '@compass-aiden/locker';

export default class LockerLocalStorageProcessor extends LockerProcessorAbstract {}
```

实现基类 LockerProcessorAbstract 上定义的方法,主要需实现的函数如下所示:

```typescript
/**
 * @description 实际处理locker的基类
 */
export class LockerProcessorAbstract {
  /**
   * @description API 可用性检查
   * @param key
   * @abstract
   */
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {}
  
  /**
   * @description 设置存储
   *
   * 1. 检查插入新的数据项后是否会溢出最大存储限制
   * 2. 如果会溢出限制,调用基类 clearDataBySize 方法,尝试清理指定空间
   * 3. 如果清理的空间大小仍旧小于插入项大小停止写入并抛出异常
   * 4. 不会溢出限制则执行写入
   * 5. 写入完成执行基类 refreshBufferSize 方法,同步最新存储大小,流程结束. 执行refreshBufferSize方法无需await
   * 6. 写入失败抛出异常
   *
   * @param item
   * @abstract
   */
  async set(item: OriginLockerItem): Promise<void> {}
  
  /**
   * @description 获取存储
   * @param key
   * @abstract
   */
  async get(key: string): Promise<OriginLockerItem | null> {}
  
  /**
   * @description 需要实现移除存储功能, 删除成功后调用基类 refreshBufferSize 方法,无需await
   * @param key
   * @abstract
   */
  async remove(key: string): Promise<void> {}
  
  /**
   * @description 获取所有数据,垃圾回收需要扫描数据是否过期, 如果扫描开销较大建议根据实际情况返回计算属性或缓存结果集
   * @abstract
   */
  async getAllData(): Promise<LockerItem[]> {}
}

```
