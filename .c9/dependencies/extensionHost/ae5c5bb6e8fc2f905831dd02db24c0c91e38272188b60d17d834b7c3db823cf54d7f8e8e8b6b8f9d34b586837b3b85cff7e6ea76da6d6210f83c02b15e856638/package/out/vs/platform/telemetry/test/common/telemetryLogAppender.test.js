define(["require", "exports", "assert", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryLogAppender"], function (require, exports, assert, environment_1, instantiationServiceMock_1, log_1, telemetryLogAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTelemetryLogger extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.logs = [];
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this.logs.push(message + JSON.stringify(args));
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this.logs.push(message);
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this.logs.push(message);
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this.logs.push(message.toString());
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                this.logs.push(message);
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this.logs.push(message);
            }
        }
        dispose() { }
        flush() { }
    }
    class TestTelemetryLoggerService {
        constructor(logLevel) {
            this.logLevel = logLevel;
        }
        getLogger() {
            return this.logger;
        }
        createLogger() {
            if (!this.logger) {
                this.logger = new TestTelemetryLogger(this.logLevel);
            }
            return this.logger;
        }
    }
    suite('TelemetryLogAdapter', () => {
        test('Do not Log Telemetry if log level is not trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.DEFAULT_LOG_LEVEL);
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(testLoggerService, new instantiationServiceMock_1.TestInstantiationService().stub(environment_1.IEnvironmentService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs.length, 2);
        });
        test('Log Telemetry if log level is trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.LogLevel.Trace);
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(testLoggerService, new instantiationServiceMock_1.TestInstantiationService().stub(environment_1.IEnvironmentService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs[2], 'telemetry/testEvent' + JSON.stringify([{
                    properties: {
                        hello: 'world',
                    },
                    measurements: {
                        isTrue: 1, numberBetween1And3: 2
                    }
                }]));
        });
    });
});
//# sourceMappingURL=telemetryLogAppender.test.js.map