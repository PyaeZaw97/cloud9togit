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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, lifecycle_1, types_1, nls_1, actions_1, commands_1, contextkey_1, keybinding_1, quickInput_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const builtInSource = (0, nls_1.localize)('Built-In', "Built-In");
    const category = (0, nls_1.localize)('Create', "Create");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.showNewFileEntries',
                title: { value: (0, nls_1.localize)('welcome.newFile', "New File..."), original: 'New File...' },
                category,
                f1: true,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ + 2048 /* KeyMod.CtrlCmd */ + 256 /* KeyMod.WinCtrl */ + 44 /* KeyCode.KeyN */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '1_new',
                    order: 2
                }
            });
        }
        async run(accessor) {
            return (0, types_1.assertIsDefined)(NewFileTemplatesManager.Instance).run();
        }
    });
    let NewFileTemplatesManager = class NewFileTemplatesManager extends lifecycle_1.Disposable {
        constructor(quickInputService, contextKeyService, commandService, keybindingService, menuService) {
            super();
            this.quickInputService = quickInputService;
            this.contextKeyService = contextKeyService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            NewFileTemplatesManager.Instance = this;
            this._register({ dispose() { if (NewFileTemplatesManager.Instance === this) {
                    NewFileTemplatesManager.Instance = undefined;
                } } });
            this.menu = menuService.createMenu(actions_1.MenuId.NewFile, contextKeyService);
        }
        allEntries() {
            var _a;
            const items = [];
            for (const [groupName, group] of this.menu.getActions({ renderShortTitle: true })) {
                for (const action of group) {
                    if (action instanceof actions_1.MenuItemAction) {
                        items.push({ commandID: action.item.id, from: (_a = action.item.source) !== null && _a !== void 0 ? _a : builtInSource, title: action.label, group: groupName });
                    }
                }
            }
            return items;
        }
        async run() {
            const entries = this.allEntries();
            if (entries.length === 0) {
                throw Error('Unexpected empty new items list');
            }
            else if (entries.length === 1) {
                this.commandService.executeCommand(entries[0].commandID);
                return true;
            }
            else {
                return this.selectNewEntry(entries);
            }
        }
        async selectNewEntry(entries) {
            let resolveResult;
            const resultPromise = new Promise(resolve => {
                resolveResult = resolve;
            });
            const disposables = new lifecycle_1.DisposableStore();
            const qp = this.quickInputService.createQuickPick();
            qp.title = (0, nls_1.localize)('createNew', "Create New...");
            qp.matchOnDetail = true;
            qp.matchOnDescription = true;
            const sortCategories = (a, b) => {
                const categoryPriority = { 'file': 1, 'notebook': 2 };
                if (categoryPriority[a.group] && categoryPriority[b.group]) {
                    if (categoryPriority[a.group] !== categoryPriority[b.group]) {
                        return categoryPriority[b.group] - categoryPriority[a.group];
                    }
                }
                else if (categoryPriority[a.group]) {
                    return 1;
                }
                else if (categoryPriority[b.group]) {
                    return -1;
                }
                if (a.from === builtInSource) {
                    return 1;
                }
                if (b.from === builtInSource) {
                    return -1;
                }
                return a.from.localeCompare(b.from);
            };
            const displayCategory = {
                'file': (0, nls_1.localize)('file', "File"),
                'notebook': (0, nls_1.localize)('notebook', "Notebook"),
            };
            const refreshQp = (entries) => {
                const items = [];
                let lastSeparator;
                entries
                    .sort((a, b) => -sortCategories(a, b))
                    .forEach((entry) => {
                    var _a;
                    const command = entry.commandID;
                    const keybinding = this.keybindingService.lookupKeybinding(command || '', this.contextKeyService);
                    if (lastSeparator !== entry.group) {
                        items.push({
                            type: 'separator',
                            label: (_a = displayCategory[entry.group]) !== null && _a !== void 0 ? _a : entry.group
                        });
                        lastSeparator = entry.group;
                    }
                    items.push(Object.assign(Object.assign({}, entry), { label: entry.title, type: 'item', keybinding, buttons: command ? [
                            {
                                iconClass: 'codicon codicon-gear',
                                tooltip: (0, nls_1.localize)('change keybinding', "Configure Keybinding")
                            }
                        ] : [], detail: '', description: entry.from }));
                });
                qp.items = items;
            };
            refreshQp(entries);
            disposables.add(this.menu.onDidChange(() => refreshQp(this.allEntries())));
            disposables.add(qp.onDidAccept(async (e) => {
                const selected = qp.selectedItems[0];
                resolveResult(!!selected);
                qp.hide();
                if (selected) {
                    await this.commandService.executeCommand(selected.commandID);
                }
            }));
            disposables.add(qp.onDidHide(() => {
                qp.dispose();
                disposables.dispose();
                resolveResult(false);
            }));
            disposables.add(qp.onDidTriggerItemButton(e => {
                qp.hide();
                this.commandService.executeCommand('workbench.action.openGlobalKeybindings', e.item.commandID);
                resolveResult(false);
            }));
            qp.show();
            return resultPromise;
        }
    };
    NewFileTemplatesManager = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, commands_1.ICommandService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService)
    ], NewFileTemplatesManager);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(NewFileTemplatesManager, 3 /* LifecyclePhase.Restored */);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NewFile, {
        group: 'file',
        command: {
            id: 'workbench.action.files.newUntitledFile',
            title: (0, nls_1.localize)('miNewFile2', "Text File")
        },
        order: 1
    });
});
//# sourceMappingURL=newFile.contribution.js.map