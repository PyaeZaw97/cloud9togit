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
define(["require", "exports", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/splitview/splitview", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewsService"], function (require, exports, terminal_1, event_1, lifecycle_1, splitview_1, layoutService_1, instantiation_1, terminal_2, views_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalGroup = void 0;
    const SPLIT_PANE_MIN_SIZE = 120;
    let SplitPaneContainer = class SplitPaneContainer extends lifecycle_1.Disposable {
        constructor(_container, orientation, _layoutService) {
            super();
            this._container = _container;
            this.orientation = orientation;
            this._layoutService = _layoutService;
            this._splitViewDisposables = this._register(new lifecycle_1.DisposableStore());
            this._children = [];
            this._terminalToPane = new Map();
            this._onDidChange = event_1.Event.None;
            this._width = this._container.offsetWidth;
            this._height = this._container.offsetHeight;
            this._createSplitView();
            this._splitView.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._width : this._height);
        }
        get onDidChange() { return this._onDidChange; }
        _createSplitView() {
            this._splitView = new splitview_1.SplitView(this._container, { orientation: this.orientation });
            this._splitViewDisposables.clear();
            this._splitViewDisposables.add(this._splitView.onDidSashReset(() => this._splitView.distributeViewSizes()));
        }
        split(instance, index) {
            this._addChild(instance, index);
        }
        resizePane(index, direction, amount, part) {
            const isHorizontal = (direction === 0 /* Direction.Left */) || (direction === 1 /* Direction.Right */);
            if ((isHorizontal && this.orientation !== 1 /* Orientation.HORIZONTAL */) ||
                (!isHorizontal && this.orientation !== 0 /* Orientation.VERTICAL */)) {
                // Resize the entire pane as a whole
                if ((this.orientation === 1 /* Orientation.HORIZONTAL */ && direction === 3 /* Direction.Down */) ||
                    (this.orientation === 0 /* Orientation.VERTICAL */ && direction === 1 /* Direction.Right */)) {
                    amount *= -1;
                }
                this._layoutService.resizePart(part, amount, amount);
                return;
            }
            // Resize left/right in horizontal or up/down in vertical
            // Only resize when there is more than one pane
            if (this._children.length <= 1) {
                return;
            }
            // Get sizes
            const sizes = [];
            for (let i = 0; i < this._splitView.length; i++) {
                sizes.push(this._splitView.getViewSize(i));
            }
            // Remove size from right pane, unless index is the last pane in which case use left pane
            const isSizingEndPane = index !== this._children.length - 1;
            const indexToChange = isSizingEndPane ? index + 1 : index - 1;
            if (isSizingEndPane && direction === 0 /* Direction.Left */) {
                amount *= -1;
            }
            else if (!isSizingEndPane && direction === 1 /* Direction.Right */) {
                amount *= -1;
            }
            else if (isSizingEndPane && direction === 2 /* Direction.Up */) {
                amount *= -1;
            }
            else if (!isSizingEndPane && direction === 3 /* Direction.Down */) {
                amount *= -1;
            }
            // Ensure the size is not reduced beyond the minimum, otherwise weird things can happen
            if (sizes[index] + amount < SPLIT_PANE_MIN_SIZE) {
                amount = SPLIT_PANE_MIN_SIZE - sizes[index];
            }
            else if (sizes[indexToChange] - amount < SPLIT_PANE_MIN_SIZE) {
                amount = sizes[indexToChange] - SPLIT_PANE_MIN_SIZE;
            }
            // Apply the size change
            sizes[index] += amount;
            sizes[indexToChange] -= amount;
            for (let i = 0; i < this._splitView.length - 1; i++) {
                this._splitView.resizeView(i, sizes[i]);
            }
        }
        resizePanes(relativeSizes) {
            if (this._children.length <= 1) {
                return;
            }
            // assign any extra size to last terminal
            relativeSizes[relativeSizes.length - 1] += 1 - relativeSizes.reduce((totalValue, currentValue) => totalValue + currentValue, 0);
            let totalSize = 0;
            for (let i = 0; i < this._splitView.length; i++) {
                totalSize += this._splitView.getViewSize(i);
            }
            for (let i = 0; i < this._splitView.length; i++) {
                this._splitView.resizeView(i, totalSize * relativeSizes[i]);
            }
        }
        getRelativePaneSize(instance) {
            const paneForInstance = this._terminalToPane.get(instance);
            if (!paneForInstance) {
                return 0;
            }
            return ((this.orientation === 1 /* Orientation.HORIZONTAL */ ? paneForInstance.element.clientWidth : paneForInstance.element.clientHeight) / (this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._width : this._height));
        }
        _addChild(instance, index) {
            const child = new SplitPane(instance, this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._height : this._width);
            child.orientation = this.orientation;
            if (typeof index === 'number') {
                this._children.splice(index, 0, child);
            }
            else {
                this._children.push(child);
            }
            this._terminalToPane.set(instance, this._children[this._children.indexOf(child)]);
            this._withDisabledLayout(() => this._splitView.addView(child, splitview_1.Sizing.Distribute, index));
            this.layout(this._width, this._height);
            this._onDidChange = event_1.Event.any(...this._children.map(c => c.onDidChange));
        }
        remove(instance) {
            let index = null;
            for (let i = 0; i < this._children.length; i++) {
                if (this._children[i].instance === instance) {
                    index = i;
                }
            }
            if (index !== null) {
                this._children.splice(index, 1);
                this._terminalToPane.delete(instance);
                this._splitView.removeView(index, splitview_1.Sizing.Distribute);
                instance.detachFromElement();
            }
        }
        layout(width, height) {
            this._width = width;
            this._height = height;
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this._children.forEach(c => c.orthogonalLayout(height));
                this._splitView.layout(width);
            }
            else {
                this._children.forEach(c => c.orthogonalLayout(width));
                this._splitView.layout(height);
            }
        }
        setOrientation(orientation) {
            if (this.orientation === orientation) {
                return;
            }
            this.orientation = orientation;
            // Remove old split view
            while (this._container.children.length > 0) {
                this._container.removeChild(this._container.children[0]);
            }
            this._splitViewDisposables.clear();
            this._splitView.dispose();
            // Create new split view with updated orientation
            this._createSplitView();
            this._withDisabledLayout(() => {
                this._children.forEach(child => {
                    child.orientation = orientation;
                    this._splitView.addView(child, 1);
                });
            });
        }
        _withDisabledLayout(innerFunction) {
            // Whenever manipulating views that are going to be changed immediately, disabling
            // layout/resize events in the terminal prevent bad dimensions going to the pty.
            this._children.forEach(c => c.instance.disableLayout = true);
            innerFunction();
            this._children.forEach(c => c.instance.disableLayout = false);
        }
    };
    SplitPaneContainer = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], SplitPaneContainer);
    class SplitPane {
        constructor(instance, orthogonalSize) {
            this.instance = instance;
            this.orthogonalSize = orthogonalSize;
            this.minimumSize = SPLIT_PANE_MIN_SIZE;
            this.maximumSize = Number.MAX_VALUE;
            this._onDidChange = event_1.Event.None;
            this.element = document.createElement('div');
            this.element.className = 'terminal-split-pane';
            this.instance.attachToElement(this.element);
        }
        get onDidChange() { return this._onDidChange; }
        layout(size) {
            // Only layout when both sizes are known
            if (!size || !this.orthogonalSize) {
                return;
            }
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                this.instance.layout({ width: this.orthogonalSize, height: size });
            }
            else {
                this.instance.layout({ width: size, height: this.orthogonalSize });
            }
        }
        orthogonalLayout(size) {
            this.orthogonalSize = size;
        }
    }
    let TerminalGroup = class TerminalGroup extends lifecycle_1.Disposable {
        constructor(_container, shellLaunchConfigOrInstance, _terminalService, _terminalInstanceService, _layoutService, _viewDescriptorService, _instantiationService) {
            super();
            this._container = _container;
            this._terminalService = _terminalService;
            this._terminalInstanceService = _terminalInstanceService;
            this._layoutService = _layoutService;
            this._viewDescriptorService = _viewDescriptorService;
            this._instantiationService = _instantiationService;
            this._terminalInstances = [];
            this._panelPosition = 2 /* Position.BOTTOM */;
            this._terminalLocation = 1 /* ViewContainerLocation.Panel */;
            this._instanceDisposables = new Map();
            this._activeInstanceIndex = -1;
            this._isVisible = false;
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDisposed = this._register(new event_1.Emitter());
            this.onDisposed = this._onDisposed.event;
            this._onInstancesChanged = this._register(new event_1.Emitter());
            this.onInstancesChanged = this._onInstancesChanged.event;
            this._onDidChangeActiveInstance = new event_1.Emitter();
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onPanelOrientationChanged = new event_1.Emitter();
            this.onPanelOrientationChanged = this._onPanelOrientationChanged.event;
            if (shellLaunchConfigOrInstance) {
                this.addInstance(shellLaunchConfigOrInstance);
            }
            if (this._container) {
                this.attachToElement(this._container);
            }
            this._onPanelOrientationChanged.fire(this._terminalLocation === 1 /* ViewContainerLocation.Panel */ && this._panelPosition === 2 /* Position.BOTTOM */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */);
        }
        get terminalInstances() { return this._terminalInstances; }
        addInstance(shellLaunchConfigOrInstance, parentTerminalId) {
            let instance;
            // if a parent terminal is provided, find it
            // otherwise, parent is the active terminal
            const parentIndex = parentTerminalId ? this._terminalInstances.findIndex(t => t.instanceId === parentTerminalId) : this._activeInstanceIndex;
            if ('instanceId' in shellLaunchConfigOrInstance) {
                instance = shellLaunchConfigOrInstance;
            }
            else {
                instance = this._terminalInstanceService.createInstance(shellLaunchConfigOrInstance);
            }
            if (this._terminalInstances.length === 0) {
                this._terminalInstances.push(instance);
                this._activeInstanceIndex = 0;
            }
            else {
                this._terminalInstances.splice(parentIndex + 1, 0, instance);
            }
            this._initInstanceListeners(instance);
            if (this._splitPaneContainer) {
                this._splitPaneContainer.split(instance, parentIndex + 1);
            }
            instance.setVisible(this._isVisible);
            this._onInstancesChanged.fire();
        }
        dispose() {
            super.dispose();
            if (this._container && this._groupElement) {
                this._container.removeChild(this._groupElement);
                this._groupElement = undefined;
            }
            this._terminalInstances = [];
            this._onInstancesChanged.fire();
        }
        get activeInstance() {
            if (this._terminalInstances.length === 0) {
                return undefined;
            }
            return this._terminalInstances[this._activeInstanceIndex];
        }
        getLayoutInfo(isActive) {
            const instances = this.terminalInstances.filter(instance => typeof instance.persistentProcessId === 'number' && instance.shouldPersist);
            return {
                isActive: isActive,
                activePersistentProcessId: this.activeInstance ? this.activeInstance.persistentProcessId : undefined,
                terminals: instances.map(t => {
                    var _a;
                    return {
                        relativeSize: ((_a = this._splitPaneContainer) === null || _a === void 0 ? void 0 : _a.getRelativePaneSize(t)) || 0,
                        terminal: t.persistentProcessId || 0
                    };
                })
            };
        }
        _initInstanceListeners(instance) {
            this._instanceDisposables.set(instance.instanceId, [
                instance.onDisposed(instance => {
                    this._onDidDisposeInstance.fire(instance);
                    this._handleOnDidDisposeInstance(instance);
                }),
                instance.onDidFocus(instance => {
                    this._setActiveInstance(instance);
                    this._onDidFocusInstance.fire(instance);
                }),
                instance.capabilities.onDidAddCapability(() => this._onDidChangeInstanceCapability.fire(instance)),
                instance.capabilities.onDidRemoveCapability(() => this._onDidChangeInstanceCapability.fire(instance)),
            ]);
        }
        _handleOnDidDisposeInstance(instance) {
            this._removeInstance(instance);
        }
        removeInstance(instance) {
            this._removeInstance(instance);
            // Dispose instance event listeners
            const disposables = this._instanceDisposables.get(instance.instanceId);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
                this._instanceDisposables.delete(instance.instanceId);
            }
        }
        _removeInstance(instance) {
            var _a;
            const index = this._terminalInstances.indexOf(instance);
            if (index === -1) {
                return;
            }
            const wasActiveInstance = instance === this.activeInstance;
            this._terminalInstances.splice(index, 1);
            // Adjust focus if the instance was active
            if (wasActiveInstance && this._terminalInstances.length > 0) {
                const newIndex = index < this._terminalInstances.length ? index : this._terminalInstances.length - 1;
                this.setActiveInstanceByIndex(newIndex);
                // TODO: Only focus the new instance if the group had focus?
                if (this.activeInstance) {
                    this.activeInstance.focus(true);
                }
            }
            else if (index < this._activeInstanceIndex) {
                // Adjust active instance index if needed
                this._activeInstanceIndex--;
            }
            (_a = this._splitPaneContainer) === null || _a === void 0 ? void 0 : _a.remove(instance);
            // Fire events and dispose group if it was the last instance
            if (this._terminalInstances.length === 0) {
                this._onDisposed.fire(this);
                this.dispose();
            }
            else {
                this._onInstancesChanged.fire();
            }
        }
        moveInstance(instance, index) {
            const sourceIndex = this.terminalInstances.indexOf(instance);
            if (sourceIndex === -1) {
                return;
            }
            this._terminalInstances.splice(sourceIndex, 1);
            this._terminalInstances.splice(index, 0, instance);
            if (this._splitPaneContainer) {
                this._splitPaneContainer.remove(instance);
                this._splitPaneContainer.split(instance, index);
            }
            this._onInstancesChanged.fire();
        }
        _setActiveInstance(instance) {
            this.setActiveInstanceByIndex(this._getIndexFromId(instance.instanceId));
        }
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.terminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        setActiveInstanceByIndex(index, force) {
            // Check for invalid value
            if (index < 0 || index >= this._terminalInstances.length) {
                return;
            }
            const oldActiveInstance = this.activeInstance;
            this._activeInstanceIndex = index;
            if (oldActiveInstance !== this.activeInstance || force) {
                this._onInstancesChanged.fire();
                this._onDidChangeActiveInstance.fire(this.activeInstance);
            }
        }
        attachToElement(element) {
            this._container = element;
            // If we already have a group element, we can reparent it
            if (!this._groupElement) {
                this._groupElement = document.createElement('div');
                this._groupElement.classList.add('terminal-group');
            }
            this._container.appendChild(this._groupElement);
            if (!this._splitPaneContainer) {
                this._panelPosition = this._layoutService.getPanelPosition();
                this._terminalLocation = this._viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID);
                const orientation = this._terminalLocation === 1 /* ViewContainerLocation.Panel */ && this._panelPosition === 2 /* Position.BOTTOM */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
                this._splitPaneContainer = this._instantiationService.createInstance(SplitPaneContainer, this._groupElement, orientation);
                this.terminalInstances.forEach(instance => this._splitPaneContainer.split(instance, this._activeInstanceIndex + 1));
                if (this._initialRelativeSizes) {
                    this.resizePanes(this._initialRelativeSizes);
                    this._initialRelativeSizes = undefined;
                }
            }
            this.setVisible(this._isVisible);
        }
        get title() {
            if (this._terminalInstances.length === 0) {
                // Normally consumers should not call into title at all after the group is disposed but
                // this is required when the group is used as part of a tree.
                return '';
            }
            let title = this.terminalInstances[0].title + this._getBellTitle(this.terminalInstances[0]);
            if (this.terminalInstances[0].description) {
                title += ` (${this.terminalInstances[0].description})`;
            }
            for (let i = 1; i < this.terminalInstances.length; i++) {
                const instance = this.terminalInstances[i];
                if (instance.title) {
                    title += `, ${instance.title + this._getBellTitle(instance)}`;
                    if (instance.description) {
                        title += ` (${instance.description})`;
                    }
                }
            }
            return title;
        }
        _getBellTitle(instance) {
            if (this._terminalService.configHelper.config.enableBell && instance.statusList.statuses.find(e => e.id === "bell" /* TerminalStatus.Bell */)) {
                return '*';
            }
            return '';
        }
        setVisible(visible) {
            this._isVisible = visible;
            if (this._groupElement) {
                this._groupElement.style.display = visible ? '' : 'none';
            }
            this.terminalInstances.forEach(i => i.setVisible(visible));
        }
        split(shellLaunchConfig) {
            const instance = this._terminalInstanceService.createInstance(shellLaunchConfig);
            this.addInstance(instance, shellLaunchConfig.parentTerminalId);
            this._setActiveInstance(instance);
            return instance;
        }
        addDisposable(disposable) {
            this._register(disposable);
        }
        layout(width, height) {
            if (this._splitPaneContainer) {
                // Check if the panel position changed and rotate panes if so
                const newPanelPosition = this._layoutService.getPanelPosition();
                const newTerminalLocation = this._viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID);
                const terminalPositionChanged = newPanelPosition !== this._panelPosition || newTerminalLocation !== this._terminalLocation;
                if (terminalPositionChanged) {
                    const newOrientation = newTerminalLocation === 1 /* ViewContainerLocation.Panel */ && newPanelPosition === 2 /* Position.BOTTOM */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
                    this._splitPaneContainer.setOrientation(newOrientation);
                    this._panelPosition = newPanelPosition;
                    this._terminalLocation = newTerminalLocation;
                    this._onPanelOrientationChanged.fire(this._splitPaneContainer.orientation);
                }
                this._splitPaneContainer.layout(width, height);
            }
        }
        focusPreviousPane() {
            const newIndex = this._activeInstanceIndex === 0 ? this._terminalInstances.length - 1 : this._activeInstanceIndex - 1;
            this.setActiveInstanceByIndex(newIndex);
        }
        focusNextPane() {
            const newIndex = this._activeInstanceIndex === this._terminalInstances.length - 1 ? 0 : this._activeInstanceIndex + 1;
            this.setActiveInstanceByIndex(newIndex);
        }
        resizePane(direction) {
            if (!this._splitPaneContainer) {
                return;
            }
            const isHorizontal = (direction === 0 /* Direction.Left */ || direction === 1 /* Direction.Right */);
            const font = this._terminalService.configHelper.getFont();
            // TODO: Support letter spacing and line height
            const amount = isHorizontal ? font.charWidth : font.charHeight;
            if (amount) {
                this._splitPaneContainer.resizePane(this._activeInstanceIndex, direction, amount, (0, viewsService_1.getPartByLocation)(this._terminalLocation));
            }
        }
        resizePanes(relativeSizes) {
            if (!this._splitPaneContainer) {
                this._initialRelativeSizes = relativeSizes;
                return;
            }
            this._splitPaneContainer.resizePanes(relativeSizes);
        }
    };
    TerminalGroup = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, terminal_2.ITerminalInstanceService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService)
    ], TerminalGroup);
    exports.TerminalGroup = TerminalGroup;
});
//# sourceMappingURL=terminalGroup.js.map