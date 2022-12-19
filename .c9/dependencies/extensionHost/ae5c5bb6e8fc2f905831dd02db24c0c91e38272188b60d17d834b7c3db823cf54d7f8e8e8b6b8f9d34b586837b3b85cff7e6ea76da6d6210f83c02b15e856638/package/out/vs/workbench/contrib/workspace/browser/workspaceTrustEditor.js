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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/linkedText", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/opener/browser/link", "vs/platform/registry/common/platform", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/notifications", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/path", "vs/base/common/extpath", "vs/base/browser/keyboardEvent", "vs/platform/product/common/productService", "vs/platform/theme/common/iconRegistry"], function (require, exports, dom_1, actionbar_1, button_1, inputBox_1, scrollableElement_1, actions_1, codicons_1, decorators_1, event_1, labels_1, lifecycle_1, linkedText_1, network_1, uri_1, nls_1, configurationRegistry_1, contextView_1, dialogs_1, instantiation_1, label_1, listService_1, link_1, platform_1, virtualWorkspace_1, storage_1, telemetry_1, colorRegistry_1, workspace_1, styler_1, themeService_1, workspaceTrust_1, editorPane_1, notifications_1, debugColors_1, extensions_1, configuration_1, extensionManifestPropertiesService_1, uriIdentity_1, extensionManagementUtil_1, extensionManagement_1, path_1, extpath_1, keyboardEvent_1, productService_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustEditor = exports.shieldIcon = void 0;
    exports.shieldIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-banner', codicons_1.Codicon.shield, (0, nls_1.localize)('shieldIcon', 'Icon for workspace trust ion the banner.'));
    const checkListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-check', codicons_1.Codicon.check, (0, nls_1.localize)('checkListIcon', 'Icon for the checkmark in the workspace trust editor.'));
    const xListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-cross', codicons_1.Codicon.x, (0, nls_1.localize)('xListIcon', 'Icon for the cross in the workspace trust editor.'));
    const folderPickerIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-folder-picker', codicons_1.Codicon.folder, (0, nls_1.localize)('folderPickerIcon', 'Icon for the pick folder icon in the workspace trust editor.'));
    const editIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-edit-folder', codicons_1.Codicon.edit, (0, nls_1.localize)('editIcon', 'Icon for the edit folder icon in the workspace trust editor.'));
    const removeIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-remove-folder', codicons_1.Codicon.close, (0, nls_1.localize)('removeIcon', 'Icon for the remove folder icon in the workspace trust editor.'));
    let WorkspaceTrustedUrisTable = class WorkspaceTrustedUrisTable extends lifecycle_1.Disposable {
        constructor(container, instantiationService, workspaceService, workspaceTrustManagementService, uriService, labelService, themeService, fileDialogService) {
            super();
            this.container = container;
            this.instantiationService = instantiationService;
            this.workspaceService = workspaceService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriService = uriService;
            this.labelService = labelService;
            this.themeService = themeService;
            this.fileDialogService = fileDialogService;
            this._onDidAcceptEdit = this._register(new event_1.Emitter());
            this.onDidAcceptEdit = this._onDidAcceptEdit.event;
            this._onDidRejectEdit = this._register(new event_1.Emitter());
            this.onDidRejectEdit = this._onDidRejectEdit.event;
            this._onEdit = this._register(new event_1.Emitter());
            this.onEdit = this._onEdit.event;
            this._onDelete = this._register(new event_1.Emitter());
            this.onDelete = this._onDelete.event;
            this.descriptionElement = container.appendChild((0, dom_1.$)('.workspace-trusted-folders-description'));
            const tableElement = container.appendChild((0, dom_1.$)('.trusted-uris-table'));
            const addButtonBarElement = container.appendChild((0, dom_1.$)('.trusted-uris-button-bar'));
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'WorkspaceTrust', tableElement, new TrustedUriTableVirtualDelegate(), [
                {
                    label: (0, nls_1.localize)('hostColumnLabel', "Host"),
                    tooltip: '',
                    weight: 1,
                    templateId: TrustedUriHostColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('pathColumnLabel', "Path"),
                    tooltip: '',
                    weight: 8,
                    templateId: TrustedUriPathColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: '',
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 75,
                    maximumWidth: 75,
                    templateId: TrustedUriActionsColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this.instantiationService.createInstance(TrustedUriHostColumnRenderer),
                this.instantiationService.createInstance(TrustedUriPathColumnRenderer, this),
                this.instantiationService.createInstance(TrustedUriActionsColumnRenderer, this, this.currentWorkspaceUri),
            ], {
                horizontalScrolling: false,
                alwaysConsumeMouseWheel: false,
                openOnSingleClick: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        const hostLabel = getHostLabel(this.labelService, item);
                        if (hostLabel === undefined || hostLabel.length === 0) {
                            return (0, nls_1.localize)('trustedFolderAriaLabel', "{0}, trusted", this.labelService.getUriLabel(item.uri));
                        }
                        return (0, nls_1.localize)('trustedFolderWithHostAriaLabel', "{0} on {1}, trusted", this.labelService.getUriLabel(item.uri), hostLabel);
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces")
                }
            });
            this._register(this.table.onDidOpen(item => {
                var _a;
                // default prevented when input box is double clicked #125052
                if (item && item.element && !((_a = item.browserEvent) === null || _a === void 0 ? void 0 : _a.defaultPrevented)) {
                    this.edit(item.element, true);
                }
            }));
            const buttonBar = this._register(new button_1.ButtonBar(addButtonBarElement));
            const addButton = this._register(buttonBar.addButton({ title: (0, nls_1.localize)('addButton', "Add Folder") }));
            addButton.label = (0, nls_1.localize)('addButton', "Add Folder");
            this._register((0, styler_1.attachButtonStyler)(addButton, this.themeService));
            this._register(addButton.onDidClick(async () => {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: this.currentWorkspaceUri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.workspaceTrustManagementService.setUrisTrust(uri, true);
                }
            }));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => {
                this.updateTable();
            }));
        }
        getIndexOfTrustedUriEntry(item) {
            const index = this.trustedUriEntries.indexOf(item);
            if (index === -1) {
                for (let i = 0; i < this.trustedUriEntries.length; i++) {
                    if (this.trustedUriEntries[i].uri === item.uri) {
                        return i;
                    }
                }
            }
            return index;
        }
        selectTrustedUriEntry(item, focus = true) {
            const index = this.getIndexOfTrustedUriEntry(item);
            if (index !== -1) {
                if (focus) {
                    this.table.domFocus();
                    this.table.setFocus([index]);
                }
                this.table.setSelection([index]);
            }
        }
        get currentWorkspaceUri() {
            var _a;
            return ((_a = this.workspaceService.getWorkspace().folders[0]) === null || _a === void 0 ? void 0 : _a.uri) || uri_1.URI.file('/');
        }
        get trustedUriEntries() {
            const currentWorkspace = this.workspaceService.getWorkspace();
            const currentWorkspaceUris = currentWorkspace.folders.map(folder => folder.uri);
            if (currentWorkspace.configuration) {
                currentWorkspaceUris.push(currentWorkspace.configuration);
            }
            const entries = this.workspaceTrustManagementService.getTrustedUris().map(uri => {
                let relatedToCurrentWorkspace = false;
                for (const workspaceUri of currentWorkspaceUris) {
                    relatedToCurrentWorkspace = relatedToCurrentWorkspace || this.uriService.extUri.isEqualOrParent(workspaceUri, uri);
                }
                return {
                    uri,
                    parentOfWorkspaceItem: relatedToCurrentWorkspace
                };
            });
            // Sort entries
            const sortedEntries = entries.sort((a, b) => {
                if (a.uri.scheme !== b.uri.scheme) {
                    if (a.uri.scheme === network_1.Schemas.file) {
                        return -1;
                    }
                    if (b.uri.scheme === network_1.Schemas.file) {
                        return 1;
                    }
                }
                const aIsWorkspace = a.uri.path.endsWith('.code-workspace');
                const bIsWorkspace = b.uri.path.endsWith('.code-workspace');
                if (aIsWorkspace !== bIsWorkspace) {
                    if (aIsWorkspace) {
                        return 1;
                    }
                    if (bIsWorkspace) {
                        return -1;
                    }
                }
                return a.uri.fsPath.localeCompare(b.uri.fsPath);
            });
            return sortedEntries;
        }
        layout() {
            this.table.layout((this.trustedUriEntries.length * TrustedUriTableVirtualDelegate.ROW_HEIGHT) + TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT, undefined);
        }
        updateTable() {
            const entries = this.trustedUriEntries;
            this.container.classList.toggle('empty', entries.length === 0);
            this.descriptionElement.innerText = entries.length ?
                (0, nls_1.localize)('trustedFoldersDescription', "You trust the following folders, their subfolders, and workspace files.") :
                (0, nls_1.localize)('noTrustedFoldersDescriptions', "You haven't trusted any folders or workspace files yet.");
            this.table.splice(0, Number.POSITIVE_INFINITY, this.trustedUriEntries);
            this.layout();
        }
        validateUri(path, item) {
            if (!item) {
                return null;
            }
            if (item.uri.scheme === 'vscode-vfs') {
                const segments = path.split(path_1.posix.sep).filter(s => s.length);
                if (segments.length === 0 && path.startsWith(path_1.posix.sep)) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)('trustAll', "You will trust all repositories on {0}.", getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length === 1) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)('trustOrg', "You will trust all repositories and forks under '{0}' on {1}.", segments[0], getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length > 2) {
                    return {
                        type: 3 /* MessageType.ERROR */,
                        content: (0, nls_1.localize)('invalidTrust', "You cannot trust individual folders within a repository.", path)
                    };
                }
            }
            return null;
        }
        acceptEdit(item, uri) {
            const trustedFolders = this.workspaceTrustManagementService.getTrustedUris();
            const index = trustedFolders.findIndex(u => this.uriService.extUri.isEqual(u, item.uri));
            if (index >= trustedFolders.length || index === -1) {
                trustedFolders.push(uri);
            }
            else {
                trustedFolders[index] = uri;
            }
            this.workspaceTrustManagementService.setTrustedUris(trustedFolders);
            this._onDidAcceptEdit.fire(item);
        }
        rejectEdit(item) {
            this._onDidRejectEdit.fire(item);
        }
        async delete(item) {
            await this.workspaceTrustManagementService.setUrisTrust([item.uri], false);
            this._onDelete.fire(item);
        }
        async edit(item, usePickerIfPossible) {
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            if (canUseOpenDialog && usePickerIfPossible) {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: item.uri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.acceptEdit(item, uri[0]);
                }
                else {
                    this.rejectEdit(item);
                }
            }
            else {
                this.selectTrustedUriEntry(item);
                this._onEdit.fire(item);
            }
        }
    };
    WorkspaceTrustedUrisTable = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, label_1.ILabelService),
        __param(6, themeService_1.IThemeService),
        __param(7, dialogs_1.IFileDialogService)
    ], WorkspaceTrustedUrisTable);
    class TrustedUriTableVirtualDelegate {
        constructor() {
            this.headerRowHeight = TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT;
        }
        getHeight(item) {
            return TrustedUriTableVirtualDelegate.ROW_HEIGHT;
        }
    }
    TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT = 30;
    TrustedUriTableVirtualDelegate.ROW_HEIGHT = 24;
    let TrustedUriActionsColumnRenderer = class TrustedUriActionsColumnRenderer {
        constructor(table, currentWorkspaceUri, uriService) {
            this.table = table;
            this.currentWorkspaceUri = currentWorkspaceUri;
            this.uriService = uriService;
            this.templateId = TrustedUriActionsColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(element, { animated: false });
            return { actionBar };
        }
        renderElement(item, index, templateData, height) {
            templateData.actionBar.clear();
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            const actions = [];
            if (canUseOpenDialog) {
                actions.push(this.createPickerAction(item));
            }
            actions.push(this.createEditAction(item));
            actions.push(this.createDeleteAction(item));
            templateData.actionBar.push(actions, { icon: true });
        }
        createEditAction(item) {
            return {
                class: themeService_1.ThemeIcon.asClassName(editIcon),
                enabled: true,
                id: 'editTrustedUri',
                tooltip: (0, nls_1.localize)('editTrustedUri', "Edit Path"),
                run: () => {
                    this.table.edit(item, false);
                }
            };
        }
        createPickerAction(item) {
            return {
                class: themeService_1.ThemeIcon.asClassName(folderPickerIcon),
                enabled: true,
                id: 'pickerTrustedUri',
                tooltip: (0, nls_1.localize)('pickerTrustedUri', "Open File Picker"),
                run: () => {
                    this.table.edit(item, true);
                }
            };
        }
        createDeleteAction(item) {
            return {
                class: themeService_1.ThemeIcon.asClassName(removeIcon),
                enabled: true,
                id: 'deleteTrustedUri',
                tooltip: (0, nls_1.localize)('deleteTrustedUri', "Delete Path"),
                run: async () => {
                    await this.table.delete(item);
                }
            };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    TrustedUriActionsColumnRenderer.TEMPLATE_ID = 'actions';
    TrustedUriActionsColumnRenderer = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService)
    ], TrustedUriActionsColumnRenderer);
    let TrustedUriPathColumnRenderer = class TrustedUriPathColumnRenderer {
        constructor(table, contextViewService, themeService) {
            this.table = table;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.templateId = TrustedUriPathColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.path'));
            const pathLabel = element.appendChild((0, dom_1.$)('div.path-label'));
            const pathInput = new inputBox_1.InputBox(element, this.contextViewService, {
                validationOptions: {
                    validation: value => this.table.validateUri(value, this.currentItem)
                }
            });
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, styler_1.attachInputBoxStyler)(pathInput, this.themeService));
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            return {
                element,
                pathLabel,
                pathInput,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            this.currentItem = item;
            templateData.renderDisposables.add(this.table.onEdit(async (e) => {
                if (item === e) {
                    templateData.element.classList.add('input-mode');
                    templateData.pathInput.focus();
                    templateData.pathInput.select();
                    templateData.element.parentElement.style.paddingLeft = '0px';
                }
            }));
            // stop double click action from re-rendering the element on the table #125052
            templateData.renderDisposables.add((0, dom_1.addDisposableListener)(templateData.pathInput.element, dom_1.EventType.DBLCLICK, e => {
                dom_1.EventHelper.stop(e);
            }));
            const hideInputBox = () => {
                templateData.element.classList.remove('input-mode');
                templateData.element.parentElement.style.paddingLeft = '5px';
            };
            const accept = () => {
                hideInputBox();
                const pathToUse = templateData.pathInput.value;
                const uri = (0, extpath_1.hasDriveLetter)(pathToUse) ? item.uri.with({ path: path_1.posix.sep + (0, extpath_1.toSlashes)(pathToUse) }) : item.uri.with({ path: pathToUse });
                templateData.pathLabel.innerText = this.formatPath(uri);
                if (uri) {
                    this.table.acceptEdit(item, uri);
                }
            };
            const reject = () => {
                hideInputBox();
                templateData.pathInput.value = stringValue;
                this.table.rejectEdit(item);
            };
            templateData.renderDisposables.add((0, dom_1.addStandardDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.KEY_DOWN, e => {
                let handled = false;
                if (e.equals(3 /* KeyCode.Enter */)) {
                    accept();
                    handled = true;
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    reject();
                    handled = true;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            templateData.renderDisposables.add(((0, dom_1.addDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.BLUR, () => {
                reject();
            })));
            const stringValue = this.formatPath(item.uri);
            templateData.pathInput.value = stringValue;
            templateData.pathLabel.innerText = stringValue;
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
            templateData.renderDisposables.dispose();
        }
        formatPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return uri.fsPath;
            }
            // If the path is not a file uri, but points to a windows remote, we should create windows fs path
            // e.g. /c:/user/directory => C:\user\directory
            if (uri.path.startsWith(path_1.posix.sep)) {
                const pathWithoutLeadingSeparator = uri.path.substring(1);
                const isWindowsPath = (0, extpath_1.hasDriveLetter)(pathWithoutLeadingSeparator, true);
                if (isWindowsPath) {
                    return path_1.win32.normalize(pathWithoutLeadingSeparator);
                }
            }
            return uri.path;
        }
    };
    TrustedUriPathColumnRenderer.TEMPLATE_ID = 'path';
    TrustedUriPathColumnRenderer = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, themeService_1.IThemeService)
    ], TrustedUriPathColumnRenderer);
    function getHostLabel(labelService, item) {
        return item.uri.authority ? labelService.getHostLabel(item.uri.scheme, item.uri.authority) : (0, nls_1.localize)('localAuthority', "Local");
    }
    let TrustedUriHostColumnRenderer = class TrustedUriHostColumnRenderer {
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = TrustedUriHostColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            const element = container.appendChild((0, dom_1.$)('.host'));
            const hostContainer = element.appendChild((0, dom_1.$)('div.host-label'));
            const buttonBarContainer = element.appendChild((0, dom_1.$)('div.button-bar'));
            return {
                element,
                hostContainer,
                buttonBarContainer,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            templateData.renderDisposables.add({ dispose: () => { (0, dom_1.clearNode)(templateData.buttonBarContainer); } });
            templateData.hostContainer.innerText = getHostLabel(this.labelService, item);
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
            templateData.hostContainer.style.display = '';
            templateData.buttonBarContainer.style.display = 'none';
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    TrustedUriHostColumnRenderer.TEMPLATE_ID = 'host';
    TrustedUriHostColumnRenderer = __decorate([
        __param(0, label_1.ILabelService)
    ], TrustedUriHostColumnRenderer);
    let WorkspaceTrustEditor = class WorkspaceTrustEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, storageService, workspaceService, extensionWorkbenchService, extensionManifestPropertiesService, instantiationService, contextMenuService, workspaceTrustManagementService, configurationService, extensionEnablementService, productService) {
            super(WorkspaceTrustEditor.ID, telemetryService, themeService, storageService);
            this.workspaceService = workspaceService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.extensionEnablementService = extensionEnablementService;
            this.productService = productService;
            this.rendering = false;
            this.rerenderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.layoutParticipants = [];
        }
        createEditor(parent) {
            this.rootElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-editor', { tabindex: '0' }));
            this.rootElement.style.visibility = 'hidden';
            this.createHeaderElement(this.rootElement);
            const scrollableContent = (0, dom_1.$)('.workspace-trust-editor-body');
            this.bodyScrollBar = this._register(new scrollableElement_1.DomScrollableElement(scrollableContent, {
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
                vertical: 1 /* ScrollbarVisibility.Auto */,
            }));
            (0, dom_1.append)(this.rootElement, this.bodyScrollBar.getDomNode());
            this.createAffectedFeaturesElement(scrollableContent);
            this.createConfigurationElement(scrollableContent);
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { debugIconStartForeground: debugColors_1.debugIconStartForeground, editorErrorForeground: colorRegistry_1.editorErrorForeground, buttonBackground: colorRegistry_1.buttonBackground, buttonSecondaryBackground: colorRegistry_1.buttonSecondaryBackground }, colors => {
                var _a, _b, _c, _d;
                this.rootElement.style.setProperty('--workspace-trust-selected-color', ((_a = colors.buttonBackground) === null || _a === void 0 ? void 0 : _a.toString()) || '');
                this.rootElement.style.setProperty('--workspace-trust-unselected-color', ((_b = colors.buttonSecondaryBackground) === null || _b === void 0 ? void 0 : _b.toString()) || '');
                this.rootElement.style.setProperty('--workspace-trust-check-color', ((_c = colors.debugIconStartForeground) === null || _c === void 0 ? void 0 : _c.toString()) || '');
                this.rootElement.style.setProperty('--workspace-trust-x-color', ((_d = colors.editorErrorForeground) === null || _d === void 0 ? void 0 : _d.toString()) || '');
            }));
            // Navigate page with keyboard
            this._register((0, dom_1.addDisposableListener)(this.rootElement, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(16 /* KeyCode.UpArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                    const navOrder = [this.headerContainer, this.trustedContainer, this.untrustedContainer, this.configurationContainer];
                    const currentIndex = navOrder.findIndex(element => {
                        return (0, dom_1.isAncestor)(document.activeElement, element);
                    });
                    let newIndex = currentIndex;
                    if (event.equals(18 /* KeyCode.DownArrow */)) {
                        newIndex++;
                    }
                    else if (event.equals(16 /* KeyCode.UpArrow */)) {
                        newIndex = Math.max(0, newIndex);
                        newIndex--;
                    }
                    newIndex += navOrder.length;
                    newIndex %= navOrder.length;
                    navOrder[newIndex].focus();
                }
                else if (event.equals(9 /* KeyCode.Escape */)) {
                    this.rootElement.focus();
                }
            }));
        }
        focus() {
            this.rootElement.focus();
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            if (token.isCancellationRequested) {
                return;
            }
            await this.workspaceTrustManagementService.workspaceTrustInitialized;
            this.registerListeners();
            this.render();
        }
        registerListeners() {
            this._register(this.extensionWorkbenchService.onChange(() => this.render()));
            this._register(this.configurationService.onDidChangeRestrictedSettings(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrust(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => this.render()));
        }
        getHeaderContainerClass(trusted) {
            if (trusted) {
                return 'workspace-trust-header workspace-trust-trusted';
            }
            return 'workspace-trust-header workspace-trust-untrusted';
        }
        getHeaderTitleText(trusted) {
            if (trusted) {
                if (this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                    return (0, nls_1.localize)('trustedUnsettableWindow', "This window is trusted");
                }
                switch (this.workspaceService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                        return (0, nls_1.localize)('trustedHeaderWindow', "You trust this window");
                    case 2 /* WorkbenchState.FOLDER */:
                        return (0, nls_1.localize)('trustedHeaderFolder', "You trust this folder");
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return (0, nls_1.localize)('trustedHeaderWorkspace', "You trust this workspace");
                }
            }
            return (0, nls_1.localize)('untrustedHeader', "You are in Restricted Mode");
        }
        getHeaderTitleIconClassNames(trusted) {
            return themeService_1.ThemeIcon.asClassNameArray(exports.shieldIcon);
        }
        getFeaturesHeaderText(trusted) {
            let title = '';
            let subTitle = '';
            switch (this.workspaceService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: {
                    title = trusted ? (0, nls_1.localize)('trustedWindow', "In a Trusted Window") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWindowSubtitle', "You trust the authors of the files in the current window. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWindowSubtitle', "You do not trust the authors of the files in the current window. The following features are disabled:");
                    break;
                }
                case 2 /* WorkbenchState.FOLDER */: {
                    title = trusted ? (0, nls_1.localize)('trustedFolder', "In a Trusted Folder") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedFolderSubtitle', "You trust the authors of the files in the current folder. All features are enabled:") :
                        (0, nls_1.localize)('untrustedFolderSubtitle', "You do not trust the authors of the files in the current folder. The following features are disabled:");
                    break;
                }
                case 3 /* WorkbenchState.WORKSPACE */: {
                    title = trusted ? (0, nls_1.localize)('trustedWorkspace', "In a Trusted Workspace") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWorkspaceSubtitle', "You trust the authors of the files in the current workspace. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWorkspaceSubtitle', "You do not trust the authors of the files in the current workspace. The following features are disabled:");
                    break;
                }
            }
            return [title, subTitle];
        }
        async render() {
            if (this.rendering) {
                return;
            }
            this.rendering = true;
            this.rerenderDisposables.clear();
            const isWorkspaceTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            this.rootElement.classList.toggle('trusted', isWorkspaceTrusted);
            this.rootElement.classList.toggle('untrusted', !isWorkspaceTrusted);
            // Header Section
            this.headerTitleText.innerText = this.getHeaderTitleText(isWorkspaceTrusted);
            this.headerTitleIcon.className = 'workspace-trust-title-icon';
            this.headerTitleIcon.classList.add(...this.getHeaderTitleIconClassNames(isWorkspaceTrusted));
            this.headerDescription.innerText = '';
            const headerDescriptionText = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            headerDescriptionText.innerText = isWorkspaceTrusted ?
                (0, nls_1.localize)('trustedDescription', "All features are enabled because trust has been granted to the workspace.") :
                (0, nls_1.localize)('untrustedDescription', "{0} is in a restricted mode intended for safe code browsing.", this.productService.nameShort);
            const headerDescriptionActions = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            const headerDescriptionActionsText = (0, nls_1.localize)({ key: 'workspaceTrustEditorHeaderActions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[Configure your settings]({0}) or [learn more](https://aka.ms/vscode-workspace-trust).", `command:workbench.trust.configure`);
            for (const node of (0, linkedText_1.parseLinkedText)(headerDescriptionActionsText).nodes) {
                if (typeof node === 'string') {
                    (0, dom_1.append)(headerDescriptionActions, document.createTextNode(node));
                }
                else {
                    this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, headerDescriptionActions, Object.assign(Object.assign({}, node), { tabIndex: -1 }), {}));
                }
            }
            this.headerContainer.className = this.getHeaderContainerClass(isWorkspaceTrusted);
            this.rootElement.setAttribute('aria-label', `${(0, nls_1.localize)('root element label', "Manage Workspace Trust")}:  ${this.headerContainer.innerText}`);
            // Settings
            const restrictedSettings = this.configurationService.restrictedSettings;
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const settingsRequiringTrustedWorkspaceCount = restrictedSettings.default.filter(key => {
                var _a;
                const property = configurationRegistry.getConfigurationProperties()[key];
                // cannot be configured in workspace
                if (property.scope === 1 /* ConfigurationScope.APPLICATION */ || property.scope === 2 /* ConfigurationScope.MACHINE */) {
                    return false;
                }
                // If deprecated include only those configured in the workspace
                if (property.deprecationMessage || property.markdownDeprecationMessage) {
                    if ((_a = restrictedSettings.workspace) === null || _a === void 0 ? void 0 : _a.includes(key)) {
                        return true;
                    }
                    if (restrictedSettings.workspaceFolder) {
                        for (const workspaceFolderSettings of restrictedSettings.workspaceFolder.values()) {
                            if (workspaceFolderSettings.includes(key)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                return true;
            }).length;
            // Features List
            this.renderAffectedFeatures(settingsRequiringTrustedWorkspaceCount, this.getExtensionCount());
            // Configuration Tree
            this.workspaceTrustedUrisTable.updateTable();
            this.bodyScrollBar.getDomNode().style.height = `calc(100% - ${this.headerContainer.clientHeight}px)`;
            this.bodyScrollBar.scanDomNode();
            this.rootElement.style.visibility = '';
            this.rendering = false;
        }
        getExtensionCount() {
            const set = new Set();
            const inVirtualWorkspace = (0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceService.getWorkspace());
            const localExtensions = this.extensionWorkbenchService.local.filter(ext => ext.local).map(ext => ext.local);
            for (const extension of localExtensions) {
                const enablementState = this.extensionEnablementService.getEnablementState(extension);
                if (enablementState !== 8 /* EnablementState.EnabledGlobally */ && enablementState !== 9 /* EnablementState.EnabledWorkspace */ &&
                    enablementState !== 0 /* EnablementState.DisabledByTrustRequirement */ && enablementState !== 5 /* EnablementState.DisabledByExtensionDependency */) {
                    continue;
                }
                if (inVirtualWorkspace && this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(extension.manifest) === false) {
                    continue;
                }
                if (this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(extension.manifest) !== true) {
                    set.add(extension.identifier.id);
                    continue;
                }
                const dependencies = (0, extensionManagementUtil_1.getExtensionDependencies)(localExtensions, extension);
                if (dependencies.some(ext => this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(ext.manifest) === false)) {
                    set.add(extension.identifier.id);
                }
            }
            return set.size;
        }
        createHeaderElement(parent) {
            this.headerContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-header', { tabIndex: '0' }));
            this.headerTitleContainer = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-title'));
            this.headerTitleIcon = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-icon'));
            this.headerTitleText = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-text'));
            this.headerDescription = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-description'));
        }
        createConfigurationElement(parent) {
            this.configurationContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-settings', { tabIndex: '0' }));
            const configurationTitle = (0, dom_1.append)(this.configurationContainer, (0, dom_1.$)('.workspace-trusted-folders-title'));
            configurationTitle.innerText = (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces");
            this.workspaceTrustedUrisTable = this._register(this.instantiationService.createInstance(WorkspaceTrustedUrisTable, this.configurationContainer));
        }
        createAffectedFeaturesElement(parent) {
            this.affectedFeaturesContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-features'));
            this.trustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.trusted', { tabIndex: '0' }));
            this.untrustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.untrusted', { tabIndex: '0' }));
        }
        async renderAffectedFeatures(numSettings, numExtensions) {
            (0, dom_1.clearNode)(this.trustedContainer);
            (0, dom_1.clearNode)(this.untrustedContainer);
            // Trusted features
            const [trustedTitle, trustedSubTitle] = this.getFeaturesHeaderText(true);
            this.renderLimitationsHeaderElement(this.trustedContainer, trustedTitle, trustedSubTitle);
            const trustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedExtensions', "All extensions are enabled")
                ] :
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedSettings', "All workspace settings are applied"),
                    (0, nls_1.localize)('trustedExtensions', "All extensions are enabled")
                ];
            this.renderLimitationsListElement(this.trustedContainer, trustedContainerItems, themeService_1.ThemeIcon.asClassNameArray(checkListIcon));
            // Restricted Mode features
            const [untrustedTitle, untrustedSubTitle] = this.getFeaturesHeaderText(false);
            this.renderLimitationsHeaderElement(this.untrustedContainer, untrustedTitle, untrustedSubTitle);
            const untrustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ] :
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks(numSettings ? (0, nls_1.localize)({ key: 'untrustedSettings', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} workspace settings]({1}) are not applied", numSettings, 'command:settings.filterUntrusted') : (0, nls_1.localize)('no untrustedSettings', "Workspace settings requiring trust are not applied")),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ];
            this.renderLimitationsListElement(this.untrustedContainer, untrustedContainerItems, themeService_1.ThemeIcon.asClassNameArray(xListIcon));
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addDontTrustButtonToElement(this.untrustedContainer);
                }
                else {
                    this.addTrustedTextToElement(this.untrustedContainer);
                }
            }
            else {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addTrustButtonToElement(this.trustedContainer);
                }
            }
        }
        createButtonRow(parent, actions, enabled) {
            var _a, _b;
            const buttonRow = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-buttons-row'));
            const buttonContainer = (0, dom_1.append)(buttonRow, (0, dom_1.$)('.workspace-trust-buttons'));
            const buttonBar = this.rerenderDisposables.add(new button_1.ButtonBar(buttonContainer));
            if (actions instanceof actions_1.Action) {
                actions = [actions];
            }
            for (const action of actions) {
                const button = action instanceof notifications_1.ChoiceAction && ((_a = action.menu) === null || _a === void 0 ? void 0 : _a.length) ?
                    buttonBar.addButtonWithDropdown({
                        title: true,
                        actions: (_b = action.menu) !== null && _b !== void 0 ? _b : [],
                        contextMenuProvider: this.contextMenuService
                    }) :
                    buttonBar.addButton();
                button.label = action.label;
                button.enabled = enabled !== undefined ? enabled : action.enabled;
                this.rerenderDisposables.add(button.onDidClick(e => {
                    if (e) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    action.run();
                }));
                this.rerenderDisposables.add((0, styler_1.attachButtonStyler)(button, this.themeService));
            }
        }
        addTrustButtonToElement(parent) {
            const trustActions = [
                new actions_1.Action('workspace.trust.button.action.grant', (0, nls_1.localize)('trustButton', "Trust"), undefined, true, async () => {
                    await this.workspaceTrustManagementService.setWorkspaceTrust(true);
                })
            ];
            if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceService.getWorkspace());
                const { name } = (0, labels_1.splitName)((0, labels_1.splitName)(workspaceIdentifier.uri.fsPath).parentPath);
                const trustMessageElement = (0, dom_1.append)(parent, (0, dom_1.$)('.trust-message-box'));
                trustMessageElement.innerText = (0, nls_1.localize)('trustMessage', "Trust the authors of all files in the current folder or its parent '{0}'.", name);
                trustActions.push(new actions_1.Action('workspace.trust.button.action.grantParent', (0, nls_1.localize)('trustParentButton', "Trust Parent"), undefined, true, async () => {
                    await this.workspaceTrustManagementService.setParentFolderTrust(true);
                }));
            }
            this.createButtonRow(parent, trustActions);
        }
        addDontTrustButtonToElement(parent) {
            this.createButtonRow(parent, new actions_1.Action('workspace.trust.button.action.deny', (0, nls_1.localize)('dontTrustButton', "Don't Trust"), undefined, true, async () => {
                await this.workspaceTrustManagementService.setWorkspaceTrust(false);
            }));
        }
        addTrustedTextToElement(parent) {
            if (this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return;
            }
            const textElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-untrusted-description'));
            if (!this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                textElement.innerText = this.workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? (0, nls_1.localize)('untrustedWorkspaceReason', "This workspace is trusted via the bolded entries in the trusted folders below.") : (0, nls_1.localize)('untrustedFolderReason', "This folder is trusted via the bolded entries in the the trusted folders below.");
            }
            else {
                textElement.innerText = (0, nls_1.localize)('trustedForcedReason', "This window is trusted by nature of the workspace that is opened.");
            }
        }
        renderLimitationsHeaderElement(parent, headerText, subtitleText) {
            const limitationsHeaderContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-header'));
            const titleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-title'));
            const textElement = (0, dom_1.append)(titleElement, (0, dom_1.$)('.workspace-trust-limitations-title-text'));
            const subtitleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-subtitle'));
            textElement.innerText = headerText;
            subtitleElement.innerText = subtitleText;
        }
        renderLimitationsListElement(parent, limitations, iconClassNames) {
            const listContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-list-container'));
            const limitationsList = (0, dom_1.append)(listContainer, (0, dom_1.$)('ul'));
            for (const limitation of limitations) {
                const limitationListItem = (0, dom_1.append)(limitationsList, (0, dom_1.$)('li'));
                const icon = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-icon'));
                const text = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-text'));
                icon.classList.add(...iconClassNames);
                const linkedText = (0, linkedText_1.parseLinkedText)(limitation);
                for (const node of linkedText.nodes) {
                    if (typeof node === 'string') {
                        (0, dom_1.append)(text, document.createTextNode(node));
                    }
                    else {
                        this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, text, Object.assign(Object.assign({}, node), { tabIndex: -1 }), {}));
                    }
                }
            }
        }
        layout(dimension) {
            if (!this.isVisible()) {
                return;
            }
            this.workspaceTrustedUrisTable.layout();
            this.layoutParticipants.forEach(participant => {
                participant.layout();
            });
            this.bodyScrollBar.scanDomNode();
        }
    };
    WorkspaceTrustEditor.ID = 'workbench.editor.workspaceTrust';
    __decorate([
        (0, decorators_1.debounce)(100)
    ], WorkspaceTrustEditor.prototype, "render", null);
    WorkspaceTrustEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, extensions_1.IExtensionsWorkbenchService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(9, configuration_1.IWorkbenchConfigurationService),
        __param(10, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(11, productService_1.IProductService)
    ], WorkspaceTrustEditor);
    exports.WorkspaceTrustEditor = WorkspaceTrustEditor;
    // Highly scoped fix for #126614
    function fixBadLocalizedLinks(badString) {
        const regex = /(.*)\[(.+)\]\s*\((.+)\)(.*)/; // markdown link match with spaces
        return badString.replace(regex, '$1[$2]($3)$4');
    }
});
//# sourceMappingURL=workspaceTrustEditor.js.map