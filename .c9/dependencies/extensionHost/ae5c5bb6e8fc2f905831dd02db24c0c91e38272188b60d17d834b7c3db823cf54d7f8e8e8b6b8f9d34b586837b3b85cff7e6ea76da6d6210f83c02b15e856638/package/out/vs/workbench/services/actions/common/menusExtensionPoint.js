/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/collections", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/base/common/iterator", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, strings_1, resources, collections_1, extensionsRegistry_1, contextkey_1, actions_1, uri_1, lifecycle_1, themeService_1, iterator_1, arrays_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerMenusExtensionPoint = exports.registerSubmenusExtensionPoint = exports.registerCommandsExtensionPoint = exports.commandsExtensionPoint = void 0;
    const apiMenus = [
        {
            key: 'commandPalette',
            id: actions_1.MenuId.CommandPalette,
            description: (0, nls_1.localize)('menus.commandPalette', "The Command Palette"),
            supportsSubmenus: false
        },
        {
            key: 'touchBar',
            id: actions_1.MenuId.TouchBarContext,
            description: (0, nls_1.localize)('menus.touchBar', "The touch bar (macOS only)"),
            supportsSubmenus: false
        },
        {
            key: 'editor/title',
            id: actions_1.MenuId.EditorTitle,
            description: (0, nls_1.localize)('menus.editorTitle', "The editor title menu")
        },
        {
            key: 'editor/title/run',
            id: actions_1.MenuId.EditorTitleRun,
            description: (0, nls_1.localize)('menus.editorTitleRun', "Run submenu inside the editor title menu")
        },
        {
            key: 'editor/context',
            id: actions_1.MenuId.EditorContext,
            description: (0, nls_1.localize)('menus.editorContext', "The editor context menu")
        },
        {
            key: 'editor/context/copy',
            id: actions_1.MenuId.EditorContextCopy,
            description: (0, nls_1.localize)('menus.editorContextCopyAs', "'Copy as' submenu in the editor context menu")
        },
        {
            key: 'explorer/context',
            id: actions_1.MenuId.ExplorerContext,
            description: (0, nls_1.localize)('menus.explorerContext', "The file explorer context menu")
        },
        {
            key: 'editor/title/context',
            id: actions_1.MenuId.EditorTitleContext,
            description: (0, nls_1.localize)('menus.editorTabContext', "The editor tabs context menu")
        },
        {
            key: 'debug/callstack/context',
            id: actions_1.MenuId.DebugCallStackContext,
            description: (0, nls_1.localize)('menus.debugCallstackContext', "The debug callstack view context menu")
        },
        {
            key: 'debug/variables/context',
            id: actions_1.MenuId.DebugVariablesContext,
            description: (0, nls_1.localize)('menus.debugVariablesContext', "The debug variables view context menu")
        },
        {
            key: 'debug/toolBar',
            id: actions_1.MenuId.DebugToolBar,
            description: (0, nls_1.localize)('menus.debugToolBar', "The debug toolbar menu")
        },
        {
            key: 'menuBar/home',
            id: actions_1.MenuId.MenubarHomeMenu,
            description: (0, nls_1.localize)('menus.home', "The home indicator context menu (web only)"),
            proposed: 'contribMenuBarHome',
            supportsSubmenus: false
        },
        {
            key: 'menuBar/edit/copy',
            id: actions_1.MenuId.MenubarCopy,
            description: (0, nls_1.localize)('menus.opy', "'Copy as' submenu in the top level Edit menu")
        },
        {
            key: 'scm/title',
            id: actions_1.MenuId.SCMTitle,
            description: (0, nls_1.localize)('menus.scmTitle', "The Source Control title menu")
        },
        {
            key: 'scm/sourceControl',
            id: actions_1.MenuId.SCMSourceControl,
            description: (0, nls_1.localize)('menus.scmSourceControl', "The Source Control menu")
        },
        {
            key: 'scm/resourceState/context',
            id: actions_1.MenuId.SCMResourceContext,
            description: (0, nls_1.localize)('menus.resourceStateContext', "The Source Control resource state context menu")
        },
        {
            key: 'scm/resourceFolder/context',
            id: actions_1.MenuId.SCMResourceFolderContext,
            description: (0, nls_1.localize)('menus.resourceFolderContext', "The Source Control resource folder context menu")
        },
        {
            key: 'scm/resourceGroup/context',
            id: actions_1.MenuId.SCMResourceGroupContext,
            description: (0, nls_1.localize)('menus.resourceGroupContext', "The Source Control resource group context menu")
        },
        {
            key: 'scm/change/title',
            id: actions_1.MenuId.SCMChangeContext,
            description: (0, nls_1.localize)('menus.changeTitle', "The Source Control inline change menu")
        },
        {
            key: 'statusBar/remoteIndicator',
            id: actions_1.MenuId.StatusBarRemoteIndicatorMenu,
            description: (0, nls_1.localize)('menus.statusBarRemoteIndicator', "The remote indicator menu in the status bar"),
            supportsSubmenus: false
        },
        {
            key: 'view/title',
            id: actions_1.MenuId.ViewTitle,
            description: (0, nls_1.localize)('view.viewTitle', "The contributed view title menu")
        },
        {
            key: 'view/item/context',
            id: actions_1.MenuId.ViewItemContext,
            description: (0, nls_1.localize)('view.itemContext', "The contributed view item context menu")
        },
        {
            key: 'comments/commentThread/title',
            id: actions_1.MenuId.CommentThreadTitle,
            description: (0, nls_1.localize)('commentThread.title', "The contributed comment thread title menu")
        },
        {
            key: 'comments/commentThread/context',
            id: actions_1.MenuId.CommentThreadActions,
            description: (0, nls_1.localize)('commentThread.actions', "The contributed comment thread context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'comments/comment/title',
            id: actions_1.MenuId.CommentTitle,
            description: (0, nls_1.localize)('comment.title', "The contributed comment title menu")
        },
        {
            key: 'comments/comment/context',
            id: actions_1.MenuId.CommentActions,
            description: (0, nls_1.localize)('comment.actions', "The contributed comment context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'notebook/toolbar',
            id: actions_1.MenuId.NotebookToolbar,
            description: (0, nls_1.localize)('notebook.toolbar', "The contributed notebook toolbar menu")
        },
        {
            key: 'notebook/cell/title',
            id: actions_1.MenuId.NotebookCellTitle,
            description: (0, nls_1.localize)('notebook.cell.title', "The contributed notebook cell title menu")
        },
        {
            key: 'notebook/cell/execute',
            id: actions_1.MenuId.NotebookCellExecute,
            description: (0, nls_1.localize)('notebook.cell.execute', "The contributed notebook cell execution menu")
        },
        {
            key: 'notebook/cell/executePrimary',
            id: actions_1.MenuId.NotebookCellExecutePrimary,
            description: (0, nls_1.localize)('notebook.cell.executePrimary', "The contributed primary notebook cell execution button"),
            proposed: 'notebookEditor'
        },
        {
            key: 'interactive/toolbar',
            id: actions_1.MenuId.InteractiveToolbar,
            description: (0, nls_1.localize)('interactive.toolbar', "The contributed interactive toolbar menu"),
            proposed: 'notebookEditor'
        },
        {
            key: 'interactive/cell/title',
            id: actions_1.MenuId.InteractiveCellTitle,
            description: (0, nls_1.localize)('interactive.cell.title', "The contributed interactive cell title menu"),
            proposed: 'notebookEditor'
        },
        {
            key: 'testing/item/context',
            id: actions_1.MenuId.TestItem,
            description: (0, nls_1.localize)('testing.item.context', "The contributed test item menu"),
        },
        {
            key: 'testing/item/gutter',
            id: actions_1.MenuId.TestItemGutter,
            description: (0, nls_1.localize)('testing.item.gutter.title', "The menu for a gutter decoration for a test item"),
        },
        {
            key: 'extension/context',
            id: actions_1.MenuId.ExtensionContext,
            description: (0, nls_1.localize)('menus.extensionContext', "The extension context menu")
        },
        {
            key: 'timeline/title',
            id: actions_1.MenuId.TimelineTitle,
            description: (0, nls_1.localize)('view.timelineTitle', "The Timeline view title menu")
        },
        {
            key: 'timeline/item/context',
            id: actions_1.MenuId.TimelineItemContext,
            description: (0, nls_1.localize)('view.timelineContext', "The Timeline view item context menu")
        },
        {
            key: 'ports/item/context',
            id: actions_1.MenuId.TunnelContext,
            description: (0, nls_1.localize)('view.tunnelContext', "The Ports view item context menu")
        },
        {
            key: 'ports/item/origin/inline',
            id: actions_1.MenuId.TunnelOriginInline,
            description: (0, nls_1.localize)('view.tunnelOriginInline', "The Ports view item origin inline menu")
        },
        {
            key: 'ports/item/port/inline',
            id: actions_1.MenuId.TunnelPortInline,
            description: (0, nls_1.localize)('view.tunnelPortInline', "The Ports view item port inline menu")
        },
        {
            key: 'file/newFile',
            id: actions_1.MenuId.NewFile,
            description: (0, nls_1.localize)('file.newFile', "The 'New File...' quick pick, shown on welcome page and File menu."),
            supportsSubmenus: false,
        },
        {
            key: 'editor/inlineCompletions/actions',
            id: actions_1.MenuId.InlineCompletionsActions,
            description: (0, nls_1.localize)('inlineCompletions.actions', "The actions shown when hovering on an inline completion"),
            supportsSubmenus: false,
            proposed: 'inlineCompletions'
        },
    ];
    var schema;
    (function (schema) {
        // --- menus, submenus contribution point
        function isMenuItem(item) {
            return typeof item.command === 'string';
        }
        schema.isMenuItem = isMenuItem;
        function isValidMenuItem(item, collector) {
            if (typeof item.command !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (item.alt && typeof item.alt !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'alt'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidMenuItem = isValidMenuItem;
        function isValidSubmenuItem(item, collector) {
            if (typeof item.submenu !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'submenu'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenuItem = isValidSubmenuItem;
        function isValidItems(items, collector) {
            if (!Array.isArray(items)) {
                collector.error((0, nls_1.localize)('requirearray', "submenu items must be an array"));
                return false;
            }
            for (let item of items) {
                if (isMenuItem(item)) {
                    if (!isValidMenuItem(item, collector)) {
                        return false;
                    }
                }
                else {
                    if (!isValidSubmenuItem(item, collector)) {
                        return false;
                    }
                }
            }
            return true;
        }
        schema.isValidItems = isValidItems;
        function isValidSubmenu(submenu, collector) {
            if (typeof submenu !== 'object') {
                collector.error((0, nls_1.localize)('require', "submenu items must be an object"));
                return false;
            }
            if (typeof submenu.id !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                return false;
            }
            if (typeof submenu.label !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'label'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenu = isValidSubmenu;
        const menuItem = {
            type: 'object',
            required: ['command'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                alt: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.alt', 'Identifier of an alternative command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenuItem = {
            type: 'object',
            required: ['submenu'],
            properties: {
                submenu: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.submenu', 'Identifier of the submenu to display in this item.'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenu = {
            type: 'object',
            required: ['id', 'label'],
            properties: {
                id: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.id', 'Identifier of the menu to display as a submenu.'),
                    type: 'string'
                },
                label: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.label', 'The label of the menu item which leads to this submenu.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.submenu.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the submenu in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.menusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.menus', "Contributes menu items to the editor"),
            type: 'object',
            properties: (0, arrays_1.index)(apiMenus, menu => menu.key, menu => ({
                markdownDescription: menu.proposed ? (0, nls_1.localize)('proposed', "Proposed API, requires `enabledApiProposal: [\"{0}\"]` - {1}", menu.proposed, menu.description) : menu.description,
                type: 'array',
                items: menu.supportsSubmenus === false ? menuItem : { oneOf: [menuItem, submenuItem] }
            })),
            additionalProperties: {
                description: 'Submenu',
                type: 'array',
                items: { oneOf: [menuItem, submenuItem] }
            }
        };
        schema.submenusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.submenus', "Contributes submenu items to the editor"),
            type: 'array',
            items: submenu
        };
        function isValidCommand(command, collector) {
            if (!command) {
                collector.error((0, nls_1.localize)('nonempty', "expected non-empty value."));
                return false;
            }
            if ((0, strings_1.isFalsyOrWhitespace)(command.command)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (!isValidLocalizedString(command.title, collector, 'title')) {
                return false;
            }
            if (command.shortTitle && !isValidLocalizedString(command.shortTitle, collector, 'shortTitle')) {
                return false;
            }
            if (command.enablement && typeof command.enablement !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'precondition'));
                return false;
            }
            if (command.category && !isValidLocalizedString(command.category, collector, 'category')) {
                return false;
            }
            if (!isValidIcon(command.icon, collector)) {
                return false;
            }
            return true;
        }
        schema.isValidCommand = isValidCommand;
        function isValidIcon(icon, collector) {
            if (typeof icon === 'undefined') {
                return true;
            }
            if (typeof icon === 'string') {
                return true;
            }
            else if (typeof icon.dark === 'string' && typeof icon.light === 'string') {
                return true;
            }
            collector.error((0, nls_1.localize)('opticon', "property `icon` can be omitted or must be either a string or a literal like `{dark, light}`"));
            return false;
        }
        function isValidLocalizedString(localized, collector, propertyName) {
            if (typeof localized === 'undefined') {
                collector.error((0, nls_1.localize)('requireStringOrObject', "property `{0}` is mandatory and must be of type `string` or `object`", propertyName));
                return false;
            }
            else if (typeof localized === 'string' && (0, strings_1.isFalsyOrWhitespace)(localized)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", propertyName));
                return false;
            }
            else if (typeof localized !== 'string' && ((0, strings_1.isFalsyOrWhitespace)(localized.original) || (0, strings_1.isFalsyOrWhitespace)(localized.value))) {
                collector.error((0, nls_1.localize)('requirestrings', "properties `{0}` and `{1}` are mandatory and must be of type `string`", `${propertyName}.value`, `${propertyName}.original`));
                return false;
            }
            return true;
        }
        const commandType = {
            type: 'object',
            required: ['command', 'title'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.command', 'Identifier of the command to execute'),
                    type: 'string'
                },
                title: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.title', 'Title by which the command is represented in the UI'),
                    type: 'string'
                },
                shortTitle: {
                    markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.commandType.shortTitle', '(Optional) Short title by which the command is represented in the UI. Menus pick either `title` or `shortTitle` depending on the context in which they show commands.'),
                    type: 'string'
                },
                category: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.category', '(Optional) Category string by which the command is grouped in the UI'),
                    type: 'string'
                },
                enablement: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.precondition', '(Optional) Condition which must be true to enable the command in the UI (menu and keybindings). Does not prevent executing the command by other means, like the `executeCommand`-api.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.commandType.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the command in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.commandsContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.commands', "Contributes commands to the command palette."),
            oneOf: [
                commandType,
                {
                    type: 'array',
                    items: commandType
                }
            ]
        };
    })(schema || (schema = {}));
    const _commandRegistrations = new lifecycle_1.DisposableStore();
    exports.commandsExtensionPoint = registerCommandsExtensionPoint(extensionsRegistry_1.ExtensionsRegistry);
    function registerCommandsExtensionPoint(extensionService) {
        const result = extensionService.registerExtensionPoint({
            extensionPoint: 'commands',
            jsonSchema: schema.commandsContribution
        });
        result.setHandler(extensions => {
            function handleCommand(userFriendlyCommand, extension) {
                var _a, _b;
                if (!schema.isValidCommand(userFriendlyCommand, extension.collector)) {
                    return;
                }
                const { icon, enablement, category, title, shortTitle, command } = userFriendlyCommand;
                let absoluteIcon;
                if (icon) {
                    const extensionLocation = uri_1.URI.revive(extension.description.extensionLocation);
                    if (typeof icon === 'string') {
                        absoluteIcon = (_a = themeService_1.ThemeIcon.fromString(icon)) !== null && _a !== void 0 ? _a : { dark: resources.joinPath(extensionLocation, icon), light: resources.joinPath(extensionLocation, icon) };
                    }
                    else {
                        absoluteIcon = {
                            dark: resources.joinPath(extensionLocation, icon.dark),
                            light: resources.joinPath(extensionLocation, icon.light)
                        };
                    }
                }
                if (actions_1.MenuRegistry.getCommand(command)) {
                    extension.collector.info((0, nls_1.localize)('dup', "Command `{0}` appears multiple times in the `commands` section.", userFriendlyCommand.command));
                }
                const registration = actions_1.MenuRegistry.addCommand({
                    id: command,
                    title,
                    source: (_b = extension.description.displayName) !== null && _b !== void 0 ? _b : extension.description.name,
                    shortTitle,
                    tooltip: title,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.deserialize(enablement),
                    icon: absoluteIcon
                });
                _commandRegistrations.add(registration);
            }
            // remove all previous command registrations
            _commandRegistrations.clear();
            for (const extension of extensions) {
                const { value } = extension;
                if (Array.isArray(value)) {
                    for (const command of value) {
                        handleCommand(command, extension);
                    }
                }
                else {
                    handleCommand(value, extension);
                }
            }
        });
        return result;
    }
    exports.registerCommandsExtensionPoint = registerCommandsExtensionPoint;
    const _submenus = new Map();
    function registerSubmenusExtensionPoint(extensionService) {
        const submenusExtensionPoint = extensionService.registerExtensionPoint({
            extensionPoint: 'submenus',
            jsonSchema: schema.submenusContribution
        });
        return submenusExtensionPoint.setHandler(extensions => {
            _submenus.clear();
            for (let extension of extensions) {
                const { value, collector } = extension;
                (0, collections_1.forEach)(value, entry => {
                    if (!schema.isValidSubmenu(entry.value, collector)) {
                        return;
                    }
                    if (!entry.value.id) {
                        collector.warn((0, nls_1.localize)('submenuId.invalid.id', "`{0}` is not a valid submenu identifier", entry.value.id));
                        return;
                    }
                    if (_submenus.has(entry.value.id)) {
                        collector.warn((0, nls_1.localize)('submenuId.duplicate.id', "The `{0}` submenu was already previously registered.", entry.value.id));
                        return;
                    }
                    if (!entry.value.label) {
                        collector.warn((0, nls_1.localize)('submenuId.invalid.label', "`{0}` is not a valid submenu label", entry.value.label));
                        return;
                    }
                    let absoluteIcon;
                    if (entry.value.icon) {
                        if (typeof entry.value.icon === 'string') {
                            absoluteIcon = themeService_1.ThemeIcon.fromString(entry.value.icon) || { dark: resources.joinPath(extension.description.extensionLocation, entry.value.icon) };
                        }
                        else {
                            absoluteIcon = {
                                dark: resources.joinPath(extension.description.extensionLocation, entry.value.icon.dark),
                                light: resources.joinPath(extension.description.extensionLocation, entry.value.icon.light)
                            };
                        }
                    }
                    const item = {
                        id: new actions_1.MenuId(`api:${entry.value.id}`),
                        label: entry.value.label,
                        icon: absoluteIcon
                    };
                    _submenus.set(entry.value.id, item);
                });
            }
        });
    }
    exports.registerSubmenusExtensionPoint = registerSubmenusExtensionPoint;
    const _apiMenusByKey = new Map(iterator_1.Iterable.map(iterator_1.Iterable.from(apiMenus), menu => ([menu.key, menu])));
    const _menuRegistrations = new lifecycle_1.DisposableStore();
    const _submenuMenuItems = new Map();
    function registerMenusExtensionPoint(extensionService) {
        const menusExtensionPoint = extensionService.registerExtensionPoint({
            extensionPoint: 'menus',
            jsonSchema: schema.menusContribution
        });
        return menusExtensionPoint.setHandler(extensions => {
            // remove all previous menu registrations
            _menuRegistrations.clear();
            _submenuMenuItems.clear();
            const items = [];
            for (let extension of extensions) {
                const { value, collector } = extension;
                (0, collections_1.forEach)(value, entry => {
                    if (!schema.isValidItems(entry.value, collector)) {
                        return;
                    }
                    let menu = _apiMenusByKey.get(entry.key);
                    if (!menu) {
                        const submenu = _submenus.get(entry.key);
                        if (submenu) {
                            menu = {
                                key: entry.key,
                                id: submenu.id,
                                description: ''
                            };
                        }
                    }
                    if (!menu) {
                        collector.info((0, nls_1.localize)('menuId.invalid', "`{0}` is not a valid menu identifier", entry.key));
                        return;
                    }
                    if (menu.proposed && !(0, extensions_1.isProposedApiEnabled)(extension.description, menu.proposed)) {
                        collector.error((0, nls_1.localize)('proposedAPI.invalid', "{0} is a proposed menu identifier. It requires 'package.json#enabledApiProposals: [\"{1}\"]' and is only available when running out of dev or with the following command line switch: --enable-proposed-api {2}", entry.key, menu.proposed, extension.description.identifier.value));
                        return;
                    }
                    for (const menuItem of entry.value) {
                        let item;
                        if (schema.isMenuItem(menuItem)) {
                            const command = actions_1.MenuRegistry.getCommand(menuItem.command);
                            const alt = menuItem.alt && actions_1.MenuRegistry.getCommand(menuItem.alt) || undefined;
                            if (!command) {
                                collector.error((0, nls_1.localize)('missing.command', "Menu item references a command `{0}` which is not defined in the 'commands' section.", menuItem.command));
                                continue;
                            }
                            if (menuItem.alt && !alt) {
                                collector.warn((0, nls_1.localize)('missing.altCommand', "Menu item references an alt-command `{0}` which is not defined in the 'commands' section.", menuItem.alt));
                            }
                            if (menuItem.command === menuItem.alt) {
                                collector.info((0, nls_1.localize)('dupe.command', "Menu item references the same command as default and alt-command"));
                            }
                            item = { command, alt, group: undefined, order: undefined, when: undefined };
                        }
                        else {
                            if (menu.supportsSubmenus === false) {
                                collector.error((0, nls_1.localize)('unsupported.submenureference', "Menu item references a submenu for a menu which doesn't have submenu support."));
                                continue;
                            }
                            const submenu = _submenus.get(menuItem.submenu);
                            if (!submenu) {
                                collector.error((0, nls_1.localize)('missing.submenu', "Menu item references a submenu `{0}` which is not defined in the 'submenus' section.", menuItem.submenu));
                                continue;
                            }
                            let submenuRegistrations = _submenuMenuItems.get(menu.id.id);
                            if (!submenuRegistrations) {
                                submenuRegistrations = new Set();
                                _submenuMenuItems.set(menu.id.id, submenuRegistrations);
                            }
                            if (submenuRegistrations.has(submenu.id.id)) {
                                collector.warn((0, nls_1.localize)('submenuItem.duplicate', "The `{0}` submenu was already contributed to the `{1}` menu.", menuItem.submenu, entry.key));
                                continue;
                            }
                            submenuRegistrations.add(submenu.id.id);
                            item = { submenu: submenu.id, icon: submenu.icon, title: submenu.label, group: undefined, order: undefined, when: undefined };
                        }
                        if (menuItem.group) {
                            const idx = menuItem.group.lastIndexOf('@');
                            if (idx > 0) {
                                item.group = menuItem.group.substr(0, idx);
                                item.order = Number(menuItem.group.substr(idx + 1)) || undefined;
                            }
                            else {
                                item.group = menuItem.group;
                            }
                        }
                        item.when = contextkey_1.ContextKeyExpr.deserialize(menuItem.when);
                        items.push({ id: menu.id, item });
                    }
                });
            }
            _menuRegistrations.add(actions_1.MenuRegistry.appendMenuItems(items));
        });
    }
    exports.registerMenusExtensionPoint = registerMenusExtensionPoint;
});
//# sourceMappingURL=menusExtensionPoint.js.map