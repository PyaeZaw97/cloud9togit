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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/async", "./extHost.protocol", "vs/base/common/arrays", "vs/base/common/comparers", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uri_1, event_1, decorators_1, lifecycle_1, async_1, extHost_protocol_1, arrays_1, comparers_1, log_1, extensions_1, themeService_1, extHostTypeConverters_1, extensions_2) {
    "use strict";
    var _ExtHostSCMInputBox_proxy, _ExtHostSourceControl_proxy;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSCM = exports.ExtHostSCMInputBox = void 0;
    function getIconResource(decorations) {
        if (!decorations) {
            return undefined;
        }
        else if (typeof decorations.iconPath === 'string') {
            return uri_1.URI.file(decorations.iconPath);
        }
        else if (uri_1.URI.isUri(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else if (themeService_1.ThemeIcon.isThemeIcon(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else {
            return undefined;
        }
    }
    function compareResourceThemableDecorations(a, b) {
        if (!a.iconPath && !b.iconPath) {
            return 0;
        }
        else if (!a.iconPath) {
            return -1;
        }
        else if (!b.iconPath) {
            return 1;
        }
        const aPath = typeof a.iconPath === 'string' ? a.iconPath : uri_1.URI.isUri(a.iconPath) ? a.iconPath.fsPath : a.iconPath.id;
        const bPath = typeof b.iconPath === 'string' ? b.iconPath : uri_1.URI.isUri(b.iconPath) ? b.iconPath.fsPath : b.iconPath.id;
        return (0, comparers_1.comparePaths)(aPath, bPath);
    }
    function compareResourceStatesDecorations(a, b) {
        let result = 0;
        if (a.strikeThrough !== b.strikeThrough) {
            return a.strikeThrough ? 1 : -1;
        }
        if (a.faded !== b.faded) {
            return a.faded ? 1 : -1;
        }
        if (a.tooltip !== b.tooltip) {
            return (a.tooltip || '').localeCompare(b.tooltip || '');
        }
        result = compareResourceThemableDecorations(a, b);
        if (result !== 0) {
            return result;
        }
        if (a.light && b.light) {
            result = compareResourceThemableDecorations(a.light, b.light);
        }
        else if (a.light) {
            return 1;
        }
        else if (b.light) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.dark && b.dark) {
            result = compareResourceThemableDecorations(a.dark, b.dark);
        }
        else if (a.dark) {
            return 1;
        }
        else if (b.dark) {
            return -1;
        }
        return result;
    }
    function compareCommands(a, b) {
        if (a.command !== b.command) {
            return a.command < b.command ? -1 : 1;
        }
        if (a.title !== b.title) {
            return a.title < b.title ? -1 : 1;
        }
        if (a.tooltip !== b.tooltip) {
            if (a.tooltip !== undefined && b.tooltip !== undefined) {
                return a.tooltip < b.tooltip ? -1 : 1;
            }
            else if (a.tooltip !== undefined) {
                return 1;
            }
            else if (b.tooltip !== undefined) {
                return -1;
            }
        }
        if (a.arguments === b.arguments) {
            return 0;
        }
        else if (!a.arguments) {
            return -1;
        }
        else if (!b.arguments) {
            return 1;
        }
        else if (a.arguments.length !== b.arguments.length) {
            return a.arguments.length - b.arguments.length;
        }
        for (let i = 0; i < a.arguments.length; i++) {
            const aArg = a.arguments[i];
            const bArg = b.arguments[i];
            if (aArg === bArg) {
                continue;
            }
            return aArg < bArg ? -1 : 1;
        }
        return 0;
    }
    function compareResourceStates(a, b) {
        let result = (0, comparers_1.comparePaths)(a.resourceUri.fsPath, b.resourceUri.fsPath, true);
        if (result !== 0) {
            return result;
        }
        if (a.command && b.command) {
            result = compareCommands(a.command, b.command);
        }
        else if (a.command) {
            return 1;
        }
        else if (b.command) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.decorations && b.decorations) {
            result = compareResourceStatesDecorations(a.decorations, b.decorations);
        }
        else if (a.decorations) {
            return 1;
        }
        else if (b.decorations) {
            return -1;
        }
        return result;
    }
    function compareArgs(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function commandEquals(a, b) {
        return a.command === b.command
            && a.title === b.title
            && a.tooltip === b.tooltip
            && (a.arguments && b.arguments ? compareArgs(a.arguments, b.arguments) : a.arguments === b.arguments);
    }
    function commandListEquals(a, b) {
        return (0, arrays_1.equals)(a, b, commandEquals);
    }
    class ExtHostSCMInputBox {
        constructor(_extension, proxy, _sourceControlHandle) {
            this._extension = _extension;
            this._sourceControlHandle = _sourceControlHandle;
            _ExtHostSCMInputBox_proxy.set(this, void 0);
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this._placeholder = '';
            this._visible = true;
            __classPrivateFieldSet(this, _ExtHostSCMInputBox_proxy, proxy, "f");
        }
        get value() {
            return this._value;
        }
        set value(value) {
            value = value !== null && value !== void 0 ? value : '';
            __classPrivateFieldGet(this, _ExtHostSCMInputBox_proxy, "f").$setInputBoxValue(this._sourceControlHandle, value);
            this.updateValue(value);
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            __classPrivateFieldGet(this, _ExtHostSCMInputBox_proxy, "f").$setInputBoxPlaceholder(this._sourceControlHandle, placeholder);
            this._placeholder = placeholder;
        }
        get validateInput() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            return this._validateInput;
        }
        set validateInput(fn) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            if (fn && typeof fn !== 'function') {
                throw new Error(`[${this._extension.identifier.value}]: Invalid SCM input box validation function`);
            }
            this._validateInput = fn;
            __classPrivateFieldGet(this, _ExtHostSCMInputBox_proxy, "f").$setValidationProviderIsEnabled(this._sourceControlHandle, !!fn);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            visible = !!visible;
            if (this._visible === visible) {
                return;
            }
            this._visible = visible;
            __classPrivateFieldGet(this, _ExtHostSCMInputBox_proxy, "f").$setInputBoxVisibility(this._sourceControlHandle, visible);
        }
        showValidationMessage(message, type) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            __classPrivateFieldGet(this, _ExtHostSCMInputBox_proxy, "f").$showValidationMessage(this._sourceControlHandle, message, type);
        }
        $onInputBoxValueChange(value) {
            this.updateValue(value);
        }
        updateValue(value) {
            this._value = value;
            this._onDidChange.fire(value);
        }
    }
    exports.ExtHostSCMInputBox = ExtHostSCMInputBox;
    _ExtHostSCMInputBox_proxy = new WeakMap();
    class ExtHostSourceControlResourceGroup {
        constructor(_proxy, _commands, _sourceControlHandle, _id, _label) {
            this._proxy = _proxy;
            this._commands = _commands;
            this._sourceControlHandle = _sourceControlHandle;
            this._id = _id;
            this._label = _label;
            this._resourceHandlePool = 0;
            this._resourceStates = [];
            this._resourceStatesMap = new Map();
            this._resourceStatesCommandsMap = new Map();
            this._resourceStatesDisposablesMap = new Map();
            this._onDidUpdateResourceStates = new event_1.Emitter();
            this.onDidUpdateResourceStates = this._onDidUpdateResourceStates.event;
            this._disposed = false;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._handlesSnapshot = [];
            this._resourceSnapshot = [];
            this._hideWhenEmpty = undefined;
            this.handle = ExtHostSourceControlResourceGroup._handlePool++;
        }
        get disposed() { return this._disposed; }
        get id() { return this._id; }
        get label() { return this._label; }
        set label(label) {
            this._label = label;
            this._proxy.$updateGroupLabel(this._sourceControlHandle, this.handle, label);
        }
        get hideWhenEmpty() { return this._hideWhenEmpty; }
        set hideWhenEmpty(hideWhenEmpty) {
            this._hideWhenEmpty = hideWhenEmpty;
            this._proxy.$updateGroup(this._sourceControlHandle, this.handle, this.features);
        }
        get features() {
            return {
                hideWhenEmpty: this.hideWhenEmpty
            };
        }
        get resourceStates() { return [...this._resourceStates]; }
        set resourceStates(resources) {
            this._resourceStates = [...resources];
            this._onDidUpdateResourceStates.fire();
        }
        getResourceState(handle) {
            return this._resourceStatesMap.get(handle);
        }
        $executeResourceCommand(handle, preserveFocus) {
            const command = this._resourceStatesCommandsMap.get(handle);
            if (!command) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => this._commands.executeCommand(command.command, ...(command.arguments || []), preserveFocus));
        }
        _takeResourceStateSnapshot() {
            var _a;
            const snapshot = [...this._resourceStates].sort(compareResourceStates);
            const diffs = (0, arrays_1.sortedDiff)(this._resourceSnapshot, snapshot, compareResourceStates);
            const splices = diffs.map(diff => {
                const toInsert = diff.toInsert.map(r => {
                    const handle = this._resourceHandlePool++;
                    this._resourceStatesMap.set(handle, r);
                    const sourceUri = r.resourceUri;
                    let command;
                    if (r.command) {
                        if (r.command.command === 'vscode.open' || r.command.command === 'vscode.diff') {
                            const disposables = new lifecycle_1.DisposableStore();
                            command = this._commands.converter.toInternal(r.command, disposables);
                            this._resourceStatesDisposablesMap.set(handle, disposables);
                        }
                        else {
                            this._resourceStatesCommandsMap.set(handle, r.command);
                        }
                    }
                    const icon = getIconResource(r.decorations);
                    const lightIcon = r.decorations && getIconResource(r.decorations.light) || icon;
                    const darkIcon = r.decorations && getIconResource(r.decorations.dark) || icon;
                    const icons = [lightIcon, darkIcon];
                    const tooltip = (r.decorations && r.decorations.tooltip) || '';
                    const strikeThrough = r.decorations && !!r.decorations.strikeThrough;
                    const faded = r.decorations && !!r.decorations.faded;
                    const contextValue = r.contextValue || '';
                    const rawResource = [handle, sourceUri, icons, tooltip, strikeThrough, faded, contextValue, command];
                    return { rawResource, handle };
                });
                return { start: diff.start, deleteCount: diff.deleteCount, toInsert };
            });
            const rawResourceSplices = splices
                .map(({ start, deleteCount, toInsert }) => [start, deleteCount, toInsert.map(i => i.rawResource)]);
            const reverseSplices = splices.reverse();
            for (const { start, deleteCount, toInsert } of reverseSplices) {
                const handles = toInsert.map(i => i.handle);
                const handlesToDelete = this._handlesSnapshot.splice(start, deleteCount, ...handles);
                for (const handle of handlesToDelete) {
                    this._resourceStatesMap.delete(handle);
                    this._resourceStatesCommandsMap.delete(handle);
                    (_a = this._resourceStatesDisposablesMap.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._resourceStatesDisposablesMap.delete(handle);
                }
            }
            this._resourceSnapshot = snapshot;
            return rawResourceSplices;
        }
        dispose() {
            this._disposed = true;
            this._onDidDispose.fire();
        }
    }
    ExtHostSourceControlResourceGroup._handlePool = 0;
    class ExtHostSourceControl {
        constructor(_extension, proxy, _commands, _id, _label, _rootUri) {
            this._extension = _extension;
            this._commands = _commands;
            this._id = _id;
            this._label = _label;
            this._rootUri = _rootUri;
            _ExtHostSourceControl_proxy.set(this, void 0);
            this._groups = new Map();
            this._count = undefined;
            this._quickDiffProvider = undefined;
            this._commitTemplate = undefined;
            this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
            this._acceptInputCommand = undefined;
            this._actionButtonDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarCommands = undefined;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.handle = ExtHostSourceControl._handlePool++;
            this.createdResourceGroups = new Map();
            this.updatedResourceGroups = new Set();
            __classPrivateFieldSet(this, _ExtHostSourceControl_proxy, proxy, "f");
            this._inputBox = new ExtHostSCMInputBox(_extension, __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f"), this.handle);
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$registerSourceControl(this.handle, _id, _label, _rootUri);
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get rootUri() {
            return this._rootUri;
        }
        get inputBox() { return this._inputBox; }
        get count() {
            return this._count;
        }
        set count(count) {
            if (this._count === count) {
                return;
            }
            this._count = count;
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { count });
        }
        get quickDiffProvider() {
            return this._quickDiffProvider;
        }
        set quickDiffProvider(quickDiffProvider) {
            this._quickDiffProvider = quickDiffProvider;
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { hasQuickDiffProvider: !!quickDiffProvider });
        }
        get commitTemplate() {
            return this._commitTemplate;
        }
        set commitTemplate(commitTemplate) {
            if (commitTemplate === this._commitTemplate) {
                return;
            }
            this._commitTemplate = commitTemplate;
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { commitTemplate });
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        set acceptInputCommand(acceptInputCommand) {
            this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            this._acceptInputCommand = acceptInputCommand;
            const internal = this._commands.converter.toInternal(acceptInputCommand, this._acceptInputDisposables.value);
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { acceptInputCommand: internal });
        }
        get actionButton() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            return this._actionButton;
        }
        set actionButton(actionButton) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            this._actionButtonDisposables.value = new lifecycle_1.DisposableStore();
            this._actionButton = actionButton;
            const internal = actionButton !== undefined ?
                {
                    command: this._commands.converter.toInternal(actionButton.command, this._actionButtonDisposables.value),
                    description: actionButton.description
                } : undefined;
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { actionButton: internal !== null && internal !== void 0 ? internal : null });
        }
        get statusBarCommands() {
            return this._statusBarCommands;
        }
        set statusBarCommands(statusBarCommands) {
            if (this._statusBarCommands && statusBarCommands && commandListEquals(this._statusBarCommands, statusBarCommands)) {
                return;
            }
            this._statusBarDisposables.value = new lifecycle_1.DisposableStore();
            this._statusBarCommands = statusBarCommands;
            const internal = (statusBarCommands || []).map(c => this._commands.converter.toInternal(c, this._statusBarDisposables.value));
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$updateSourceControl(this.handle, { statusBarCommands: internal });
        }
        get selected() {
            return this._selected;
        }
        createResourceGroup(id, label) {
            const group = new ExtHostSourceControlResourceGroup(__classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f"), this._commands, this.handle, id, label);
            const disposable = event_1.Event.once(group.onDidDispose)(() => this.createdResourceGroups.delete(group));
            this.createdResourceGroups.set(group, disposable);
            this.eventuallyAddResourceGroups();
            return group;
        }
        eventuallyAddResourceGroups() {
            const groups = [];
            const splices = [];
            for (const [group, disposable] of this.createdResourceGroups) {
                disposable.dispose();
                const updateListener = group.onDidUpdateResourceStates(() => {
                    this.updatedResourceGroups.add(group);
                    this.eventuallyUpdateResourceStates();
                });
                event_1.Event.once(group.onDidDispose)(() => {
                    this.updatedResourceGroups.delete(group);
                    updateListener.dispose();
                    this._groups.delete(group.handle);
                    __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$unregisterGroup(this.handle, group.handle);
                });
                groups.push([group.handle, group.id, group.label, group.features]);
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length > 0) {
                    splices.push([group.handle, snapshot]);
                }
                this._groups.set(group.handle, group);
            }
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$registerGroups(this.handle, groups, splices);
            this.createdResourceGroups.clear();
        }
        eventuallyUpdateResourceStates() {
            const splices = [];
            this.updatedResourceGroups.forEach(group => {
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length === 0) {
                    return;
                }
                splices.push([group.handle, snapshot]);
            });
            if (splices.length > 0) {
                __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$spliceResourceStates(this.handle, splices);
            }
            this.updatedResourceGroups.clear();
        }
        getResourceGroup(handle) {
            return this._groups.get(handle);
        }
        setSelectionState(selected) {
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this._acceptInputDisposables.dispose();
            this._actionButtonDisposables.dispose();
            this._statusBarDisposables.dispose();
            this._groups.forEach(group => group.dispose());
            __classPrivateFieldGet(this, _ExtHostSourceControl_proxy, "f").$unregisterSourceControl(this.handle);
        }
    }
    _ExtHostSourceControl_proxy = new WeakMap();
    ExtHostSourceControl._handlePool = 0;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyAddResourceGroups", null);
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyUpdateResourceStates", null);
    let ExtHostSCM = class ExtHostSCM {
        constructor(mainContext, _commands, logService) {
            this._commands = _commands;
            this.logService = logService;
            this._sourceControls = new Map();
            this._sourceControlsByExtension = new Map();
            this._onDidChangeActiveProvider = new event_1.Emitter();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSCM);
            this._telemetry = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            _commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 3 /* MarshalledId.ScmResource */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        const group = sourceControl.getResourceGroup(arg.groupHandle);
                        if (!group) {
                            return arg;
                        }
                        return group.getResourceState(arg.handle);
                    }
                    else if (arg && arg.$mid === 4 /* MarshalledId.ScmResourceGroup */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl.getResourceGroup(arg.groupHandle);
                    }
                    else if (arg && arg.$mid === 5 /* MarshalledId.ScmProvider */) {
                        const sourceControl = this._sourceControls.get(arg.handle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl;
                    }
                    return arg;
                }
            });
        }
        get onDidChangeActiveProvider() { return this._onDidChangeActiveProvider.event; }
        createSourceControl(extension, id, label, rootUri) {
            this.logService.trace('ExtHostSCM#createSourceControl', extension.identifier.value, id, label, rootUri);
            this._telemetry.$publicLog2('api/scm/createSourceControl', {
                extensionId: extension.identifier.value,
            });
            const handle = ExtHostSCM._handlePool++;
            const sourceControl = new ExtHostSourceControl(extension, this._proxy, this._commands, id, label, rootUri);
            this._sourceControls.set(handle, sourceControl);
            const sourceControls = this._sourceControlsByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier)) || [];
            sourceControls.push(sourceControl);
            this._sourceControlsByExtension.set(extensions_1.ExtensionIdentifier.toKey(extension.identifier), sourceControls);
            return sourceControl;
        }
        // Deprecated
        getLastInputBox(extension) {
            this.logService.trace('ExtHostSCM#getLastInputBox', extension.identifier.value);
            const sourceControls = this._sourceControlsByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier));
            const sourceControl = sourceControls && sourceControls[sourceControls.length - 1];
            return sourceControl && sourceControl.inputBox;
        }
        $provideOriginalResource(sourceControlHandle, uriComponents, token) {
            const uri = uri_1.URI.revive(uriComponents);
            this.logService.trace('ExtHostSCM#$provideOriginalResource', sourceControlHandle, uri.toString());
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl || !sourceControl.quickDiffProvider || !sourceControl.quickDiffProvider.provideOriginalResource) {
                return Promise.resolve(null);
            }
            return (0, async_1.asPromise)(() => sourceControl.quickDiffProvider.provideOriginalResource(uri, token))
                .then(r => r || null);
        }
        $onInputBoxValueChange(sourceControlHandle, value) {
            this.logService.trace('ExtHostSCM#$onInputBoxValueChange', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            sourceControl.inputBox.$onInputBoxValueChange(value);
            return Promise.resolve(undefined);
        }
        $executeResourceCommand(sourceControlHandle, groupHandle, handle, preserveFocus) {
            this.logService.trace('ExtHostSCM#$executeResourceCommand', sourceControlHandle, groupHandle, handle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            const group = sourceControl.getResourceGroup(groupHandle);
            if (!group) {
                return Promise.resolve(undefined);
            }
            return group.$executeResourceCommand(handle, preserveFocus);
        }
        $validateInput(sourceControlHandle, value, cursorPosition) {
            this.logService.trace('ExtHostSCM#$validateInput', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            if (!sourceControl.inputBox.validateInput) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => sourceControl.inputBox.validateInput(value, cursorPosition)).then(result => {
                if (!result) {
                    return Promise.resolve(undefined);
                }
                const message = extHostTypeConverters_1.MarkdownString.fromStrict(result.message);
                if (!message) {
                    return Promise.resolve(undefined);
                }
                return Promise.resolve([message, result.type]);
            });
        }
        $setSelectedSourceControl(selectedSourceControlHandle) {
            var _a, _b;
            this.logService.trace('ExtHostSCM#$setSelectedSourceControl', selectedSourceControlHandle);
            if (selectedSourceControlHandle !== undefined) {
                (_a = this._sourceControls.get(selectedSourceControlHandle)) === null || _a === void 0 ? void 0 : _a.setSelectionState(true);
            }
            if (this._selectedSourceControlHandle !== undefined) {
                (_b = this._sourceControls.get(this._selectedSourceControlHandle)) === null || _b === void 0 ? void 0 : _b.setSelectionState(false);
            }
            this._selectedSourceControlHandle = selectedSourceControlHandle;
            return Promise.resolve(undefined);
        }
    };
    ExtHostSCM._handlePool = 0;
    ExtHostSCM = __decorate([
        __param(2, log_1.ILogService)
    ], ExtHostSCM);
    exports.ExtHostSCM = ExtHostSCM;
});
//# sourceMappingURL=extHostSCM.js.map