/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/languageFeatureRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, strings_1, languageFeatureRegistry_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ILanguageStatusService = void 0;
    exports.ILanguageStatusService = (0, instantiation_1.createDecorator)('ILanguageStatusService');
    class LanguageStatusServiceImpl {
        constructor() {
            this._provider = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            this.onDidChange = this._provider.onDidChange;
        }
        addStatus(status) {
            return this._provider.register(status.selector, status);
        }
        getLanguageStatus(model) {
            return this._provider.ordered(model).sort((a, b) => {
                let res = b.severity - a.severity;
                if (res === 0) {
                    res = (0, strings_1.compare)(a.source, b.source);
                }
                if (res === 0) {
                    res = (0, strings_1.compare)(a.id, b.id);
                }
                return res;
            });
        }
    }
    (0, extensions_1.registerSingleton)(exports.ILanguageStatusService, LanguageStatusServiceImpl, true);
});
//# sourceMappingURL=languageStatusService.js.map