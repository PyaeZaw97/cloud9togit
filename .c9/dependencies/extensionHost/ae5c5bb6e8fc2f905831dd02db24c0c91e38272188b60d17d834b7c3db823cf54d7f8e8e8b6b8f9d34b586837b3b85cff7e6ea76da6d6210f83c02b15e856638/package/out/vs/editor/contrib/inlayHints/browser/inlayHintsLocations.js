/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/cancellation", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/goToCommands", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification"], function (require, exports, dom, actions_1, cancellation_1, editorExtensions_1, range_1, resolverService_1, goToCommands_1, peekView_1, actions_2, commands_1, contextkey_1, contextView_1, instantiation_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.goToDefinitionWithLocation = exports.showGoToContextMenu = void 0;
    async function showGoToContextMenu(accessor, editor, anchor, part) {
        var _a;
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const commandService = accessor.get(commands_1.ICommandService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const notificationService = accessor.get(notification_1.INotificationService);
        await part.item.resolve(cancellation_1.CancellationToken.None);
        if (!part.part.location) {
            return;
        }
        const location = part.part.location;
        const menuActions = [];
        // from all registered (not active) context menu actions select those
        // that are a symbol navigation action
        const filter = new Set(actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.EditorContext)
            .map(item => (0, actions_2.isIMenuItem)(item) ? item.command.id : ''));
        for (const delegate of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
            if (delegate instanceof goToCommands_1.SymbolNavigationAction && filter.has(delegate.id)) {
                menuActions.push(new actions_1.Action(delegate.id, delegate.label, undefined, true, async () => {
                    const ref = await resolverService.createModelReference(location.uri);
                    try {
                        await instaService.invokeFunction(delegate.run.bind(delegate), editor, new goToCommands_1.SymbolNavigationAnchor(ref.object.textEditorModel, range_1.Range.getStartPosition(location.range)));
                    }
                    finally {
                        ref.dispose();
                    }
                }));
            }
        }
        if (part.part.command) {
            const { command } = part.part;
            menuActions.push(new actions_1.Separator());
            menuActions.push(new actions_1.Action(command.id, command.title, undefined, true, async () => {
                var _a;
                try {
                    await commandService.executeCommand(command.id, ...((_a = command.arguments) !== null && _a !== void 0 ? _a : []));
                }
                catch (err) {
                    notificationService.notify({
                        severity: notification_1.Severity.Error,
                        source: part.item.provider.displayName,
                        message: err
                    });
                }
            }));
        }
        // show context menu
        const useShadowDOM = editor.getOption(115 /* EditorOption.useShadowDOM */);
        contextMenuService.showContextMenu({
            domForShadowRoot: useShadowDOM ? (_a = editor.getDomNode()) !== null && _a !== void 0 ? _a : undefined : undefined,
            getAnchor: () => {
                const box = dom.getDomNodePagePosition(anchor);
                return { x: box.left, y: box.top + box.height + 8 };
            },
            getActions: () => menuActions,
            onHide: () => {
                editor.focus();
            },
            autoSelectFirstItem: true,
        });
    }
    exports.showGoToContextMenu = showGoToContextMenu;
    async function goToDefinitionWithLocation(accessor, event, editor, location) {
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const ref = await resolverService.createModelReference(location.uri);
        await editor.invokeWithinContext(async (accessor) => {
            const openToSide = event.hasSideBySideModifier;
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const isInPeek = peekView_1.PeekContext.inPeekEditor.getValue(contextKeyService);
            const canPeek = !openToSide && editor.getOption(78 /* EditorOption.definitionLinkOpensInPeek */) && !isInPeek;
            const action = new goToCommands_1.DefinitionAction({ openToSide, openInPeek: canPeek, muteMessage: true }, { alias: '', label: '', id: '', precondition: undefined });
            return action.run(accessor, editor, { model: ref.object.textEditorModel, position: range_1.Range.getStartPosition(location.range) });
        });
        ref.dispose();
    }
    exports.goToDefinitionWithLocation = goToDefinitionWithLocation;
});
//# sourceMappingURL=inlayHintsLocations.js.map