import {
  LockerItem, LockerItemType, LockerItemValue, OriginLockerItem,
} from '~/interfaces';

export const STRING_DELIMITER = '―';

export const INTERNAL_PREFIX = `CPLocker${STRING_DELIMITER}` as const;

/**
 * @description 获取数据大小
 * @param value
 */
export function getValueSize(value: string): number {
  return new Blob([value]).size;
}

/**
 * @description 将值序列化为string
 * @param value
 */
export function valueToString(value: LockerItemValue | LockerItemValue[]) {
  function convertEmptyToString(v: LockerItemValue) {
    if (v === undefined) {
      return 'undefined';
    }
    if (v === null) {
      return 'null';
    }
    return v;
  }
  try {
    if (Array.isArray(value)) {
      return JSON.stringify(value.map((v) => convertEmptyToString(v)));
    }
    return JSON.stringify(convertEmptyToString(value));
  } catch (e) {
    return null;
  }
}

/**
 * @description 将存储的字符串值转换为实际值
 * @param item
 */
export function valueStringToValue(item: OriginLockerItem | null): LockerItem<any> | null {
  if (!item) {
    return null;
  }
  let value = JSON.parse(item.value);
  if (item.type === 'array' && Array.isArray(value)) {
    value = value.map((v) => {
      if (v === 'undefined') {
        return undefined;
      }
      if (v === 'null') {
        return null;
      }
      return v;
    });
  } else if (item.type === 'undefined' && value === 'undefined') {
    value = undefined;
  } else if (item.type === 'null' && value === 'null') {
    value = null;
  }
  return {
    ...item,
    value,
  };
}

/**
 * @description 缓存是否过期
 *
 * @param item
 * @return {boolean} true 过期 false 未过期
 */
export function isExpired(item: LockerItem<unknown>) {
  return (item.expires !== 0 && Date.now()) > (item.expires + new Date(item.updatedAt).getTime());
}

/**
 * @description 获取值类型
 * @param value
 */
export function getValueType(value: LockerItemValue | LockerItemValue[]): LockerItemType {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  switch (typeof value) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    case 'undefined':
      return 'undefined';
    case 'object':
      return 'object';
    case 'bigint':
    case 'function':
    case 'symbol':
    default:
      throw new Error('不受支持的值类型');
  }
}
