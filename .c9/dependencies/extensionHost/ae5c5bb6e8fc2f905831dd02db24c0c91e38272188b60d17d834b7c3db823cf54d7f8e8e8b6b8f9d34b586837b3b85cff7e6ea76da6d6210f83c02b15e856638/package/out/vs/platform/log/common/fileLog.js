/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/bufferLog", "vs/platform/log/common/log"], function (require, exports, async_1, buffer_1, resources_1, files_1, instantiation_1, bufferLog_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileLoggerService = exports.FileLogger = void 0;
    const MAX_FILE_SIZE = 5 * files_1.ByteSize.MB;
    let FileLogger = class FileLogger extends log_1.AbstractLogger {
        constructor(name, resource, level, donotUseFormatters, fileService) {
            super();
            this.name = name;
            this.resource = resource;
            this.donotUseFormatters = donotUseFormatters;
            this.fileService = fileService;
            this.backupIndex = 1;
            this.setLevel(level);
            this.queue = this._register(new async_1.Queue());
            this.initializePromise = this.initialize();
        }
        trace() {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this._log(log_1.LogLevel.Trace, (0, log_1.format)(arguments));
            }
        }
        debug() {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this._log(log_1.LogLevel.Debug, (0, log_1.format)(arguments));
            }
        }
        info() {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this._log(log_1.LogLevel.Info, (0, log_1.format)(arguments));
            }
        }
        warn() {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this._log(log_1.LogLevel.Warning, (0, log_1.format)(arguments));
            }
        }
        error() {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                const arg = arguments[0];
                if (arg instanceof Error) {
                    const array = Array.prototype.slice.call(arguments);
                    array[0] = arg.stack;
                    this._log(log_1.LogLevel.Error, (0, log_1.format)(array));
                }
                else {
                    this._log(log_1.LogLevel.Error, (0, log_1.format)(arguments));
                }
            }
        }
        critical() {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this._log(log_1.LogLevel.Critical, (0, log_1.format)(arguments));
            }
        }
        flush() {
        }
        async initialize() {
            try {
                await this.fileService.createFile(this.resource);
            }
            catch (error) {
                if (error.fileOperationResult !== 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                    throw error;
                }
            }
        }
        _log(level, message) {
            this.queue.queue(async () => {
                await this.initializePromise;
                let content = await this.loadContent();
                if (content.length > MAX_FILE_SIZE) {
                    await this.fileService.writeFile(this.getBackupResource(), buffer_1.VSBuffer.fromString(content));
                    content = '';
                }
                if (this.donotUseFormatters) {
                    content += message;
                }
                else {
                    content += `[${this.getCurrentTimestamp()}] [${this.name}] [${this.stringifyLogLevel(level)}] ${message}\n`;
                }
                await this.fileService.writeFile(this.resource, buffer_1.VSBuffer.fromString(content));
            });
        }
        getCurrentTimestamp() {
            const toTwoDigits = (v) => v < 10 ? `0${v}` : v;
            const toThreeDigits = (v) => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v;
            const currentTime = new Date();
            return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
        }
        getBackupResource() {
            this.backupIndex = this.backupIndex > 5 ? 1 : this.backupIndex;
            return (0, resources_1.joinPath)((0, resources_1.dirname)(this.resource), `${(0, resources_1.basename)(this.resource)}_${this.backupIndex++}`);
        }
        async loadContent() {
            try {
                const content = await this.fileService.readFile(this.resource);
                return content.value.toString();
            }
            catch (e) {
                return '';
            }
        }
        stringifyLogLevel(level) {
            switch (level) {
                case log_1.LogLevel.Critical: return 'critical';
                case log_1.LogLevel.Debug: return 'debug';
                case log_1.LogLevel.Error: return 'error';
                case log_1.LogLevel.Info: return 'info';
                case log_1.LogLevel.Trace: return 'trace';
                case log_1.LogLevel.Warning: return 'warning';
            }
            return '';
        }
    };
    FileLogger = __decorate([
        __param(4, files_1.IFileService)
    ], FileLogger);
    exports.FileLogger = FileLogger;
    let FileLoggerService = class FileLoggerService extends log_1.AbstractLoggerService {
        constructor(logService, instantiationService, fileService) {
            super(logService.getLevel(), logService.onDidChangeLogLevel);
            this.instantiationService = instantiationService;
            this.fileService = fileService;
        }
        doCreateLogger(resource, logLevel, options) {
            const logger = new bufferLog_1.BufferLogService(logLevel);
            (0, files_1.whenProviderRegistered)(resource, this.fileService).then(() => logger.logger = this.instantiationService.createInstance(FileLogger, (options === null || options === void 0 ? void 0 : options.name) || (0, resources_1.basename)(resource), resource, logger.getLevel(), !!(options === null || options === void 0 ? void 0 : options.donotUseFormatters)));
            return logger;
        }
    };
    FileLoggerService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, files_1.IFileService)
    ], FileLoggerService);
    exports.FileLoggerService = FileLoggerService;
});
//# sourceMappingURL=fileLog.js.map