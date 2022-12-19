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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/workspace/common/workspace", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/platform/files/common/files", "vs/base/common/types", "vs/workbench/services/outline/browser/outline"], function (require, exports, cancellation_1, errors_1, event_1, lifecycle_1, resources_1, workspace_1, network_1, configuration_1, breadcrumbs_1, files_1, types_1, outline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsModel = exports.OutlineElement2 = exports.FileElement = void 0;
    class FileElement {
        constructor(uri, kind) {
            this.uri = uri;
            this.kind = kind;
        }
    }
    exports.FileElement = FileElement;
    class OutlineElement2 {
        constructor(element, outline) {
            this.element = element;
            this.outline = outline;
        }
    }
    exports.OutlineElement2 = OutlineElement2;
    let BreadcrumbsModel = class BreadcrumbsModel {
        constructor(resource, editor, configurationService, _workspaceService, _outlineService) {
            this.resource = resource;
            this._workspaceService = _workspaceService;
            this._outlineService = _outlineService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._currentOutline = new lifecycle_1.MutableDisposable();
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this._onDidUpdate = new event_1.Emitter();
            this.onDidUpdate = this._onDidUpdate.event;
            this._cfgFilePath = breadcrumbs_1.BreadcrumbsConfig.FilePath.bindTo(configurationService);
            this._cfgSymbolPath = breadcrumbs_1.BreadcrumbsConfig.SymbolPath.bindTo(configurationService);
            this._disposables.add(this._cfgFilePath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._disposables.add(this._cfgSymbolPath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._fileInfo = this._initFilePathInfo(resource);
            if (editor) {
                this._bindToEditor(editor);
                this._disposables.add(_outlineService.onDidChange(() => this._bindToEditor(editor)));
                this._disposables.add(editor.onDidChangeControl(() => this._bindToEditor(editor)));
            }
            this._onDidUpdate.fire(this);
        }
        dispose() {
            this._disposables.dispose();
            this._cfgFilePath.dispose();
            this._cfgSymbolPath.dispose();
            this._currentOutline.dispose();
            this._outlineDisposables.dispose();
            this._onDidUpdate.dispose();
        }
        isRelative() {
            return Boolean(this._fileInfo.folder);
        }
        getElements() {
            let result = [];
            // file path elements
            if (this._cfgFilePath.getValue() === 'on') {
                result = result.concat(this._fileInfo.path);
            }
            else if (this._cfgFilePath.getValue() === 'last' && this._fileInfo.path.length > 0) {
                result = result.concat(this._fileInfo.path.slice(-1));
            }
            if (this._cfgSymbolPath.getValue() === 'off') {
                return result;
            }
            if (!this._currentOutline.value) {
                return result;
            }
            const breadcrumbsElements = this._currentOutline.value.config.breadcrumbsDataSource.getBreadcrumbElements();
            for (let i = this._cfgSymbolPath.getValue() === 'last' && breadcrumbsElements.length > 0 ? breadcrumbsElements.length - 1 : 0; i < breadcrumbsElements.length; i++) {
                result.push(new OutlineElement2(breadcrumbsElements[i], this._currentOutline.value));
            }
            if (breadcrumbsElements.length === 0 && !this._currentOutline.value.isEmpty) {
                result.push(new OutlineElement2(this._currentOutline.value, this._currentOutline.value));
            }
            return result;
        }
        _initFilePathInfo(uri) {
            if (uri.scheme === network_1.Schemas.untitled) {
                return {
                    folder: undefined,
                    path: []
                };
            }
            let info = {
                folder: (0, types_1.withNullAsUndefined)(this._workspaceService.getWorkspaceFolder(uri)),
                path: []
            };
            let uriPrefix = uri;
            while (uriPrefix && uriPrefix.path !== '/') {
                if (info.folder && (0, resources_1.isEqual)(info.folder.uri, uriPrefix)) {
                    break;
                }
                info.path.unshift(new FileElement(uriPrefix, info.path.length === 0 ? files_1.FileKind.FILE : files_1.FileKind.FOLDER));
                let prevPathLength = uriPrefix.path.length;
                uriPrefix = (0, resources_1.dirname)(uriPrefix);
                if (uriPrefix.path.length === prevPathLength) {
                    break;
                }
            }
            if (info.folder && this._workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                info.path.unshift(new FileElement(info.folder.uri, files_1.FileKind.ROOT_FOLDER));
            }
            return info;
        }
        _bindToEditor(editor) {
            const newCts = new cancellation_1.CancellationTokenSource();
            this._currentOutline.clear();
            this._outlineDisposables.clear();
            this._outlineDisposables.add((0, lifecycle_1.toDisposable)(() => newCts.dispose(true)));
            this._outlineService.createOutline(editor, 2 /* OutlineTarget.Breadcrumbs */, newCts.token).then(outline => {
                if (newCts.token.isCancellationRequested) {
                    // cancelled: dispose new outline and reset
                    outline === null || outline === void 0 ? void 0 : outline.dispose();
                    outline = undefined;
                }
                this._currentOutline.value = outline;
                this._onDidUpdate.fire(this);
                if (outline) {
                    this._outlineDisposables.add(outline.onDidChange(() => this._onDidUpdate.fire(this)));
                }
            }).catch(err => {
                this._onDidUpdate.fire(this);
                (0, errors_1.onUnexpectedError)(err);
            });
        }
    };
    BreadcrumbsModel = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, outline_1.IOutlineService)
    ], BreadcrumbsModel);
    exports.BreadcrumbsModel = BreadcrumbsModel;
});
//# sourceMappingURL=breadcrumbsModel.js.map