/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/objects", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, errors_1, objects_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppInsightsAppender = void 0;
    async function getClient(aiKey) {
        const appInsights = await new Promise((resolve_1, reject_1) => { require(['applicationinsights'], resolve_1, reject_1); });
        let client;
        if (appInsights.defaultClient) {
            client = new appInsights.TelemetryClient(aiKey);
            client.channel.setUseDiskRetryCaching(true);
        }
        else {
            appInsights.setup(aiKey)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false)
                .setAutoCollectExceptions(false)
                .setAutoCollectDependencies(false)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectConsole(false)
                .setInternalLogging(false, false)
                .setUseDiskRetryCaching(true)
                .start();
            client = appInsights.defaultClient;
        }
        if (aiKey.indexOf('AIF-') === 0) {
            client.config.endpointUrl = 'https://mobile.events.data.microsoft.com/collect/v1';
        }
        return client;
    }
    class AppInsightsAppender {
        constructor(_eventPrefix, _defaultData, aiKeyOrClientFactory) {
            this._eventPrefix = _eventPrefix;
            this._defaultData = _defaultData;
            if (!this._defaultData) {
                this._defaultData = Object.create(null);
            }
            if (typeof aiKeyOrClientFactory === 'function') {
                this._aiClient = aiKeyOrClientFactory();
            }
            else {
                this._aiClient = aiKeyOrClientFactory;
            }
            this._asyncAIClient = null;
        }
        _withAIClient(callback) {
            if (!this._aiClient) {
                return;
            }
            if (typeof this._aiClient !== 'string') {
                callback(this._aiClient);
                return;
            }
            if (!this._asyncAIClient) {
                this._asyncAIClient = getClient(this._aiClient);
            }
            this._asyncAIClient.then((aiClient) => {
                callback(aiClient);
            }, (err) => {
                (0, errors_1.onUnexpectedError)(err);
                console.error(err);
            });
        }
        log(eventName, data) {
            if (!this._aiClient) {
                return;
            }
            data = (0, objects_1.mixin)(data, this._defaultData);
            data = (0, telemetryUtils_1.validateTelemetryData)(data);
            // Attemps to suppress https://github.com/microsoft/vscode/issues/140624
            try {
                this._withAIClient((aiClient) => aiClient.trackEvent({
                    name: this._eventPrefix + '/' + eventName,
                    properties: data.properties,
                    measurements: data.measurements
                }));
            }
            catch (_a) { }
        }
        flush() {
            if (this._aiClient) {
                return new Promise(resolve => {
                    this._withAIClient((aiClient) => {
                        // Attempts to suppress https://github.com/microsoft/vscode/issues/140624
                        try {
                            aiClient.flush({
                                callback: () => {
                                    // all data flushed
                                    this._aiClient = undefined;
                                    resolve(undefined);
                                }
                            });
                        }
                        catch (_a) { }
                    });
                });
            }
            return Promise.resolve(undefined);
        }
    }
    exports.AppInsightsAppender = AppInsightsAppender;
});
//# sourceMappingURL=appInsightsAppender.js.map