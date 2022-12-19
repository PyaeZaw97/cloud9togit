"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    var _a, _b;
    const MonacoEnvironment = self.MonacoEnvironment;
    const monacoBaseUrl = MonacoEnvironment && MonacoEnvironment.baseUrl ? MonacoEnvironment.baseUrl : '../../../';
    const trustedTypesPolicy = (typeof ((_a = self.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy) === 'function'
        ? (_b = self.trustedTypes) === null || _b === void 0 ? void 0 : _b.createPolicy('amdLoader', {
            createScriptURL: value => value,
            createScript: (_, ...args) => {
                // workaround a chrome issue not allowing to create new functions
                // see https://github.com/w3c/webappsec-trusted-types/wiki/Trusted-Types-for-function-constructor
                const fnArgs = args.slice(0, -1).join(',');
                const fnBody = args.pop().toString();
                const body = `(function anonymous(${fnArgs}) {\n${fnBody}\n})`;
                return body;
            }
        })
        : undefined);
    function canUseEval() {
        try {
            const func = (trustedTypesPolicy
                ? self.eval(trustedTypesPolicy.createScript('', 'true'))
                : new Function('true'));
            func.call(self);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    function loadAMDLoader() {
        return new Promise((resolve, reject) => {
            if (typeof self.define === 'function' && self.define.amd) {
                return resolve();
            }
            const loaderSrc = monacoBaseUrl + 'vs/loader.js';
            const isCrossOrigin = (/^((http:)|(https:)|(file:))/.test(loaderSrc) && loaderSrc.substring(0, self.origin.length) !== self.origin);
            if (!isCrossOrigin && canUseEval()) {
                // use `fetch` if possible because `importScripts`
                // is synchronous and can lead to deadlocks on Safari
                fetch(loaderSrc).then((response) => {
                    if (response.status !== 200) {
                        throw new Error(response.statusText);
                    }
                    return response.text();
                }).then((text) => {
                    text = `${text}\n//# sourceURL=${loaderSrc}`;
                    const func = (trustedTypesPolicy
                        ? self.eval(trustedTypesPolicy.createScript('', text))
                        : new Function(text));
                    func.call(self);
                    resolve();
                }).then(undefined, reject);
                return;
            }
            if (trustedTypesPolicy) {
                importScripts(trustedTypesPolicy.createScriptURL(loaderSrc));
            }
            else {
                importScripts(loaderSrc);
            }
            resolve();
        });
    }
    const loadCode = function (moduleId) {
        loadAMDLoader().then(() => {
            require.config({
                baseUrl: monacoBaseUrl,
                catchError: true,
                trustedTypesPolicy,
                amdModulesPattern: /^vs\//
            });
            require([moduleId], function (ws) {
                setTimeout(function () {
                    let messageHandler = ws.create((msg, transfer) => {
                        self.postMessage(msg, transfer);
                    }, null);
                    self.onmessage = (e) => messageHandler.onmessage(e.data, e.ports);
                    while (beforeReadyMessages.length > 0) {
                        self.onmessage(beforeReadyMessages.shift());
                    }
                }, 0);
            });
        });
    };
    let isFirstMessage = true;
    let beforeReadyMessages = [];
    self.onmessage = (message) => {
        if (!isFirstMessage) {
            beforeReadyMessages.push(message);
            return;
        }
        isFirstMessage = false;
        loadCode(message.data);
    };
})();
//# sourceMappingURL=workerMain.js.map