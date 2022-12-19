/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/log/common/log"], function (require, exports, event_1, uri_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FollowerLogService = exports.LoggerChannelClient = exports.LoggerChannel = exports.LogLevelChannelClient = exports.LogLevelChannel = void 0;
    class LogLevelChannel {
        constructor(service) {
            this.service = service;
            this.onDidChangeLogLevel = event_1.Event.buffer(service.onDidChangeLogLevel, true);
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeLogLevel': return this.onDidChangeLogLevel;
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(_, command, arg) {
            switch (command) {
                case 'setLevel': return this.service.setLevel(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.LogLevelChannel = LogLevelChannel;
    class LogLevelChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get onDidChangeLogLevel() {
            return this.channel.listen('onDidChangeLogLevel');
        }
        setLevel(level) {
            LogLevelChannelClient.setLevel(this.channel, level);
        }
        static setLevel(channel, level) {
            return channel.call('setLevel', level);
        }
    }
    exports.LogLevelChannelClient = LogLevelChannelClient;
    class LoggerChannel {
        constructor(loggerService) {
            this.loggerService = loggerService;
            this.loggers = new Map();
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        async call(_, command, arg) {
            switch (command) {
                case 'createLogger':
                    this.createLogger(uri_1.URI.revive(arg[0]), arg[1]);
                    return;
                case 'log': return this.log(uri_1.URI.revive(arg[0]), arg[1]);
                case 'consoleLog': return this.consoleLog(arg[0], arg[1]);
            }
            throw new Error(`Call not found: ${command}`);
        }
        createLogger(file, options) {
            this.loggers.set(file.toString(), this.loggerService.createLogger(file, options));
        }
        consoleLog(level, args) {
            let consoleFn = console.log;
            switch (level) {
                case log_1.LogLevel.Error:
                    consoleFn = console.error;
                    break;
                case log_1.LogLevel.Warning:
                    consoleFn = console.warn;
                    break;
                case log_1.LogLevel.Info:
                    consoleFn = console.info;
                    break;
            }
            consoleFn.call(console, ...args);
        }
        log(file, messages) {
            const logger = this.loggers.get(file.toString());
            if (!logger) {
                throw new Error('Create the logger before logging');
            }
            for (const [level, message] of messages) {
                (0, log_1.log)(logger, level, message);
            }
        }
    }
    exports.LoggerChannel = LoggerChannel;
    class LoggerChannelClient extends log_1.AbstractLoggerService {
        constructor(logLevel, onDidChangeLogLevel, channel) {
            super(logLevel, onDidChangeLogLevel);
            this.channel = channel;
        }
        createConsoleMainLogger() {
            return new log_1.AdapterLogger({
                log: (level, args) => {
                    this.channel.call('consoleLog', [level, args]);
                }
            });
        }
        doCreateLogger(file, logLevel, options) {
            return new Logger(this.channel, file, logLevel, options);
        }
    }
    exports.LoggerChannelClient = LoggerChannelClient;
    class Logger extends log_1.AbstractMessageLogger {
        constructor(channel, file, logLevel, loggerOptions) {
            super(loggerOptions === null || loggerOptions === void 0 ? void 0 : loggerOptions.always);
            this.channel = channel;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.channel.call('createLogger', [file, loggerOptions])
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.channel.call('log', [this.file, messages]);
        }
    }
    class FollowerLogService extends log_1.LogService {
        constructor(parent, logService) {
            super(logService);
            this.parent = parent;
            this._register(parent.onDidChangeLogLevel(level => logService.setLevel(level)));
        }
        setLevel(level) {
            super.setLevel(level);
            this.parent.setLevel(level);
        }
    }
    exports.FollowerLogService = FollowerLogService;
});
//# sourceMappingURL=logIpc.js.map