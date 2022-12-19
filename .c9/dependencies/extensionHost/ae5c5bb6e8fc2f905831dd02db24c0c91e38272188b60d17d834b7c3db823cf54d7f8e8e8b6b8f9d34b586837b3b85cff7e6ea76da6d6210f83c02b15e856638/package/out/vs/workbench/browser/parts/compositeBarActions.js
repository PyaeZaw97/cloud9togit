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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dnd", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/browser/dnd", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/codicons", "vs/workbench/services/hover/browser/hover", "vs/base/common/async", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, actions_1, dom_1, commands_1, lifecycle_1, contextView_1, themeService_1, activity_1, instantiation_1, colorRegistry_1, dnd_1, keybinding_1, event_1, dnd_2, actionViewItems_1, codicons_1, hover_1, async_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCompositePinnedAction = exports.CompositeActionViewItem = exports.CompositeOverflowActivityActionViewItem = exports.CompositeOverflowActivityAction = exports.ActivityActionViewItem = exports.ActivityAction = void 0;
    class ActivityAction extends actions_1.Action {
        constructor(_activity) {
            super(_activity.id, _activity.name, _activity.cssClass);
            this._activity = _activity;
            this._onDidChangeActivity = this._register(new event_1.Emitter());
            this.onDidChangeActivity = this._onDidChangeActivity.event;
            this._onDidChangeBadge = this._register(new event_1.Emitter());
            this.onDidChangeBadge = this._onDidChangeBadge.event;
        }
        get activity() {
            return this._activity;
        }
        set activity(activity) {
            this._label = activity.name;
            this._activity = activity;
            this._onDidChangeActivity.fire(this);
        }
        activate() {
            if (!this.checked) {
                this._setChecked(true);
            }
        }
        deactivate() {
            if (this.checked) {
                this._setChecked(false);
            }
        }
        getBadge() {
            return this.badge;
        }
        getClass() {
            return this.clazz;
        }
        setBadge(badge, clazz) {
            this.badge = badge;
            this.clazz = clazz;
            this._onDidChangeBadge.fire(this);
        }
        dispose() {
            this._onDidChangeActivity.dispose();
            this._onDidChangeBadge.dispose();
            super.dispose();
        }
    }
    exports.ActivityAction = ActivityAction;
    let ActivityActionViewItem = class ActivityActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(action, options, themeService, hoverService, configurationService, keybindingService) {
            super(null, action, options);
            this.themeService = themeService;
            this.hoverService = hoverService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.hoverDisposables = this._register(new lifecycle_1.DisposableStore());
            this.hover = this._register(new lifecycle_1.MutableDisposable());
            this.showHoverScheduler = new async_1.RunOnceScheduler(() => this.showHover(), 0);
            this.options = options;
            this._register(this.themeService.onDidColorThemeChange(this.onThemeChange, this));
            this._register(action.onDidChangeActivity(this.updateActivity, this));
            this._register(event_1.Event.filter(keybindingService.onDidUpdateKeybindings, () => this.keybindingLabel !== this.computeKeybindingLabel())(() => this.updateTitle()));
            this._register(action.onDidChangeBadge(this.updateBadge, this));
            this._register((0, lifecycle_1.toDisposable)(() => this.showHoverScheduler.cancel()));
        }
        get activity() {
            return this._action.activity;
        }
        updateStyles() {
            const theme = this.themeService.getColorTheme();
            const colors = this.options.colors(theme);
            if (this.label) {
                if (this.options.icon) {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    if (this.activity.iconUrl) {
                        // Apply background color to activity bar item provided with iconUrls
                        this.label.style.backgroundColor = foreground ? foreground.toString() : '';
                        this.label.style.color = '';
                    }
                    else {
                        // Apply foreground color to activity bar items provided with codicons
                        this.label.style.color = foreground ? foreground.toString() : '';
                        this.label.style.backgroundColor = '';
                    }
                }
                else {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    const borderBottomColor = this._action.checked ? colors.activeBorderBottomColor : null;
                    this.label.style.color = foreground ? foreground.toString() : '';
                    this.label.style.borderBottomColor = borderBottomColor ? borderBottomColor.toString() : '';
                }
                this.container.style.setProperty('--insert-border-color', colors.dragAndDropBorder ? colors.dragAndDropBorder.toString() : '');
            }
            // Badge
            if (this.badgeContent) {
                const badgeForeground = colors.badgeForeground;
                const badgeBackground = colors.badgeBackground;
                const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
                this.badgeContent.style.color = badgeForeground ? badgeForeground.toString() : '';
                this.badgeContent.style.backgroundColor = badgeBackground ? badgeBackground.toString() : '';
                this.badgeContent.style.borderStyle = contrastBorderColor ? 'solid' : '';
                this.badgeContent.style.borderWidth = contrastBorderColor ? '1px' : '';
                this.badgeContent.style.borderColor = contrastBorderColor ? contrastBorderColor.toString() : '';
            }
        }
        render(container) {
            super.render(container);
            this.container = container;
            if (this.options.icon) {
                this.container.classList.add('icon');
            }
            if (this.options.hasPopup) {
                this.container.setAttribute('role', 'button');
                this.container.setAttribute('aria-haspopup', 'true');
            }
            else {
                this.container.setAttribute('role', 'tab');
            }
            // Try hard to prevent keyboard only focus feedback when using mouse
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_DOWN, () => {
                this.container.classList.add('clicked');
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_UP, () => {
                if (this.mouseUpTimeout) {
                    clearTimeout(this.mouseUpTimeout);
                }
                this.mouseUpTimeout = setTimeout(() => {
                    this.container.classList.remove('clicked');
                }, 800); // delayed to prevent focus feedback from showing on mouse up
            }));
            // Label
            this.label = (0, dom_1.append)(container, (0, dom_1.$)('a'));
            // Badge
            this.badge = (0, dom_1.append)(container, (0, dom_1.$)('.badge'));
            this.badgeContent = (0, dom_1.append)(this.badge, (0, dom_1.$)('.badge-content'));
            // pane composite bar active border + background
            (0, dom_1.append)(container, (0, dom_1.$)('.active-item-indicator'));
            (0, dom_1.hide)(this.badge);
            this.updateActivity();
            this.updateStyles();
            this.updateHover();
        }
        onThemeChange(theme) {
            this.updateStyles();
        }
        updateActivity() {
            this.updateLabel();
            this.updateTitle();
            this.updateBadge();
            this.updateStyles();
        }
        updateBadge() {
            const action = this.getAction();
            if (!this.badge || !this.badgeContent || !(action instanceof ActivityAction)) {
                return;
            }
            const badge = action.getBadge();
            const clazz = action.getClass();
            this.badgeDisposable.clear();
            (0, dom_1.clearNode)(this.badgeContent);
            (0, dom_1.hide)(this.badge);
            if (badge) {
                // Number
                if (badge instanceof activity_1.NumberBadge) {
                    if (badge.number) {
                        let number = badge.number.toString();
                        if (badge.number > 999) {
                            const noOfThousands = badge.number / 1000;
                            const floor = Math.floor(noOfThousands);
                            if (noOfThousands > floor) {
                                number = `${floor}K+`;
                            }
                            else {
                                number = `${noOfThousands}K`;
                            }
                        }
                        this.badgeContent.textContent = number;
                        (0, dom_1.show)(this.badge);
                    }
                }
                // Text
                else if (badge instanceof activity_1.TextBadge) {
                    this.badgeContent.textContent = badge.text;
                    (0, dom_1.show)(this.badge);
                }
                // Icon
                else if (badge instanceof activity_1.IconBadge) {
                    const clazzList = themeService_1.ThemeIcon.asClassNameArray(badge.icon);
                    this.badgeContent.classList.add(...clazzList);
                    (0, dom_1.show)(this.badge);
                }
                // Progress
                else if (badge instanceof activity_1.ProgressBadge) {
                    (0, dom_1.show)(this.badge);
                }
                if (clazz) {
                    const classNames = clazz.split(' ');
                    this.badge.classList.add(...classNames);
                    this.badgeDisposable.value = (0, lifecycle_1.toDisposable)(() => this.badge.classList.remove(...classNames));
                }
            }
            this.updateTitle();
        }
        updateLabel() {
            this.label.className = 'action-label';
            if (this.activity.cssClass) {
                this.label.classList.add(...this.activity.cssClass.split(' '));
            }
            if (this.options.icon && !this.activity.iconUrl) {
                // Only apply codicon class to activity bar icon items without iconUrl
                this.label.classList.add('codicon');
            }
            if (!this.options.icon) {
                this.label.textContent = this.getAction().label;
            }
        }
        updateTitle() {
            // Title
            const title = this.computeTitle();
            [this.label, this.badge, this.container].forEach(element => {
                if (element) {
                    element.setAttribute('aria-label', title);
                    element.setAttribute('title', '');
                    element.removeAttribute('title');
                }
            });
        }
        computeTitle() {
            this.keybindingLabel = this.computeKeybindingLabel();
            let title = this.keybindingLabel ? (0, nls_1.localize)('titleKeybinding', "{0} ({1})", this.activity.name, this.keybindingLabel) : this.activity.name;
            const badge = this.getAction().getBadge();
            if (badge === null || badge === void 0 ? void 0 : badge.getDescription()) {
                title = (0, nls_1.localize)('badgeTitle', "{0} - {1}", title, badge.getDescription());
            }
            return title;
        }
        computeKeybindingLabel() {
            const keybinding = this.activity.keybindingId ? this.keybindingService.lookupKeybinding(this.activity.keybindingId) : null;
            return keybinding === null || keybinding === void 0 ? void 0 : keybinding.getLabel();
        }
        updateHover() {
            this.hoverDisposables.clear();
            this.updateTitle();
            this.hoverDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_OVER, () => {
                if (!this.showHoverScheduler.isScheduled()) {
                    if (Date.now() - ActivityActionViewItem._hoverLeaveTime < 200) {
                        this.showHover(true);
                    }
                    else {
                        this.showHoverScheduler.schedule(this.configurationService.getValue('workbench.hover.delay'));
                    }
                }
            }, true));
            this.hoverDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_LEAVE, () => {
                ActivityActionViewItem._hoverLeaveTime = Date.now();
                this.hover.value = undefined;
                this.showHoverScheduler.cancel();
            }, true));
            this.hoverDisposables.add((0, lifecycle_1.toDisposable)(() => {
                this.hover.value = undefined;
                this.showHoverScheduler.cancel();
            }));
        }
        showHover(skipFadeInAnimation = false) {
            if (this.hover.value) {
                return;
            }
            const hoverPosition = this.options.hoverOptions.position();
            this.hover.value = this.hoverService.showHover({
                target: this.container,
                hoverPosition,
                content: this.computeTitle(),
                showPointer: true,
                compact: true,
                hideOnKeyDown: true,
                skipFadeInAnimation,
            });
        }
        dispose() {
            super.dispose();
            if (this.mouseUpTimeout) {
                clearTimeout(this.mouseUpTimeout);
            }
            this.badge.remove();
        }
    };
    ActivityActionViewItem._hoverLeaveTime = 0;
    ActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, hover_1.IHoverService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, keybinding_1.IKeybindingService)
    ], ActivityActionViewItem);
    exports.ActivityActionViewItem = ActivityActionViewItem;
    class CompositeOverflowActivityAction extends ActivityAction {
        constructor(showMenu) {
            super({
                id: 'additionalComposites.action',
                name: (0, nls_1.localize)('additionalViews', "Additional Views"),
                cssClass: codicons_1.Codicon.more.classNames
            });
            this.showMenu = showMenu;
        }
        async run() {
            this.showMenu();
        }
    }
    exports.CompositeOverflowActivityAction = CompositeOverflowActivityAction;
    let CompositeOverflowActivityActionViewItem = class CompositeOverflowActivityActionViewItem extends ActivityActionViewItem {
        constructor(action, getOverflowingComposites, getActiveCompositeId, getBadge, getCompositeOpenAction, colors, hoverOptions, contextMenuService, themeService, hoverService, configurationService, keybindingService) {
            super(action, { icon: true, colors, hasPopup: true, hoverOptions }, themeService, hoverService, configurationService, keybindingService);
            this.getOverflowingComposites = getOverflowingComposites;
            this.getActiveCompositeId = getActiveCompositeId;
            this.getBadge = getBadge;
            this.getCompositeOpenAction = getCompositeOpenAction;
            this.contextMenuService = contextMenuService;
            this.actions = [];
        }
        showMenu() {
            if (this.actions) {
                (0, lifecycle_1.dispose)(this.actions);
            }
            this.actions = this.getActions();
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.container,
                getActions: () => this.actions,
                getCheckedActionsRepresentation: () => 'radio',
                onHide: () => (0, lifecycle_1.dispose)(this.actions)
            });
        }
        getActions() {
            return this.getOverflowingComposites().map(composite => {
                const action = this.getCompositeOpenAction(composite.id);
                action.checked = this.getActiveCompositeId() === action.id;
                const badge = this.getBadge(composite.id);
                let suffix;
                if (badge instanceof activity_1.NumberBadge) {
                    suffix = badge.number;
                }
                else if (badge instanceof activity_1.TextBadge) {
                    suffix = badge.text;
                }
                if (suffix) {
                    action.label = (0, nls_1.localize)('numberBadge', "{0} ({1})", composite.name, suffix);
                }
                else {
                    action.label = composite.name || '';
                }
                return action;
            });
        }
        dispose() {
            super.dispose();
            if (this.actions) {
                this.actions = (0, lifecycle_1.dispose)(this.actions);
            }
        }
    };
    CompositeOverflowActivityActionViewItem = __decorate([
        __param(7, contextView_1.IContextMenuService),
        __param(8, themeService_1.IThemeService),
        __param(9, hover_1.IHoverService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService)
    ], CompositeOverflowActivityActionViewItem);
    exports.CompositeOverflowActivityActionViewItem = CompositeOverflowActivityActionViewItem;
    let ManageExtensionAction = class ManageExtensionAction extends actions_1.Action {
        constructor(commandService) {
            super('activitybar.manage.extension', (0, nls_1.localize)('manageExtension', "Manage Extension"));
            this.commandService = commandService;
        }
        run(id) {
            return this.commandService.executeCommand('_extensions.manage', id);
        }
    };
    ManageExtensionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], ManageExtensionAction);
    let CompositeActionViewItem = class CompositeActionViewItem extends ActivityActionViewItem {
        constructor(options, compositeActivityAction, toggleCompositePinnedAction, compositeContextMenuActionsProvider, contextMenuActionsProvider, dndHandler, compositeBar, contextMenuService, keybindingService, instantiationService, themeService, hoverService, configurationService) {
            super(compositeActivityAction, options, themeService, hoverService, configurationService, keybindingService);
            this.compositeActivityAction = compositeActivityAction;
            this.toggleCompositePinnedAction = toggleCompositePinnedAction;
            this.compositeContextMenuActionsProvider = compositeContextMenuActionsProvider;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.dndHandler = dndHandler;
            this.compositeBar = compositeBar;
            this.contextMenuService = contextMenuService;
            if (!CompositeActionViewItem.manageExtensionAction) {
                CompositeActionViewItem.manageExtensionAction = instantiationService.createInstance(ManageExtensionAction);
            }
        }
        render(container) {
            super.render(container);
            this.updateChecked();
            this.updateEnabled();
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, e => {
                dom_1.EventHelper.stop(e, true);
                this.showContextMenu(container);
            }));
            let insertDropBefore = undefined;
            // Allow to drag
            this._register(dnd_2.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.container, () => { return { type: 'composite', id: this.activity.id }; }, {
                onDragOver: e => {
                    const isValidMove = e.dragAndDropData.getData().id !== this.activity.id && this.dndHandler.onDragOver(e.dragAndDropData, this.activity.id, e.eventData);
                    (0, dnd_2.toggleDropEffect)(e.eventData.dataTransfer, 'move', isValidMove);
                    insertDropBefore = this.updateFromDragging(container, isValidMove, e.eventData);
                },
                onDragLeave: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragEnd: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDrop: e => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.dndHandler.drop(e.dragAndDropData, this.activity.id, e.eventData, insertDropBefore);
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragStart: e => {
                    if (e.dragAndDropData.getData().id !== this.activity.id) {
                        return;
                    }
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.effectAllowed = 'move';
                    }
                    // Remove focus indicator when dragging
                    this.blur();
                }
            }));
            // Activate on drag over to reveal targets
            [this.badge, this.label].forEach(b => this._register(new dnd_1.DelayedDragHandler(b, () => {
                if (!this.getAction().checked) {
                    this.getAction().run();
                }
            })));
            this.updateStyles();
        }
        updateFromDragging(element, showFeedback, event) {
            const rect = element.getBoundingClientRect();
            const posX = event.clientX;
            const posY = event.clientY;
            const height = rect.bottom - rect.top;
            const width = rect.right - rect.left;
            const forceTop = posY <= rect.top + height * 0.4;
            const forceBottom = posY > rect.bottom - height * 0.4;
            const preferTop = posY <= rect.top + height * 0.5;
            const forceLeft = posX <= rect.left + width * 0.4;
            const forceRight = posX > rect.right - width * 0.4;
            const preferLeft = posX <= rect.left + width * 0.5;
            const classes = element.classList;
            const lastClasses = {
                vertical: classes.contains('top') ? 'top' : (classes.contains('bottom') ? 'bottom' : undefined),
                horizontal: classes.contains('left') ? 'left' : (classes.contains('right') ? 'right' : undefined)
            };
            const top = forceTop || (preferTop && !lastClasses.vertical) || (!forceBottom && lastClasses.vertical === 'top');
            const bottom = forceBottom || (!preferTop && !lastClasses.vertical) || (!forceTop && lastClasses.vertical === 'bottom');
            const left = forceLeft || (preferLeft && !lastClasses.horizontal) || (!forceRight && lastClasses.horizontal === 'left');
            const right = forceRight || (!preferLeft && !lastClasses.horizontal) || (!forceLeft && lastClasses.horizontal === 'right');
            element.classList.toggle('top', showFeedback && top);
            element.classList.toggle('bottom', showFeedback && bottom);
            element.classList.toggle('left', showFeedback && left);
            element.classList.toggle('right', showFeedback && right);
            if (!showFeedback) {
                return undefined;
            }
            return { verticallyBefore: top, horizontallyBefore: left };
        }
        showContextMenu(container) {
            const actions = [this.toggleCompositePinnedAction];
            const compositeContextMenuActions = this.compositeContextMenuActionsProvider(this.activity.id);
            if (compositeContextMenuActions.length) {
                actions.push(...compositeContextMenuActions);
            }
            if (this.compositeActivityAction.activity.extensionId) {
                actions.push(new actions_1.Separator());
                actions.push(CompositeActionViewItem.manageExtensionAction);
            }
            const isPinned = this.compositeBar.isPinned(this.activity.id);
            if (isPinned) {
                this.toggleCompositePinnedAction.label = (0, nls_1.localize)('hide', "Hide '{0}'", this.activity.name);
                this.toggleCompositePinnedAction.checked = false;
            }
            else {
                this.toggleCompositePinnedAction.label = (0, nls_1.localize)('keep', "Keep '{0}'", this.activity.name);
            }
            const otherActions = this.contextMenuActionsProvider();
            if (otherActions.length) {
                actions.push(new actions_1.Separator());
                actions.push(...otherActions);
            }
            const elementPosition = (0, dom_1.getDomNodePagePosition)(container);
            const anchor = {
                x: Math.floor(elementPosition.left + (elementPosition.width / 2)),
                y: elementPosition.top + elementPosition.height
            };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => this.activity.id
            });
        }
        updateChecked() {
            if (this.getAction().checked) {
                this.container.classList.add('checked');
                this.container.setAttribute('aria-label', this.container.title);
                this.container.setAttribute('aria-expanded', 'true');
                this.container.setAttribute('aria-selected', 'true');
            }
            else {
                this.container.classList.remove('checked');
                this.container.setAttribute('aria-label', this.container.title);
                this.container.setAttribute('aria-expanded', 'false');
                this.container.setAttribute('aria-selected', 'false');
            }
            this.updateStyles();
        }
        updateEnabled() {
            if (!this.element) {
                return;
            }
            if (this.getAction().enabled) {
                this.element.classList.remove('disabled');
            }
            else {
                this.element.classList.add('disabled');
            }
        }
        dispose() {
            super.dispose();
            this.label.remove();
        }
    };
    CompositeActionViewItem = __decorate([
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, themeService_1.IThemeService),
        __param(11, hover_1.IHoverService),
        __param(12, configuration_1.IConfigurationService)
    ], CompositeActionViewItem);
    exports.CompositeActionViewItem = CompositeActionViewItem;
    class ToggleCompositePinnedAction extends actions_1.Action {
        constructor(activity, compositeBar) {
            super('show.toggleCompositePinned', activity ? activity.name : (0, nls_1.localize)('toggle', "Toggle View Pinned"));
            this.activity = activity;
            this.compositeBar = compositeBar;
            this.checked = !!this.activity && this.compositeBar.isPinned(this.activity.id);
        }
        async run(context) {
            const id = this.activity ? this.activity.id : context;
            if (this.compositeBar.isPinned(id)) {
                this.compositeBar.unpin(id);
            }
            else {
                this.compositeBar.pin(id);
            }
        }
    }
    exports.ToggleCompositePinnedAction = ToggleCompositePinnedAction;
});
//# sourceMappingURL=compositeBarActions.js.map