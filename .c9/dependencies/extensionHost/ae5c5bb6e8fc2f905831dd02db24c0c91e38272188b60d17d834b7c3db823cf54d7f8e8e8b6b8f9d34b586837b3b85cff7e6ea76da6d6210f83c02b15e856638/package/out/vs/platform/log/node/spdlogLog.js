/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "winston", "vs/platform/log/common/log"], function (require, exports, winston, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpdLogLogger = exports.WinstonRotatingLogger = exports.getLogDir = void 0;
    class File extends winston.transports.File {
        constructor(options) {
            super(options);
            this.eol = '';
        }
    }
    function getLogDir(filename) {
        const parts = filename.match(/(.*)[\/\\]/);
        return parts && parts.length > 1 ? parts[1] : '';
    }
    exports.getLogDir = getLogDir;
    class WinstonRotatingLogger {
        constructor(name, filename, filesize, filecount) {
            const transport = new File({
                dirname: getLogDir(filename),
                filename: `${name}.log`,
                format: winston.format.printf(({ message }) => message),
                maxsize: filesize,
                maxFiles: filecount,
            });
            this.winstonLogger = winston.createLogger({
                transports: [transport],
            });
        }
        // winston log levels: https://github.com/winstonjs/winston#logging
        trace(message) {
            this.winstonLogger.log({
                level: 'verbose',
                message: message,
            });
        }
        debug(message) {
            this.winstonLogger.log({
                level: 'debug',
                message: message,
            });
        }
        info(message) {
            this.winstonLogger.log({
                level: 'info',
                message: message,
            });
        }
        warn(message) {
            this.winstonLogger.log({
                level: 'warn',
                message: message,
            });
        }
        error(message) {
            this.winstonLogger.log({
                level: 'error',
                message: message,
            });
        }
        critical(message) {
            this.winstonLogger.log({
                level: 'error',
                message: message,
            });
        }
        setLevel(level) {
            this.winstonLogger.configure({
                level: this.parseLogLevel(level),
            });
        }
        flush() { }
        parseLogLevel(level) {
            switch (level) {
                case log_1.LogLevel.Error:
                case log_1.LogLevel.Critical: return 'error';
                case log_1.LogLevel.Warning: return 'warn';
                case log_1.LogLevel.Info: return 'info';
                case log_1.LogLevel.Debug: return 'debug';
                case log_1.LogLevel.Trace: return 'trace';
                default: throw new Error('Invalid log level');
            }
        }
    }
    exports.WinstonRotatingLogger = WinstonRotatingLogger;
    class SpdLogLogger extends log_1.AbstractMessageLogger {
        constructor(name, filepath, _rotating, _donotUseFormatters, level) {
            super();
            this.name = name;
            this.filepath = filepath;
            this._logger = this._createDefaultLogger();
            this._register(this.onDidChangeLogLevel(level => {
                this._logger.setLevel(level);
            }));
            this.setLevel(level);
        }
        _createDefaultLogger() {
            return new WinstonRotatingLogger(this.name, this.filepath, 1024 * 1024 * 5, 6);
        }
        log(level, message) {
            switch (level) {
                case log_1.LogLevel.Trace:
                    this._logger.trace(message);
                    break;
                case log_1.LogLevel.Debug:
                    this._logger.debug(message);
                    break;
                case log_1.LogLevel.Info:
                    this._logger.info(message);
                    break;
                case log_1.LogLevel.Warning:
                    this._logger.warn(message);
                    break;
                case log_1.LogLevel.Error:
                    this._logger.error(message);
                    break;
                case log_1.LogLevel.Critical:
                    this._logger.critical(message);
                    break;
                default: throw new Error('Invalid log level');
            }
        }
        flush() {
            this._logger.flush();
        }
        dispose() {
        }
    }
    exports.SpdLogLogger = SpdLogLogger;
});
//# sourceMappingURL=spdlogLog.js.map