/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/map", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/base/common/event"], function (require, exports, map_1, notebookEditorWidget_1, lifecycle_1, editorGroupsService_1, instantiation_1, notebookEditorInput_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWidgetService = void 0;
    let NotebookEditorWidgetService = class NotebookEditorWidgetService {
        constructor(editorGroupService) {
            this._tokenPool = 1;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookEditors = new Map();
            this._decorationOptionProviders = new Map();
            this._onNotebookEditorAdd = new event_1.Emitter();
            this._onNotebookEditorsRemove = new event_1.Emitter();
            this.onDidAddNotebookEditor = this._onNotebookEditorAdd.event;
            this.onDidRemoveNotebookEditor = this._onNotebookEditorsRemove.event;
            this._borrowableEditors = new Map();
            const groupListener = new Map();
            const onNewGroup = (group) => {
                const { id } = group;
                const listeners = [];
                listeners.push(group.onDidCloseEditor(e => {
                    const widgets = this._borrowableEditors.get(group.id);
                    if (!widgets) {
                        return;
                    }
                    const inputs = e.editor instanceof notebookEditorInput_1.NotebookEditorInput ? [e.editor] : ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor) ? e.editor.editorInputs : []);
                    inputs.forEach(input => {
                        const value = widgets.get(input.resource);
                        if (!value) {
                            return;
                        }
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                        widgets.delete(input.resource);
                        value.widget = undefined; // unset the widget so that others that still hold a reference don't harm us
                    });
                }));
                listeners.push(group.onWillMoveEditor(e => {
                    if (e.editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                        this._freeWidget(e.editor, e.groupId, e.target);
                    }
                    if ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor)) {
                        e.editor.editorInputs.forEach(input => {
                            this._freeWidget(input, e.groupId, e.target);
                        });
                    }
                }));
                groupListener.set(id, listeners);
            };
            this._disposables.add(editorGroupService.onDidAddGroup(onNewGroup));
            editorGroupService.whenReady.then(() => editorGroupService.groups.forEach(onNewGroup));
            // group removed -> clean up listeners, clean up widgets
            this._disposables.add(editorGroupService.onDidRemoveGroup(group => {
                const listeners = groupListener.get(group.id);
                if (listeners) {
                    listeners.forEach(listener => listener.dispose());
                    groupListener.delete(group.id);
                }
                const widgets = this._borrowableEditors.get(group.id);
                this._borrowableEditors.delete(group.id);
                if (widgets) {
                    for (const value of widgets.values()) {
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                    }
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._onNotebookEditorAdd.dispose();
            this._onNotebookEditorsRemove.dispose();
        }
        // --- group-based editor borrowing...
        _disposeWidget(widget) {
            widget.onWillHide();
            const domNode = widget.getDomNode();
            widget.dispose();
            domNode.remove();
        }
        _freeWidget(input, sourceID, targetID) {
            var _a, _b, _c;
            const targetWidget = (_a = this._borrowableEditors.get(targetID)) === null || _a === void 0 ? void 0 : _a.get(input.resource);
            if (targetWidget) {
                // not needed
                return;
            }
            const widget = (_b = this._borrowableEditors.get(sourceID)) === null || _b === void 0 ? void 0 : _b.get(input.resource);
            if (!widget) {
                throw new Error('no widget at source group');
            }
            (_c = this._borrowableEditors.get(sourceID)) === null || _c === void 0 ? void 0 : _c.delete(input.resource);
            widget.token = undefined;
            let targetMap = this._borrowableEditors.get(targetID);
            if (!targetMap) {
                targetMap = new map_1.ResourceMap();
                this._borrowableEditors.set(targetID, targetMap);
            }
            targetMap.set(input.resource, widget);
        }
        retrieveWidget(accessor, group, input, creationOptions) {
            var _a;
            let value = (_a = this._borrowableEditors.get(group.id)) === null || _a === void 0 ? void 0 : _a.get(input.resource);
            if (!value) {
                // NEW widget
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const widget = instantiationService.createInstance(notebookEditorWidget_1.NotebookEditorWidget, creationOptions !== null && creationOptions !== void 0 ? creationOptions : (0, notebookEditorWidget_1.getDefaultNotebookCreationOptions)());
                const token = this._tokenPool++;
                value = { widget, token };
                let map = this._borrowableEditors.get(group.id);
                if (!map) {
                    map = new map_1.ResourceMap();
                    this._borrowableEditors.set(group.id, map);
                }
                map.set(input.resource, value);
            }
            else {
                // reuse a widget which was either free'ed before or which
                // is simply being reused...
                value.token = this._tokenPool++;
            }
            return this._createBorrowValue(value.token, value);
        }
        _createBorrowValue(myToken, widget) {
            return {
                get value() {
                    return widget.token === myToken ? widget.widget : undefined;
                }
            };
        }
        // --- editor management
        addNotebookEditor(editor) {
            this._notebookEditors.set(editor.getId(), editor);
            this._onNotebookEditorAdd.fire(editor);
        }
        removeNotebookEditor(editor) {
            if (this._notebookEditors.has(editor.getId())) {
                this._notebookEditors.delete(editor.getId());
                this._onNotebookEditorsRemove.fire(editor);
            }
        }
        getNotebookEditor(editorId) {
            return this._notebookEditors.get(editorId);
        }
        listNotebookEditors() {
            return [...this._notebookEditors].map(e => e[1]);
        }
        // --- editor decorations
        registerEditorDecorationType(key, options) {
            if (!this._decorationOptionProviders.has(key)) {
                this._decorationOptionProviders.set(key, options);
            }
        }
        removeEditorDecorationType(key) {
            this._decorationOptionProviders.delete(key);
            this.listNotebookEditors().forEach(editor => editor.removeEditorDecorations(key));
        }
        resolveEditorDecorationOptions(key) {
            return this._decorationOptionProviders.get(key);
        }
    };
    NotebookEditorWidgetService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService)
    ], NotebookEditorWidgetService);
    exports.NotebookEditorWidgetService = NotebookEditorWidgetService;
});
//# sourceMappingURL=notebookEditorServiceImpl.js.map