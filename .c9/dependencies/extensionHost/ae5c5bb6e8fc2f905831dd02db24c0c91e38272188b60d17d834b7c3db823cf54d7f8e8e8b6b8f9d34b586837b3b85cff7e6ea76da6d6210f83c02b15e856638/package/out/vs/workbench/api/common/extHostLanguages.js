/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/base/common/severity", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, typeConvert, extHostTypes_1, severity_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguages = void 0;
    class ExtHostLanguages {
        constructor(mainContext, _documents, _commands, _uriTransformer) {
            this._documents = _documents;
            this._commands = _commands;
            this._uriTransformer = _uriTransformer;
            this._languageIds = [];
            this._handlePool = 0;
            this._ids = new Set();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
        }
        $acceptLanguageIds(ids) {
            this._languageIds = ids;
        }
        async getLanguages() {
            return this._languageIds.slice(0);
        }
        async changeLanguage(uri, languageId) {
            await this._proxy.$changeLanguage(uri, languageId);
            const data = this._documents.getDocumentData(uri);
            if (!data) {
                throw new Error(`document '${uri.toString()}' NOT found`);
            }
            return data.document;
        }
        async tokenAtPosition(document, position) {
            var _a;
            const versionNow = document.version;
            const pos = typeConvert.Position.from(position);
            const info = await this._proxy.$tokensAtPosition(document.uri, pos);
            const defaultRange = {
                type: extHostTypes_1.StandardTokenType.Other,
                range: (_a = document.getWordRangeAtPosition(position)) !== null && _a !== void 0 ? _a : new extHostTypes_1.Range(position.line, position.character, position.line, position.character)
            };
            if (!info) {
                // no result
                return defaultRange;
            }
            const result = {
                range: typeConvert.Range.to(info.range),
                type: typeConvert.TokenType.to(info.type)
            };
            if (!result.range.contains(position)) {
                // bogous result
                return defaultRange;
            }
            if (versionNow !== document.version) {
                // concurrent change
                return defaultRange;
            }
            return result;
        }
        createLanguageStatusItem(extension, id, selector) {
            var _a;
            const handle = this._handlePool++;
            const proxy = this._proxy;
            const ids = this._ids;
            // enforce extension unique identifier
            const fullyQualifiedId = `${extension.identifier.value}/${id}`;
            if (ids.has(fullyQualifiedId)) {
                throw new Error(`LanguageStatusItem with id '${id}' ALREADY exists`);
            }
            ids.add(fullyQualifiedId);
            const data = {
                selector,
                id,
                name: (_a = extension.displayName) !== null && _a !== void 0 ? _a : extension.name,
                severity: extHostTypes_1.LanguageStatusSeverity.Information,
                command: undefined,
                text: '',
                detail: '',
                busy: false
            };
            let soonHandle;
            let commandDisposables = new lifecycle_1.DisposableStore();
            const updateAsync = () => {
                soonHandle === null || soonHandle === void 0 ? void 0 : soonHandle.dispose();
                soonHandle = (0, async_1.disposableTimeout)(() => {
                    var _a, _b, _c, _d;
                    commandDisposables.clear();
                    this._proxy.$setLanguageStatus(handle, {
                        id: fullyQualifiedId,
                        name: (_b = (_a = data.name) !== null && _a !== void 0 ? _a : extension.displayName) !== null && _b !== void 0 ? _b : extension.name,
                        source: (_c = extension.displayName) !== null && _c !== void 0 ? _c : extension.name,
                        selector: typeConvert.DocumentSelector.from(data.selector, this._uriTransformer),
                        label: data.text,
                        detail: (_d = data.detail) !== null && _d !== void 0 ? _d : '',
                        severity: data.severity === extHostTypes_1.LanguageStatusSeverity.Error ? severity_1.default.Error : data.severity === extHostTypes_1.LanguageStatusSeverity.Warning ? severity_1.default.Warning : severity_1.default.Info,
                        command: data.command && this._commands.toInternal(data.command, commandDisposables),
                        accessibilityInfo: data.accessibilityInformation,
                        busy: data.busy
                    });
                }, 0);
            };
            const result = {
                dispose() {
                    commandDisposables.dispose();
                    soonHandle === null || soonHandle === void 0 ? void 0 : soonHandle.dispose();
                    proxy.$removeLanguageStatus(handle);
                    ids.delete(fullyQualifiedId);
                },
                get id() {
                    return data.id;
                },
                get name() {
                    return data.name;
                },
                set name(value) {
                    data.name = value;
                    updateAsync();
                },
                get selector() {
                    return data.selector;
                },
                set selector(value) {
                    data.selector = value;
                    updateAsync();
                },
                get text() {
                    return data.text;
                },
                set text(value) {
                    data.text = value;
                    updateAsync();
                },
                get detail() {
                    return data.detail;
                },
                set detail(value) {
                    data.detail = value;
                    updateAsync();
                },
                get severity() {
                    return data.severity;
                },
                set severity(value) {
                    data.severity = value;
                    updateAsync();
                },
                get accessibilityInformation() {
                    return data.accessibilityInformation;
                },
                set accessibilityInformation(value) {
                    data.accessibilityInformation = value;
                    updateAsync();
                },
                get command() {
                    return data.command;
                },
                set command(value) {
                    data.command = value;
                    updateAsync();
                },
                get busy() {
                    return data.busy;
                },
                set busy(value) {
                    data.busy = value;
                    updateAsync();
                }
            };
            updateAsync();
            return result;
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# sourceMappingURL=extHostLanguages.js.map