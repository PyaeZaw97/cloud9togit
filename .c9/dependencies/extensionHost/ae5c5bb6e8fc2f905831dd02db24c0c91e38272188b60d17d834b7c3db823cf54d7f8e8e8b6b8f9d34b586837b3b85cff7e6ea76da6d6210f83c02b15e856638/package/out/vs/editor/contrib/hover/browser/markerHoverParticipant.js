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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/core/range", "vs/editor/common/services/markerDecorations", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionCommands", "vs/editor/contrib/codeAction/browser/types", "vs/editor/contrib/gotoError/browser/gotoError", "vs/nls", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/services/languageFeatures"], function (require, exports, dom, arrays_1, async_1, errors_1, lifecycle_1, resources_1, range_1, markerDecorations_1, codeAction_1, codeActionCommands_1, types_1, gotoError_1, nls, markers_1, opener_1, progress_1, colorRegistry_1, themeService_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerHoverParticipant = exports.MarkerHover = void 0;
    const $ = dom.$;
    class MarkerHover {
        constructor(owner, range, marker) {
            this.owner = owner;
            this.range = range;
            this.marker = marker;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.MarkerHover = MarkerHover;
    const markerCodeActionTrigger = {
        type: 1 /* CodeActionTriggerType.Invoke */,
        filter: { include: types_1.CodeActionKind.QuickFix }
    };
    let MarkerHoverParticipant = class MarkerHoverParticipant {
        constructor(_editor, _markerDecorationsService, _openerService, _languageFeaturesService) {
            this._editor = _editor;
            this._markerDecorationsService = _markerDecorationsService;
            this._openerService = _openerService;
            this._languageFeaturesService = _languageFeaturesService;
            this.hoverOrdinal = 5;
            this.recentMarkerCodeActionsInfo = undefined;
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            const result = [];
            for (const d of lineDecorations) {
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                const marker = this._markerDecorationsService.getMarker(model.uri, d);
                if (!marker) {
                    continue;
                }
                const range = new range_1.Range(anchor.range.startLineNumber, startColumn, anchor.range.startLineNumber, endColumn);
                result.push(new MarkerHover(this, range, marker));
            }
            return result;
        }
        renderHoverParts(context, hoverParts) {
            if (!hoverParts.length) {
                return lifecycle_1.Disposable.None;
            }
            const disposables = new lifecycle_1.DisposableStore();
            hoverParts.forEach(msg => context.fragment.appendChild(this.renderMarkerHover(msg, disposables)));
            const markerHoverForStatusbar = hoverParts.length === 1 ? hoverParts[0] : hoverParts.sort((a, b) => markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity))[0];
            this.renderMarkerStatusbar(context, markerHoverForStatusbar, disposables);
            return disposables;
        }
        renderMarkerHover(markerHover, disposables) {
            const hoverElement = $('div.hover-row');
            const markerElement = dom.append(hoverElement, $('div.marker.hover-contents'));
            const { source, message, code, relatedInformation } = markerHover.marker;
            this._editor.applyFontInfo(markerElement);
            const messageElement = dom.append(markerElement, $('span'));
            messageElement.style.whiteSpace = 'pre-wrap';
            messageElement.innerText = message;
            if (source || code) {
                // Code has link
                if (code && typeof code !== 'string') {
                    const sourceAndCodeElement = $('span');
                    if (source) {
                        const sourceElement = dom.append(sourceAndCodeElement, $('span'));
                        sourceElement.innerText = source;
                    }
                    const codeLink = dom.append(sourceAndCodeElement, $('a.code-link'));
                    codeLink.setAttribute('href', code.target.toString());
                    disposables.add(dom.addDisposableListener(codeLink, 'click', (e) => {
                        this._openerService.open(code.target, { allowCommands: true });
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                    const codeElement = dom.append(codeLink, $('span'));
                    codeElement.innerText = code.value;
                    const detailsElement = dom.append(markerElement, sourceAndCodeElement);
                    detailsElement.style.opacity = '0.6';
                    detailsElement.style.paddingLeft = '6px';
                }
                else {
                    const detailsElement = dom.append(markerElement, $('span'));
                    detailsElement.style.opacity = '0.6';
                    detailsElement.style.paddingLeft = '6px';
                    detailsElement.innerText = source && code ? `${source}(${code})` : source ? source : `(${code})`;
                }
            }
            if ((0, arrays_1.isNonEmptyArray)(relatedInformation)) {
                for (const { message, resource, startLineNumber, startColumn } of relatedInformation) {
                    const relatedInfoContainer = dom.append(markerElement, $('div'));
                    relatedInfoContainer.style.marginTop = '8px';
                    const a = dom.append(relatedInfoContainer, $('a'));
                    a.innerText = `${(0, resources_1.basename)(resource)}(${startLineNumber}, ${startColumn}): `;
                    a.style.cursor = 'pointer';
                    disposables.add(dom.addDisposableListener(a, 'click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (this._openerService) {
                            this._openerService.open(resource, {
                                fromUserGesture: true,
                                editorOptions: { selection: { startLineNumber, startColumn } }
                            }).catch(errors_1.onUnexpectedError);
                        }
                    }));
                    const messageElement = dom.append(relatedInfoContainer, $('span'));
                    messageElement.innerText = message;
                    this._editor.applyFontInfo(messageElement);
                }
            }
            return hoverElement;
        }
        renderMarkerStatusbar(context, markerHover, disposables) {
            if (markerHover.marker.severity === markers_1.MarkerSeverity.Error || markerHover.marker.severity === markers_1.MarkerSeverity.Warning || markerHover.marker.severity === markers_1.MarkerSeverity.Info) {
                context.statusBar.addAction({
                    label: nls.localize('view problem', "View Problem"),
                    commandId: gotoError_1.NextMarkerAction.ID,
                    run: () => {
                        var _a;
                        context.hide();
                        (_a = gotoError_1.MarkerController.get(this._editor)) === null || _a === void 0 ? void 0 : _a.showAtMarker(markerHover.marker);
                        this._editor.focus();
                    }
                });
            }
            if (!this._editor.getOption(81 /* EditorOption.readOnly */)) {
                const quickfixPlaceholderElement = context.statusBar.append($('div'));
                if (this.recentMarkerCodeActionsInfo) {
                    if (markers_1.IMarkerData.makeKey(this.recentMarkerCodeActionsInfo.marker) === markers_1.IMarkerData.makeKey(markerHover.marker)) {
                        if (!this.recentMarkerCodeActionsInfo.hasCodeActions) {
                            quickfixPlaceholderElement.textContent = nls.localize('noQuickFixes', "No quick fixes available");
                        }
                    }
                    else {
                        this.recentMarkerCodeActionsInfo = undefined;
                    }
                }
                const updatePlaceholderDisposable = this.recentMarkerCodeActionsInfo && !this.recentMarkerCodeActionsInfo.hasCodeActions ? lifecycle_1.Disposable.None : disposables.add((0, async_1.disposableTimeout)(() => quickfixPlaceholderElement.textContent = nls.localize('checkingForQuickFixes', "Checking for quick fixes..."), 200));
                if (!quickfixPlaceholderElement.textContent) {
                    // Have some content in here to avoid flickering
                    quickfixPlaceholderElement.textContent = String.fromCharCode(0xA0); // &nbsp;
                }
                const codeActionsPromise = this.getCodeActions(markerHover.marker);
                disposables.add((0, lifecycle_1.toDisposable)(() => codeActionsPromise.cancel()));
                codeActionsPromise.then(actions => {
                    updatePlaceholderDisposable.dispose();
                    this.recentMarkerCodeActionsInfo = { marker: markerHover.marker, hasCodeActions: actions.validActions.length > 0 };
                    if (!this.recentMarkerCodeActionsInfo.hasCodeActions) {
                        actions.dispose();
                        quickfixPlaceholderElement.textContent = nls.localize('noQuickFixes', "No quick fixes available");
                        return;
                    }
                    quickfixPlaceholderElement.style.display = 'none';
                    let showing = false;
                    disposables.add((0, lifecycle_1.toDisposable)(() => {
                        if (!showing) {
                            actions.dispose();
                        }
                    }));
                    context.statusBar.addAction({
                        label: nls.localize('quick fixes', "Quick Fix..."),
                        commandId: codeActionCommands_1.QuickFixAction.Id,
                        run: (target) => {
                            showing = true;
                            const controller = codeActionCommands_1.QuickFixController.get(this._editor);
                            const elementPosition = dom.getDomNodePagePosition(target);
                            // Hide the hover pre-emptively, otherwise the editor can close the code actions
                            // context menu as well when using keyboard navigation
                            context.hide();
                            controller === null || controller === void 0 ? void 0 : controller.showCodeActions(markerCodeActionTrigger, actions, {
                                x: elementPosition.left + 6,
                                y: elementPosition.top + elementPosition.height + 6,
                                width: elementPosition.width,
                                height: elementPosition.height
                            });
                        }
                    });
                }, errors_1.onUnexpectedError);
            }
        }
        getCodeActions(marker) {
            return (0, async_1.createCancelablePromise)(cancellationToken => {
                return (0, codeAction_1.getCodeActions)(this._languageFeaturesService.codeActionProvider, this._editor.getModel(), new range_1.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn), markerCodeActionTrigger, progress_1.Progress.None, cancellationToken);
            });
        }
    };
    MarkerHoverParticipant = __decorate([
        __param(1, markerDecorations_1.IMarkerDecorationsService),
        __param(2, opener_1.IOpenerService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], MarkerHoverParticipant);
    exports.MarkerHoverParticipant = MarkerHoverParticipant;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const linkFg = theme.getColor(colorRegistry_1.textLinkForeground);
        if (linkFg) {
            collector.addRule(`.monaco-hover .hover-contents a.code-link span { color: ${linkFg}; }`);
        }
        const activeLinkFg = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLinkFg) {
            collector.addRule(`.monaco-hover .hover-contents a.code-link span:hover { color: ${activeLinkFg}; }`);
        }
    });
});
//# sourceMappingURL=markerHoverParticipant.js.map