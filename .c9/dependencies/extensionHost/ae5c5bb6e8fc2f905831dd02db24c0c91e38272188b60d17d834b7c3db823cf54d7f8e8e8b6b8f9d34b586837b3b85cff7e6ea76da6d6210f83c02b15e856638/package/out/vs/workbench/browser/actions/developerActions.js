/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/browser/event", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/platform/layout/browser/layoutService", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/storage/common/storage", "vs/base/common/numbers", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/common/actions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/css!./media/actions"], function (require, exports, nls_1, keybinding_1, event_1, color_1, event_2, lifecycle_1, dom_1, configuration_1, contextkey_1, keyboardEvent_1, async_1, layoutService_1, platform_1, actions_1, storage_1, numbers_1, configurationRegistry_1, log_1, workingCopyService_1, actions_2, workingCopyBackup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectContextKeysAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectContextKeys',
                title: { value: (0, nls_1.localize)('inspect context keys', "Inspect Context Keys"), original: 'Inspect Context Keys' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const disposables = new lifecycle_1.DisposableStore();
            const stylesheet = (0, dom_1.createStyleSheet)();
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                if (stylesheet.parentNode) {
                    stylesheet.parentNode.removeChild(stylesheet);
                }
            }));
            (0, dom_1.createCSSRule)('*', 'cursor: crosshair !important;', stylesheet);
            const hoverFeedback = document.createElement('div');
            document.body.appendChild(hoverFeedback);
            disposables.add((0, lifecycle_1.toDisposable)(() => document.body.removeChild(hoverFeedback)));
            hoverFeedback.style.position = 'absolute';
            hoverFeedback.style.pointerEvents = 'none';
            hoverFeedback.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            hoverFeedback.style.zIndex = '1000';
            const onMouseMove = disposables.add(new event_1.DomEmitter(document.body, 'mousemove', true));
            disposables.add(onMouseMove.event(e => {
                const target = e.target;
                const position = (0, dom_1.getDomNodePagePosition)(target);
                hoverFeedback.style.top = `${position.top}px`;
                hoverFeedback.style.left = `${position.left}px`;
                hoverFeedback.style.width = `${position.width}px`;
                hoverFeedback.style.height = `${position.height}px`;
            }));
            const onMouseDown = disposables.add(new event_1.DomEmitter(document.body, 'mousedown', true));
            event_2.Event.once(onMouseDown.event)(e => { e.preventDefault(); e.stopPropagation(); }, null, disposables);
            const onMouseUp = disposables.add(new event_1.DomEmitter(document.body, 'mouseup', true));
            event_2.Event.once(onMouseUp.event)(e => {
                e.preventDefault();
                e.stopPropagation();
                const context = contextKeyService.getContext(e.target);
                console.log(context.collectAllValues());
                (0, lifecycle_1.dispose)(disposables);
            }, null, disposables);
        }
    }
    class ToggleScreencastModeAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleScreencastMode',
                title: { value: (0, nls_1.localize)('toggle screencast mode', "Toggle Screencast Mode"), original: 'Toggle Screencast Mode' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            if (ToggleScreencastModeAction.disposable) {
                ToggleScreencastModeAction.disposable.dispose();
                ToggleScreencastModeAction.disposable = undefined;
                return;
            }
            const layoutService = accessor.get(layoutService_1.ILayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const disposables = new lifecycle_1.DisposableStore();
            const container = layoutService.container;
            const mouseMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-mouse'));
            disposables.add((0, lifecycle_1.toDisposable)(() => mouseMarker.remove()));
            const onMouseDown = disposables.add(new event_1.DomEmitter(container, 'mousedown', true));
            const onMouseUp = disposables.add(new event_1.DomEmitter(container, 'mouseup', true));
            const onMouseMove = disposables.add(new event_1.DomEmitter(container, 'mousemove', true));
            const updateMouseIndicatorColor = () => {
                mouseMarker.style.borderColor = color_1.Color.fromHex(configurationService.getValue('screencastMode.mouseIndicatorColor')).toString();
            };
            let mouseIndicatorSize;
            const updateMouseIndicatorSize = () => {
                mouseIndicatorSize = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.mouseIndicatorSize') || 20, 20, 100);
                mouseMarker.style.height = `${mouseIndicatorSize}px`;
                mouseMarker.style.width = `${mouseIndicatorSize}px`;
            };
            updateMouseIndicatorColor();
            updateMouseIndicatorSize();
            disposables.add(onMouseDown.event(e => {
                mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                mouseMarker.style.display = 'block';
                const mouseMoveListener = onMouseMove.event(e => {
                    mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                    mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                });
                event_2.Event.once(onMouseUp.event)(() => {
                    mouseMarker.style.display = 'none';
                    mouseMoveListener.dispose();
                });
            }));
            const keyboardMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-keyboard'));
            disposables.add((0, lifecycle_1.toDisposable)(() => keyboardMarker.remove()));
            const updateKeyboardFontSize = () => {
                keyboardMarker.style.fontSize = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.fontSize') || 56, 20, 100)}px`;
            };
            const updateKeyboardMarker = () => {
                keyboardMarker.style.bottom = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.verticalOffset') || 0, 0, 90)}%`;
            };
            let keyboardMarkerTimeout;
            const updateKeyboardMarkerTimeout = () => {
                keyboardMarkerTimeout = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.keyboardOverlayTimeout') || 800, 500, 5000);
            };
            updateKeyboardFontSize();
            updateKeyboardMarker();
            updateKeyboardMarkerTimeout();
            disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('screencastMode.verticalOffset')) {
                    updateKeyboardMarker();
                }
                if (e.affectsConfiguration('screencastMode.fontSize')) {
                    updateKeyboardFontSize();
                }
                if (e.affectsConfiguration('screencastMode.keyboardOverlayTimeout')) {
                    updateKeyboardMarkerTimeout();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorColor')) {
                    updateMouseIndicatorColor();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorSize')) {
                    updateMouseIndicatorSize();
                }
            }));
            const onKeyDown = disposables.add(new event_1.DomEmitter(window, 'keydown', true));
            let keyboardTimeout = lifecycle_1.Disposable.None;
            let length = 0;
            disposables.add(onKeyDown.event(e => {
                keyboardTimeout.dispose();
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shortcut = keybindingService.softDispatch(event, event.target);
                if ((shortcut === null || shortcut === void 0 ? void 0 : shortcut.commandId) || !configurationService.getValue('screencastMode.onlyKeyboardShortcuts')) {
                    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
                        || length > 20
                        || event.keyCode === 1 /* KeyCode.Backspace */ || event.keyCode === 9 /* KeyCode.Escape */) {
                        keyboardMarker.innerText = '';
                        length = 0;
                    }
                    const format = configurationService.getValue('screencastMode.keyboardShortcutsFormat');
                    const keybinding = keybindingService.resolveKeyboardEvent(event);
                    const command = (shortcut === null || shortcut === void 0 ? void 0 : shortcut.commandId) ? actions_1.MenuRegistry.getCommand(shortcut.commandId) : null;
                    let titleLabel = '';
                    let keyLabel = keybinding.getLabel();
                    if (command) {
                        titleLabel = typeof command.title === 'string' ? command.title : command.title.value;
                        if ((format === 'commandWithGroup' || format === 'commandWithGroupAndKeys') && command.category) {
                            titleLabel = `${typeof command.category === 'string' ? command.category : command.category.value}: ${titleLabel} `;
                        }
                        if (shortcut === null || shortcut === void 0 ? void 0 : shortcut.commandId) {
                            const fullKeyLabel = keybindingService.lookupKeybinding(shortcut.commandId);
                            if (fullKeyLabel) {
                                keyLabel = fullKeyLabel.getLabel();
                            }
                        }
                    }
                    if (format !== 'keys' && titleLabel) {
                        (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.title', {}, `${titleLabel} `));
                    }
                    if (!configurationService.getValue('screencastMode.onlyKeyboardShortcuts') || !titleLabel || (shortcut === null || shortcut === void 0 ? void 0 : shortcut.commandId) && (format === 'keys' || format === 'commandAndKeys' || format === 'commandWithGroupAndKeys')) {
                        (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key', {}, keyLabel || ''));
                    }
                    length++;
                }
                const promise = (0, async_1.timeout)(keyboardMarkerTimeout);
                keyboardTimeout = (0, lifecycle_1.toDisposable)(() => promise.cancel());
                promise.then(() => {
                    keyboardMarker.textContent = '';
                    length = 0;
                });
            }));
            ToggleScreencastModeAction.disposable = disposables;
        }
    }
    class LogStorageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logStorage',
                title: { value: (0, nls_1.localize)({ key: 'logStorage', comment: ['A developer only action to log the contents of the storage for the current window.'] }, "Log Storage Database Contents"), original: 'Log Storage Database Contents' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).logStorage();
        }
    }
    class LogWorkingCopiesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logWorkingCopies',
                title: { value: (0, nls_1.localize)({ key: 'logWorkingCopies', comment: ['A developer only action to log the working copies that exist.'] }, "Log Working Copies"), original: 'Log Working Copies' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            const logService = accessor.get(log_1.ILogService);
            const backups = await workingCopyBackupService.getBackups();
            const msg = [
                ``,
                `[Working Copies]`,
                ...(workingCopyService.workingCopies.length > 0) ?
                    workingCopyService.workingCopies.map(workingCopy => `${workingCopy.isDirty() ? '● ' : ''}${workingCopy.resource.toString(true)} (typeId: ${workingCopy.typeId || '<no typeId>'})`) :
                    ['<none>'],
                ``,
                `[Backups]`,
                ...(backups.length > 0) ?
                    backups.map(backup => `${backup.resource.toString(true)} (typeId: ${backup.typeId || '<no typeId>'})`) :
                    ['<none>'],
            ];
            logService.info(msg.join('\n'));
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(InspectContextKeysAction);
    (0, actions_1.registerAction2)(ToggleScreencastModeAction);
    (0, actions_1.registerAction2)(LogStorageAction);
    (0, actions_1.registerAction2)(LogWorkingCopiesAction);
    // --- Configuration
    // Screen Cast Mode
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'screencastMode',
        order: 9,
        title: (0, nls_1.localize)('screencastModeConfigurationTitle', "Screencast Mode"),
        type: 'object',
        properties: {
            'screencastMode.verticalOffset': {
                type: 'number',
                default: 20,
                minimum: 0,
                maximum: 90,
                description: (0, nls_1.localize)('screencastMode.location.verticalPosition', "Controls the vertical offset of the screencast mode overlay from the bottom as a percentage of the workbench height.")
            },
            'screencastMode.fontSize': {
                type: 'number',
                default: 56,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.fontSize', "Controls the font size (in pixels) of the screencast mode keyboard.")
            },
            'screencastMode.keyboardShortcutsFormat': {
                enum: ['keys', 'command', 'commandWithGroup', 'commandAndKeys', 'commandWithGroupAndKeys'],
                enumDescriptions: [
                    (0, nls_1.localize)('keyboardShortcutsFormat.keys', "Keys."),
                    (0, nls_1.localize)('keyboardShortcutsFormat.command', "Command title."),
                    (0, nls_1.localize)('keyboardShortcutsFormat.commandWithGroup', "Command title prefixed by its group."),
                    (0, nls_1.localize)('keyboardShortcutsFormat.commandAndKeys', "Command title and keys."),
                    (0, nls_1.localize)('keyboardShortcutsFormat.commandWithGroupAndKeys', "Command title and keys, with the command prefixed by its group.")
                ],
                description: (0, nls_1.localize)('screencastMode.keyboardShortcutsFormat', "Controls what is displayed in the keyboard overlay when showing shortcuts."),
                default: 'commandAndKeys'
            },
            'screencastMode.onlyKeyboardShortcuts': {
                type: 'boolean',
                description: (0, nls_1.localize)('screencastMode.onlyKeyboardShortcuts', "Only show keyboard shortcuts in screencast mode."),
                default: false
            },
            'screencastMode.keyboardOverlayTimeout': {
                type: 'number',
                default: 800,
                minimum: 500,
                maximum: 5000,
                description: (0, nls_1.localize)('screencastMode.keyboardOverlayTimeout', "Controls how long (in milliseconds) the keyboard overlay is shown in screencast mode.")
            },
            'screencastMode.mouseIndicatorColor': {
                type: 'string',
                format: 'color-hex',
                default: '#FF0000',
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorColor', "Controls the color in hex (#RGB, #RGBA, #RRGGBB or #RRGGBBAA) of the mouse indicator in screencast mode.")
            },
            'screencastMode.mouseIndicatorSize': {
                type: 'number',
                default: 20,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorSize', "Controls the size (in pixels) of the mouse indicator in screencast mode.")
            },
        }
    });
});
//# sourceMappingURL=developerActions.js.map