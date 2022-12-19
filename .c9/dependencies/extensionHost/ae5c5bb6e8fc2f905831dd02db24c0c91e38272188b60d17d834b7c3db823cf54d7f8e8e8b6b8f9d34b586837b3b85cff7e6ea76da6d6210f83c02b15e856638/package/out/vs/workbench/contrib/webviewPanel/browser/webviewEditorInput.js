/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/common/editor/editorInput"], function (require, exports, network_1, uri_1, editorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewInput = void 0;
    class WebviewInput extends editorInput_1.EditorInput {
        constructor(id, viewType, name, webview, _iconManager) {
            super();
            this.id = id;
            this.viewType = viewType;
            this._iconManager = _iconManager;
            this._hasTransfered = false;
            this._name = name;
            this._webview = webview;
        }
        get typeId() {
            return WebviewInput.typeId;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */ | 128 /* EditorInputCapabilities.CanDropIntoEditor */;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.webviewPanel,
                path: `webview-panel/webview-${this.id}`
            });
        }
        dispose() {
            var _a;
            if (!this.isDisposed()) {
                if (!this._hasTransfered) {
                    (_a = this._webview) === null || _a === void 0 ? void 0 : _a.dispose();
                }
            }
            super.dispose();
        }
        getName() {
            return this._name;
        }
        getTitle(_verbosity) {
            return this.getName();
        }
        getDescription() {
            return undefined;
        }
        setName(value) {
            this._name = value;
            this._onDidChangeLabel.fire();
        }
        get webview() {
            return this._webview;
        }
        get extension() {
            return this.webview.extension;
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            this._iconManager.setIcons(this.id, value);
        }
        matches(other) {
            return super.matches(other) || other === this;
        }
        get group() {
            return this._group;
        }
        updateGroup(group) {
            this._group = group;
        }
        transfer(other) {
            if (this._hasTransfered) {
                return undefined;
            }
            this._hasTransfered = true;
            other._webview = this._webview;
            return other;
        }
    }
    exports.WebviewInput = WebviewInput;
    WebviewInput.typeId = 'workbench.editors.webviewInput';
});
//# sourceMappingURL=webviewEditorInput.js.map