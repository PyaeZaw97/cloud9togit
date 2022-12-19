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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsShellHelper = void 0;
    const SHELL_EXECUTABLES = [
        'cmd.exe',
        'powershell.exe',
        'pwsh.exe',
        'bash.exe',
        'wsl.exe',
        'ubuntu.exe',
        'ubuntu1804.exe',
        'kali.exe',
        'debian.exe',
        'opensuse-42.exe',
        'sles-12.exe'
    ];
    let windowsProcessTree;
    class WindowsShellHelper extends lifecycle_1.Disposable {
        constructor(_rootProcessId) {
            super();
            this._rootProcessId = _rootProcessId;
            this._shellTitle = '';
            this._onShellNameChanged = new event_1.Emitter();
            this._onShellTypeChanged = new event_1.Emitter();
            if (!platform_1.isWindows) {
                throw new Error(`WindowsShellHelper cannot be instantiated on ${platform_1.platform}`);
            }
            this._isDisposed = false;
            this._startMonitoringShell();
        }
        get shellType() { return this._shellType; }
        get shellTitle() { return this._shellTitle; }
        get onShellNameChanged() { return this._onShellNameChanged.event; }
        get onShellTypeChanged() { return this._onShellTypeChanged.event; }
        async _startMonitoringShell() {
            if (this._isDisposed) {
                return;
            }
            this.checkShell();
        }
        async checkShell() {
            if (platform_1.isWindows) {
                // Wait to give the shell some time to actually launch a process, this
                // could lead to a race condition but it would be recovered from when
                // data stops and should cover the majority of cases
                await (0, async_1.timeout)(300);
                this.getShellName().then(title => {
                    const type = this.getShellType(title);
                    if (type !== this._shellType) {
                        this._onShellTypeChanged.fire(type);
                        this._onShellNameChanged.fire(title);
                        this._shellType = type;
                        this._shellTitle = title;
                    }
                });
            }
        }
        traverseTree(tree) {
            if (!tree) {
                return '';
            }
            if (SHELL_EXECUTABLES.indexOf(tree.name) === -1) {
                return tree.name;
            }
            if (!tree.children || tree.children.length === 0) {
                return tree.name;
            }
            let favouriteChild = 0;
            for (; favouriteChild < tree.children.length; favouriteChild++) {
                const child = tree.children[favouriteChild];
                if (!child.children || child.children.length === 0) {
                    break;
                }
                if (child.children[0].name !== 'conhost.exe') {
                    break;
                }
            }
            if (favouriteChild >= tree.children.length) {
                return tree.name;
            }
            return this.traverseTree(tree.children[favouriteChild]);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        /**
         * Returns the innermost shell executable running in the terminal
         */
        async getShellName() {
            if (this._isDisposed) {
                return Promise.resolve('');
            }
            // Prevent multiple requests at once, instead return current request
            if (this._currentRequest) {
                return this._currentRequest;
            }
            if (!windowsProcessTree) {
                windowsProcessTree = await new Promise((resolve_1, reject_1) => { require(['windows-process-tree'], resolve_1, reject_1); });
            }
            this._currentRequest = new Promise(resolve => {
                windowsProcessTree.getProcessTree(this._rootProcessId, tree => {
                    const name = this.traverseTree(tree);
                    this._currentRequest = undefined;
                    resolve(name);
                });
            });
            return this._currentRequest;
        }
        getShellType(executable) {
            switch (executable.toLowerCase()) {
                case 'cmd.exe':
                    return "cmd" /* WindowsShellType.CommandPrompt */;
                case 'powershell.exe':
                case 'pwsh.exe':
                    return "pwsh" /* WindowsShellType.PowerShell */;
                case 'bash.exe':
                case 'git-cmd.exe':
                    return "gitbash" /* WindowsShellType.GitBash */;
                case 'wsl.exe':
                case 'ubuntu.exe':
                case 'ubuntu1804.exe':
                case 'kali.exe':
                case 'debian.exe':
                case 'opensuse-42.exe':
                case 'sles-12.exe':
                    return "wsl" /* WindowsShellType.Wsl */;
                default:
                    return undefined;
            }
        }
    }
    __decorate([
        (0, decorators_1.debounce)(500)
    ], WindowsShellHelper.prototype, "checkShell", null);
    exports.WindowsShellHelper = WindowsShellHelper;
});
//# sourceMappingURL=windowsShellHelper.js.map