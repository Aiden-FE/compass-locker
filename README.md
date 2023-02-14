# @compass-aiden/locker
> 数据存储工具

## Feature

* 适用于各平台的数据管理工具
* 跨平台适用,可以运行在任何js环境内,仅需选择对应环境可执行的处理器即可
* 易扩展,自由的定制适用于自身业务的存储工具
* 无依赖的核心模块,Gzip后仅1.64kB
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
  clearGarbageInterval: 15000, // 可选,默认=15000, 垃圾回收间隔,0就是不主动清理,单位ms
  maximum: 0, // 可选,默认=0, 最大存储容量限制, 单位MB, 0就是不限制
  debug: false, // 可选,默认=false, 调试模式开关
})

// 设置存储 option可选,对象结构. expires 超时时间, 单位ms, 0=永不超时,默认为0;autoReadRefresh 数据被读取后自动刷新超时时间,默认为false
localLocker.setItem(key, value, [option]);

// 读取存储 full 是否获取全部的存储结构化数据,默认为false,false则只取存储的value数据
localLocker.getItem(key, [full]);

// 移除存储
localLocker.removeItem(key);

// 清空存储
localLocker.clear();
```

### 定制自己的处理器

继承基类 LockerProcessorAbstract

```typescript
import { LockerProcessorAbstract } from '@compass-aiden/locker';

export default class LockerLocalStorageProcessor extends LockerProcessorAbstract {}
```

实现基类 LockerProcessorAbstract 上定义的方法,如下所示:

```typescript

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
  initialize(option: LockerProcessorInitOption) {}

  /**
   * @description 定期执行的垃圾清理方法
   * @abstract
   */
  clearGarbage() {}

  /**
   * @description API 可用性检查
   * @param key
   * @abstract
   */
  validate(key: 'setItem' | 'getItem' | 'clear' | 'removeItem'): boolean {
    return false;
  }

  /**
   * @description 设置存储
   * @param item
   * @abstract
   */
  set(item: OriginLockerItem): void {}

  /**
   * @description 获取存储
   * @param key
   * @abstract
   */
  get(key: string): OriginLockerItem | null {}

  /**
   * @description 移除存储
   * @param key
   * @abstract
   */
  remove(key: string): void {}

  /**
   * @description 清空所有存储
   * @abstract
   */
  clear(): void {}
}

```

## 项目开发

### 安装管理工具
#### 全局安装 (推荐)

`npm install rush -g `

#### 通过node安装

`node common/scripts/install-run-rush.js install`

### 恢复依赖

`rush update`

### 为子项目管理依赖

`cd packages/[Project name]` 进入待开发的子项目

`rush add -p [Package name]` 添加依赖项,添加--dev参数则表示为开发依赖

详见: [#1457](https://github.com/microsoft/rushstack/issues/1457) ,目前建议
手动从package.json中移除依赖,执行`rush update --recheck`

### 执行子项目命令

`cd packages/[Project name]` 进入待开发的子项目

`rushx [script]` 执行子项目script开发脚本

### 提交代码

`git add -A` 暂存代码

`git commit -m "feat(#1): Add feat"` 建议参考: https://rushjs.io/zh-cn/pages/best_practices/change_logs/

### 项目构建

`rush build`

### 添加一个新库

在 packages 新建一个项目后,在rush.json内添加项目信息,结构如下:

```json
{
  "projects": [
    {
      "packageName": "[package name]",
      "projectFolder": "packages/[package path]",
      "reviewCategory": "packages",
      "versionPolicyName": "[package policy name]"
    }
  ]
}
```

### 发布

`rush check` 检查对等依赖

`rush change` 生成changefile.json

`rush version --bump` 更新版本

`cd common/autoinstallers/common-command`
`npm run publish:all` 发布包

提交所有变更:

`git add -A`

`git commit -m [message]`

`git push`
