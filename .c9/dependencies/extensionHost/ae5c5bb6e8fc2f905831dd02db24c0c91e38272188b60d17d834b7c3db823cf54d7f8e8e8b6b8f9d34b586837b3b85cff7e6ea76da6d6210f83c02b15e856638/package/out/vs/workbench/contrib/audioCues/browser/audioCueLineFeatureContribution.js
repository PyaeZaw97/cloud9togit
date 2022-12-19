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
define(["require", "exports", "vs/workbench/contrib/debug/common/debug", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/base/common/event", "vs/editor/browser/editorBrowser", "vs/platform/markers/common/markers", "vs/editor/contrib/folding/browser/folding", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/audioCues/browser/observable", "vs/editor/contrib/inlineCompletions/browser/ghostTextController", "vs/workbench/contrib/audioCues/browser/audioCueService"], function (require, exports, debug_1, lifecycle_1, editorService_1, event_1, editorBrowser_1, markers_1, folding_1, instantiation_1, observable_1, ghostTextController_1, audioCueService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AudioCueLineFeatureContribution = void 0;
    let AudioCueLineFeatureContribution = class AudioCueLineFeatureContribution extends lifecycle_1.Disposable {
        constructor(editorService, instantiationService, audioCueService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.audioCueService = audioCueService;
            this.store = this._register(new lifecycle_1.DisposableStore());
            this.features = [
                this.instantiationService.createInstance(MarkerLineFeature, audioCueService_1.AudioCue.error, markers_1.MarkerSeverity.Error),
                this.instantiationService.createInstance(MarkerLineFeature, audioCueService_1.AudioCue.warning, markers_1.MarkerSeverity.Warning),
                this.instantiationService.createInstance(FoldedAreaLineFeature),
                this.instantiationService.createInstance(BreakpointLineFeature),
                this.instantiationService.createInstance(InlineCompletionLineFeature),
            ];
            const someAudioCueFeatureIsEnabled = (0, observable_1.derivedObservable)('someAudioCueFeatureIsEnabled', (reader) => this.features.some((feature) => this.audioCueService.isEnabled(feature.audioCue).read(reader)));
            const activeEditorObservable = (0, observable_1.observableFromEvent)(this.editorService.onDidActiveEditorChange, (_) => {
                const activeTextEditorControl = this.editorService.activeTextEditorControl;
                const editor = (0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)
                    ? activeTextEditorControl.getOriginalEditor()
                    : (0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)
                        ? activeTextEditorControl
                        : undefined;
                return editor && editor.hasModel() ? { editor, model: editor.getModel() } : undefined;
            });
            this._register((0, observable_1.autorun)((reader) => {
                this.store.clear();
                if (!someAudioCueFeatureIsEnabled.read(reader)) {
                    return;
                }
                const activeEditor = activeEditorObservable.read(reader);
                if (activeEditor) {
                    this.registerAudioCuesForEditor(activeEditor.editor, activeEditor.model, this.store);
                }
            }, 'updateAudioCuesEnabled'));
        }
        registerAudioCuesForEditor(editor, editorModel, store) {
            const curLineNumber = (0, observable_1.observableFromEvent)(editor.onDidChangeCursorPosition, (args) => {
                var _a;
                if (args &&
                    args.reason !== 3 /* CursorChangeReason.Explicit */ &&
                    args.reason !== 0 /* CursorChangeReason.NotSet */) {
                    // Ignore cursor changes caused by navigation (e.g. which happens when execution is paused).
                    return undefined;
                }
                return (_a = editor.getPosition()) === null || _a === void 0 ? void 0 : _a.lineNumber;
            });
            const debouncedLineNumber = (0, observable_1.debouncedObservable)(curLineNumber, 300, store);
            const isTyping = (0, observable_1.wasEventTriggeredRecently)(editorModel.onDidChangeContent.bind(editorModel), 1000, store);
            const featureStates = this.features.map((feature) => {
                const lineFeatureState = feature.getObservableState(editor, editorModel);
                const isFeaturePresent = (0, observable_1.derivedObservable)(`isPresentInLine:${feature.audioCue.name}`, (reader) => {
                    if (!this.audioCueService.isEnabled(feature.audioCue).read(reader)) {
                        return false;
                    }
                    const lineNumber = debouncedLineNumber.read(reader);
                    return lineNumber === undefined
                        ? false
                        : lineFeatureState.read(reader).isPresent(lineNumber);
                });
                return (0, observable_1.derivedObservable)(`typingDebouncedFeatureState:\n${feature.audioCue.name}`, (reader) => feature.debounceWhileTyping && isTyping.read(reader)
                    ? (debouncedLineNumber.read(reader), isFeaturePresent.get())
                    : isFeaturePresent.read(reader));
            });
            const state = (0, observable_1.derivedObservable)('states', (reader) => ({
                lineNumber: debouncedLineNumber.read(reader),
                featureStates: new Map(this.features.map((feature, idx) => [
                    feature,
                    featureStates[idx].read(reader),
                ])),
            }));
            store.add((0, observable_1.autorunDelta)('Play Audio Cue', state, ({ lastValue, newValue }) => {
                const newFeatures = this.features.filter(feature => {
                    var _a;
                    return (newValue === null || newValue === void 0 ? void 0 : newValue.featureStates.get(feature)) &&
                        (!((_a = lastValue === null || lastValue === void 0 ? void 0 : lastValue.featureStates) === null || _a === void 0 ? void 0 : _a.get(feature)) || newValue.lineNumber !== lastValue.lineNumber);
                });
                this.audioCueService.playAudioCues(newFeatures.map(f => f.audioCue));
            }));
        }
    };
    AudioCueLineFeatureContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, audioCueService_1.IAudioCueService)
    ], AudioCueLineFeatureContribution);
    exports.AudioCueLineFeatureContribution = AudioCueLineFeatureContribution;
    let MarkerLineFeature = class MarkerLineFeature {
        constructor(audioCue, severity, markerService) {
            this.audioCue = audioCue;
            this.severity = severity;
            this.markerService = markerService;
            this.debounceWhileTyping = true;
        }
        getObservableState(editor, model) {
            return (0, observable_1.observableFromEvent)(event_1.Event.filter(this.markerService.onMarkerChanged, (changedUris) => changedUris.some((u) => u.toString() === model.uri.toString())), () => ({
                isPresent: (lineNumber) => {
                    const hasMarker = this.markerService
                        .read({ resource: model.uri })
                        .some((m) => m.severity === this.severity &&
                        m.startLineNumber <= lineNumber &&
                        lineNumber <= m.endLineNumber);
                    return hasMarker;
                },
            }));
        }
    };
    MarkerLineFeature = __decorate([
        __param(2, markers_1.IMarkerService)
    ], MarkerLineFeature);
    class FoldedAreaLineFeature {
        constructor() {
            this.audioCue = audioCueService_1.AudioCue.foldedArea;
        }
        getObservableState(editor, model) {
            var _a;
            const foldingController = folding_1.FoldingController.get(editor);
            if (!foldingController) {
                return (0, observable_1.constObservable)({
                    isPresent: () => false,
                });
            }
            const foldingModel = (0, observable_1.observableFromPromise)((_a = foldingController.getFoldingModel()) !== null && _a !== void 0 ? _a : Promise.resolve(undefined));
            return foldingModel.map((v) => ({
                isPresent: (lineNumber) => {
                    var _a;
                    const regionAtLine = (_a = v.value) === null || _a === void 0 ? void 0 : _a.getRegionAtLine(lineNumber);
                    const hasFolding = !regionAtLine
                        ? false
                        : regionAtLine.isCollapsed &&
                            regionAtLine.startLineNumber === lineNumber;
                    return hasFolding;
                },
            }));
        }
    }
    let BreakpointLineFeature = class BreakpointLineFeature {
        constructor(debugService) {
            this.debugService = debugService;
            this.audioCue = audioCueService_1.AudioCue.break;
        }
        getObservableState(editor, model) {
            return (0, observable_1.observableFromEvent)(this.debugService.getModel().onDidChangeBreakpoints, () => ({
                isPresent: (lineNumber) => {
                    const breakpoints = this.debugService
                        .getModel()
                        .getBreakpoints({ uri: model.uri, lineNumber });
                    const hasBreakpoints = breakpoints.length > 0;
                    return hasBreakpoints;
                },
            }));
        }
    };
    BreakpointLineFeature = __decorate([
        __param(0, debug_1.IDebugService)
    ], BreakpointLineFeature);
    class InlineCompletionLineFeature {
        constructor() {
            this.audioCue = audioCueService_1.AudioCue.inlineSuggestion;
        }
        getObservableState(editor, _model) {
            const ghostTextController = ghostTextController_1.GhostTextController.get(editor);
            if (!ghostTextController) {
                return (0, observable_1.constObservable)({
                    isPresent: () => false,
                });
            }
            const activeGhostText = (0, observable_1.observableFromEvent)(ghostTextController.onActiveModelDidChange, () => ghostTextController.activeModel).map((activeModel) => (activeModel
                ? (0, observable_1.observableFromEvent)(activeModel.inlineCompletionsModel.onDidChange, () => activeModel.inlineCompletionsModel.ghostText)
                : undefined));
            return (0, observable_1.derivedObservable)('ghostText', reader => {
                var _a;
                const ghostText = (_a = activeGhostText.read(reader)) === null || _a === void 0 ? void 0 : _a.read(reader);
                return {
                    isPresent(lineNumber) {
                        return (ghostText === null || ghostText === void 0 ? void 0 : ghostText.lineNumber) === lineNumber;
                    }
                };
            });
        }
    }
});
//# sourceMappingURL=audioCueLineFeatureContribution.js.map