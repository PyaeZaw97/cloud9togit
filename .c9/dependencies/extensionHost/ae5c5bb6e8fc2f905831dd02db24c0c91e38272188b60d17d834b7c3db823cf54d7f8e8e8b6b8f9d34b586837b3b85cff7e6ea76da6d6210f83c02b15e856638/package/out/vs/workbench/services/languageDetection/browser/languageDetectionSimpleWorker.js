/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
define(["require", "exports", "vs/base/common/stopwatch", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, stopwatch_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionSimpleWorker = exports.create = void 0;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new LanguageDetectionSimpleWorker(host, null);
    }
    exports.create = create;
    /**
     * @internal
     */
    class LanguageDetectionSimpleWorker extends editorSimpleWorker_1.EditorSimpleWorker {
        constructor() {
            super(...arguments);
            this._regexpLoadFailed = false;
            this._loadFailed = false;
            this.modelIdToCoreId = new Map();
        }
        async detectLanguage(uri, langBiases, preferHistory, supportedLangs) {
            const languages = [];
            const confidences = [];
            const stopWatch = new stopwatch_1.StopWatch(true);
            const documentTextSample = this.getTextForDetection(uri);
            if (!documentTextSample) {
                return;
            }
            const neuralResolver = async () => {
                var e_1, _a;
                try {
                    for (var _b = __asyncValues(this.detectLanguagesImpl(documentTextSample)), _c; _c = await _b.next(), !_c.done;) {
                        const language = _c.value;
                        if (!this.modelIdToCoreId.has(language.languageId)) {
                            this.modelIdToCoreId.set(language.languageId, await this._host.fhr('getLanguageId', [language.languageId]));
                        }
                        const coreId = this.modelIdToCoreId.get(language.languageId);
                        if (coreId && (!(supportedLangs === null || supportedLangs === void 0 ? void 0 : supportedLangs.length) || supportedLangs.includes(coreId))) {
                            languages.push(coreId);
                            confidences.push(language.confidence);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                stopWatch.stop();
                if (languages.length) {
                    this._host.fhr('sendTelemetryEvent', [languages, confidences, stopWatch.elapsed()]);
                    return languages[0];
                }
                return undefined;
            };
            const historicalResolver = async () => this.runRegexpModel(documentTextSample, langBiases !== null && langBiases !== void 0 ? langBiases : {}, supportedLangs);
            if (preferHistory) {
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
            }
            else {
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
            }
            return undefined;
        }
        getTextForDetection(uri) {
            const editorModel = this._getModel(uri);
            if (!editorModel) {
                return;
            }
            const end = editorModel.positionAt(10000);
            const content = editorModel.getValueInRange({
                startColumn: 1,
                startLineNumber: 1,
                endColumn: end.column,
                endLineNumber: end.lineNumber
            });
            return content;
        }
        async getRegexpModel() {
            if (this._regexpLoadFailed) {
                return;
            }
            if (this._regexpModel) {
                return this._regexpModel;
            }
            const uri = await this._host.fhr('getRegexpModelUri', []);
            try {
                this._regexpModel = await new Promise((resolve_1, reject_1) => { require([uri], resolve_1, reject_1); });
                return this._regexpModel;
            }
            catch (e) {
                this._regexpLoadFailed = true;
                // console.warn('error loading language detection model', e);
                return;
            }
        }
        async runRegexpModel(content, langBiases, supportedLangs) {
            const regexpModel = await this.getRegexpModel();
            if (!regexpModel) {
                return;
            }
            if (supportedLangs === null || supportedLangs === void 0 ? void 0 : supportedLangs.length) {
                // When using supportedLangs, normally computed biases are too extreme. Just use a "bitmask" of sorts.
                for (const lang of Object.keys(langBiases)) {
                    if (supportedLangs.includes(lang)) {
                        langBiases[lang] = 1;
                    }
                    else {
                        langBiases[lang] = 0;
                    }
                }
            }
            const detected = regexpModel.detect(content, langBiases, supportedLangs);
            return detected;
        }
        async getModelOperations() {
            if (this._modelOperations) {
                return this._modelOperations;
            }
            const uri = await this._host.fhr('getIndexJsUri', []);
            const { ModelOperations } = await new Promise((resolve_2, reject_2) => { require([uri], resolve_2, reject_2); });
            this._modelOperations = new ModelOperations({
                modelJsonLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getModelJsonUri', []));
                    try {
                        const modelJSON = await response.json();
                        return modelJSON;
                    }
                    catch (e) {
                        const message = `Failed to parse model JSON.`;
                        throw new Error(message);
                    }
                },
                weightsLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getWeightsUri', []));
                    const buffer = await response.arrayBuffer();
                    return buffer;
                }
            });
            return this._modelOperations;
        }
        // This adjusts the language confidence scores to be more accurate based on:
        // * VS Code's language usage
        // * Languages with 'problematic' syntaxes that have caused incorrect language detection
        adjustLanguageConfidence(modelResult) {
            switch (modelResult.languageId) {
                // For the following languages, we increase the confidence because
                // these are commonly used languages in VS Code and supported
                // by the model.
                case 'js':
                case 'html':
                case 'json':
                case 'ts':
                case 'css':
                case 'py':
                case 'xml':
                case 'php':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket1;
                    break;
                // case 'yaml': // YAML has been know to cause incorrect language detection because the language is pretty simple. We don't want to increase the confidence for this.
                case 'cpp':
                case 'sh':
                case 'java':
                case 'cs':
                case 'c':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket2;
                    break;
                // For the following languages, we need to be extra confident that the language is correct because
                // we've had issues like #131912 that caused incorrect guesses. To enforce this, we subtract the
                // negativeConfidenceCorrection from the confidence.
                // languages that are provided by default in VS Code
                case 'bat':
                case 'ini':
                case 'makefile':
                case 'sql':
                // languages that aren't provided by default in VS Code
                case 'csv':
                case 'toml':
                    // Other considerations for negativeConfidenceCorrection that
                    // aren't built in but suported by the model include:
                    // * Assembly, TeX - These languages didn't have clear language modes in the community
                    // * Markdown, Dockerfile - These languages are simple but they embed other languages
                    modelResult.confidence -= LanguageDetectionSimpleWorker.negativeConfidenceCorrection;
                    break;
                default:
                    break;
            }
            return modelResult;
        }
        detectLanguagesImpl(content) {
            return __asyncGenerator(this, arguments, function* detectLanguagesImpl_1() {
                if (this._loadFailed) {
                    return yield __await(void 0);
                }
                let modelOperations;
                try {
                    modelOperations = yield __await(this.getModelOperations());
                }
                catch (e) {
                    console.log(e);
                    this._loadFailed = true;
                    return yield __await(void 0);
                }
                let modelResults;
                try {
                    modelResults = yield __await(modelOperations.runModel(content));
                }
                catch (e) {
                    console.warn(e);
                }
                if (!modelResults
                    || modelResults.length === 0
                    || modelResults[0].confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                    return yield __await(void 0);
                }
                const firstModelResult = this.adjustLanguageConfidence(modelResults[0]);
                if (firstModelResult.confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                    return yield __await(void 0);
                }
                const possibleLanguages = [firstModelResult];
                for (let current of modelResults) {
                    if (current === firstModelResult) {
                        continue;
                    }
                    current = this.adjustLanguageConfidence(current);
                    const currentHighest = possibleLanguages[possibleLanguages.length - 1];
                    if (currentHighest.confidence - current.confidence >= LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                        while (possibleLanguages.length) {
                            yield yield __await(possibleLanguages.shift());
                        }
                        if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                            possibleLanguages.push(current);
                            continue;
                        }
                        return yield __await(void 0);
                    }
                    else {
                        if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                            possibleLanguages.push(current);
                            continue;
                        }
                        return yield __await(void 0);
                    }
                }
            });
        }
    }
    exports.LanguageDetectionSimpleWorker = LanguageDetectionSimpleWorker;
    LanguageDetectionSimpleWorker.expectedRelativeConfidence = 0.2;
    LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket1 = 0.05;
    LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket2 = 0.025;
    LanguageDetectionSimpleWorker.negativeConfidenceCorrection = 0.5;
});
//# sourceMappingURL=languageDetectionSimpleWorker.js.map