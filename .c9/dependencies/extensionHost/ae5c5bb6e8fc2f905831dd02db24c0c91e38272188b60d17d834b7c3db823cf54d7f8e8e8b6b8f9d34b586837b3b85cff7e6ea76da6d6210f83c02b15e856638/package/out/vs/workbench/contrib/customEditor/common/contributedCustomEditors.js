/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/common/memento", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/extensionPoint", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, event_1, lifecycle_1, nls, memento_1, customEditor_1, extensionPoint_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedCustomEditors = void 0;
    class ContributedCustomEditors extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this._editors = new Map();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._memento = new memento_1.Memento(ContributedCustomEditors.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            for (const info of (mementoObject[ContributedCustomEditors.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                this.add(new customEditor_1.CustomEditorInfo(info));
            }
            extensionPoint_1.customEditorsExtensionPoint.setHandler(extensions => {
                this.update(extensions);
            });
        }
        update(extensions) {
            this._editors.clear();
            for (const extension of extensions) {
                for (const webviewEditorContribution of extension.value) {
                    this.add(new customEditor_1.CustomEditorInfo({
                        id: webviewEditorContribution.viewType,
                        displayName: webviewEditorContribution.displayName,
                        providerDisplayName: extension.description.isBuiltin ? nls.localize('builtinProviderDisplayName', "Built-in") : extension.description.displayName || extension.description.identifier.value,
                        selector: webviewEditorContribution.selector || [],
                        priority: getPriorityFromContribution(webviewEditorContribution, extension.description),
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            mementoObject[ContributedCustomEditors.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._editors.values());
            this._memento.saveMemento();
            this._onChange.fire();
        }
        [Symbol.iterator]() {
            return this._editors.values();
        }
        get(viewType) {
            return this._editors.get(viewType);
        }
        getContributedEditors(resource) {
            return Array.from(this._editors.values())
                .filter(customEditor => customEditor.matches(resource));
        }
        add(info) {
            if (this._editors.has(info.id)) {
                console.error(`Custom editor with id '${info.id}' already registered`);
                return;
            }
            this._editors.set(info.id, info);
        }
    }
    exports.ContributedCustomEditors = ContributedCustomEditors;
    ContributedCustomEditors.CUSTOM_EDITORS_STORAGE_ID = 'customEditors';
    ContributedCustomEditors.CUSTOM_EDITORS_ENTRY_ID = 'editors';
    function getPriorityFromContribution(contribution, extension) {
        switch (contribution.priority) {
            case editorResolverService_1.RegisteredEditorPriority.default:
            case editorResolverService_1.RegisteredEditorPriority.option:
                return contribution.priority;
            case editorResolverService_1.RegisteredEditorPriority.builtin:
                // Builtin is only valid for builtin extensions
                return extension.isBuiltin ? editorResolverService_1.RegisteredEditorPriority.builtin : editorResolverService_1.RegisteredEditorPriority.default;
            default:
                return editorResolverService_1.RegisteredEditorPriority.default;
        }
    }
});
//# sourceMappingURL=contributedCustomEditors.js.map