interface LoggerOptions {
  logPrefix?: string
  debug?: boolean
}

function generateTagStyle(bgColor: string, color = '#fff') {
  return `color: ${color};background-color: ${bgColor};padding: 2px 4px;margin-right: 4px;`;
}

/**
 * @description 日志记录
 */
export default class Logger {
  private readonly debugMode: boolean;

  /** 日志前缀 */
  private readonly prefix: string;

  private static readonly prefix = 'Locker';

  constructor(opts?: LoggerOptions) {
    this.prefix = opts?.logPrefix || Logger.prefix;
    this.debugMode = opts?.debug || false;
  }

  public info(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#31CCEC'),
      `【${this.prefix} info】`,
      'color: #31CCEC;',
      ...args,
    );
  }

  static info(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#31CCEC'),
      `【${this.prefix} info】`,
      'color: #31CCEC;',
      ...args,
    );
  }

  public success(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#21BA45'),
      `【${this.prefix} success】`,
      'color: #21BA45;',
      ...args,
    );
  }

  static success(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#21BA45'),
      `【${this.prefix} success】`,
      'color: #21BA45;',
      ...args,
    );
  }

  public warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#F2C037'),
      `【${this.prefix} warning】`,
      'color: #F2C037;',
      ...args,
    );
  }

  static warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '%c%s%c%s',
      generateTagStyle('#F2C037'),
      `【${this.prefix} warning】`,
      'color: #F2C037;',
      ...args,
    );
  }

  public error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(
      '%c%s%c%s',
      generateTagStyle('#C10015'),
      `【${this.prefix} error】`,
      'font-size: 12px;',
      ...args,
    );
  }

  static error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(
      '%c%s%c%s',
      generateTagStyle('#C10015'),
      `【${this.prefix} error】`,
      'font-size: 12px;',
      ...args,
    );
  }

  /**
   * @description 仅在debug模式下打印信息
   * @param args
   */
  public debug(...args: unknown[]) {
    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log(
        '%c%s%c%s',
        generateTagStyle('#26A69A'),
        `【${this.prefix} debug】`,
        'color: #26A69A;',
        ...args,
      );
    }
  }
}
