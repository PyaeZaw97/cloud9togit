/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConsoleLogInAutomationLogger = void 0;
    function logLevelToString(level) {
        switch (level) {
            case log_1.LogLevel.Trace: return 'trace';
            case log_1.LogLevel.Debug: return 'debug';
            case log_1.LogLevel.Info: return 'info';
            case log_1.LogLevel.Warning: return 'warn';
            case log_1.LogLevel.Error: return 'error';
            case log_1.LogLevel.Critical: return 'error';
        }
        return 'info';
    }
    /**
     * A logger that is used when VSCode is running in the web with
     * an automation such as playwright. We expect a global codeAutomationLog
     * to be defined that we can use to log to.
     */
    class ConsoleLogInAutomationLogger extends log_1.AdapterLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super({ log: (level, args) => this.consoleLog(logLevelToString(level), args) }, logLevel);
        }
        consoleLog(type, args) {
            const automatedWindow = window;
            if (typeof automatedWindow.codeAutomationLog === 'function') {
                automatedWindow.codeAutomationLog(type, args);
            }
        }
    }
    exports.ConsoleLogInAutomationLogger = ConsoleLogInAutomationLogger;
});
//# sourceMappingURL=log.js.map