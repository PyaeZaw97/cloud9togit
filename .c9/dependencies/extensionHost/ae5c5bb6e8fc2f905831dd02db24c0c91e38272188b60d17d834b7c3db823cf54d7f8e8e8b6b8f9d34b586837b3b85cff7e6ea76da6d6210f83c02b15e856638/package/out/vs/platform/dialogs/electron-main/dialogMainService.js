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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/hash", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/node/pfs", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/state/electron-main/state", "vs/platform/workspace/common/workspace"], function (require, exports, electron_1, async_1, hash_1, labels_1, lifecycle_1, normalization_1, path_1, platform_1, types_1, pfs_1, nls_1, instantiation_1, log_1, state_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogMainService = exports.IDialogMainService = void 0;
    exports.IDialogMainService = (0, instantiation_1.createDecorator)('dialogMainService');
    let DialogMainService = class DialogMainService {
        constructor(stateMainService, logService) {
            this.stateMainService = stateMainService;
            this.logService = logService;
            this.windowFileDialogLocks = new Map();
            this.windowDialogQueues = new Map();
            this.noWindowDialogueQueue = new async_1.Queue();
        }
        pickFileFolder(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFolders: true, pickFiles: true, title: (0, nls_1.localize)('open', "Open") }), window);
        }
        pickFolder(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFolders: true, title: (0, nls_1.localize)('openFolder', "Open Folder") }), window);
        }
        pickFile(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFiles: true, title: (0, nls_1.localize)('openFile', "Open File") }), window);
        }
        pickWorkspace(options, window) {
            const title = (0, nls_1.localize)('openWorkspaceTitle', "Open Workspace from File");
            const buttonLabel = (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'openWorkspace', comment: ['&& denotes a mnemonic'] }, "&&Open"));
            const filters = workspace_1.WORKSPACE_FILTER;
            return this.doPick(Object.assign(Object.assign({}, options), { pickFiles: true, title, filters, buttonLabel }), window);
        }
        async doPick(options, window) {
            // Ensure dialog options
            const dialogOptions = {
                title: options.title,
                buttonLabel: options.buttonLabel,
                filters: options.filters
            };
            // Ensure defaultPath
            dialogOptions.defaultPath = options.defaultPath || this.stateMainService.getItem(DialogMainService.workingDirPickerStorageKey);
            // Ensure properties
            if (typeof options.pickFiles === 'boolean' || typeof options.pickFolders === 'boolean') {
                dialogOptions.properties = undefined; // let it override based on the booleans
                if (options.pickFiles && options.pickFolders) {
                    dialogOptions.properties = ['multiSelections', 'openDirectory', 'openFile', 'createDirectory'];
                }
            }
            if (!dialogOptions.properties) {
                dialogOptions.properties = ['multiSelections', options.pickFolders ? 'openDirectory' : 'openFile', 'createDirectory'];
            }
            if (platform_1.isMacintosh) {
                dialogOptions.properties.push('treatPackageAsDirectory'); // always drill into .app files
            }
            // Show Dialog
            const windowToUse = window || electron_1.BrowserWindow.getFocusedWindow();
            const result = await this.showOpenDialog(dialogOptions, (0, types_1.withNullAsUndefined)(windowToUse));
            if (result && result.filePaths && result.filePaths.length > 0) {
                // Remember path in storage for next time
                this.stateMainService.setItem(DialogMainService.workingDirPickerStorageKey, (0, path_1.dirname)(result.filePaths[0]));
                return result.filePaths;
            }
            return;
        }
        getWindowDialogQueue(window) {
            // Queue message box requests per window so that one can show
            // after the other.
            if (window) {
                let windowDialogQueue = this.windowDialogQueues.get(window.id);
                if (!windowDialogQueue) {
                    windowDialogQueue = new async_1.Queue();
                    this.windowDialogQueues.set(window.id, windowDialogQueue);
                }
                return windowDialogQueue;
            }
            else {
                return this.noWindowDialogueQueue;
            }
        }
        showMessageBox(options, window) {
            return this.getWindowDialogQueue(window).queue(async () => {
                if (window) {
                    return electron_1.dialog.showMessageBox(window, options);
                }
                return electron_1.dialog.showMessageBox(options);
            });
        }
        async showSaveDialog(options, window) {
            // prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file save dialog is already or will be showing for the window with the same configuration');
                return { canceled: true };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showSaveDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showSaveDialog(options);
                    }
                    result.filePath = this.normalizePath(result.filePath);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        normalizePath(path) {
            if (path && platform_1.isMacintosh) {
                path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
            }
            return path;
        }
        normalizePaths(paths) {
            return paths.map(path => this.normalizePath(path));
        }
        async showOpenDialog(options, window) {
            // Ensure the path exists (if provided)
            if (options.defaultPath) {
                const pathExists = await pfs_1.Promises.exists(options.defaultPath);
                if (!pathExists) {
                    options.defaultPath = undefined;
                }
            }
            // prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file open dialog is already or will be showing for the window with the same configuration');
                return { canceled: true, filePaths: [] };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showOpenDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showOpenDialog(options);
                    }
                    result.filePaths = this.normalizePaths(result.filePaths);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        acquireFileDialogLock(options, window) {
            // if no window is provided, allow as many dialogs as
            // needed since we consider them not modal per window
            if (!window) {
                return lifecycle_1.Disposable.None;
            }
            // if a window is provided, only allow a single dialog
            // at the same time because dialogs are modal and we
            // do not want to open one dialog after the other
            // (https://github.com/microsoft/vscode/issues/114432)
            // we figure this out by `hashing` the configuration
            // options for the dialog to prevent duplicates
            this.logService.trace('[DialogMainService]: request to acquire file dialog lock', options);
            let windowFileDialogLocks = this.windowFileDialogLocks.get(window.id);
            if (!windowFileDialogLocks) {
                windowFileDialogLocks = new Set();
                this.windowFileDialogLocks.set(window.id, windowFileDialogLocks);
            }
            const optionsHash = (0, hash_1.hash)(options);
            if (windowFileDialogLocks.has(optionsHash)) {
                return undefined; // prevent duplicates, return
            }
            this.logService.trace('[DialogMainService]: new file dialog lock created', options);
            windowFileDialogLocks.add(optionsHash);
            return (0, lifecycle_1.toDisposable)(() => {
                this.logService.trace('[DialogMainService]: file dialog lock disposed', options);
                windowFileDialogLocks === null || windowFileDialogLocks === void 0 ? void 0 : windowFileDialogLocks.delete(optionsHash);
                // if the window has no more dialog locks, delete it from the set of locks
                if ((windowFileDialogLocks === null || windowFileDialogLocks === void 0 ? void 0 : windowFileDialogLocks.size) === 0) {
                    this.windowFileDialogLocks.delete(window.id);
                }
            });
        }
    };
    DialogMainService.workingDirPickerStorageKey = 'pickerWorkingDir';
    DialogMainService = __decorate([
        __param(0, state_1.IStateMainService),
        __param(1, log_1.ILogService)
    ], DialogMainService);
    exports.DialogMainService = DialogMainService;
});
//# sourceMappingURL=dialogMainService.js.map