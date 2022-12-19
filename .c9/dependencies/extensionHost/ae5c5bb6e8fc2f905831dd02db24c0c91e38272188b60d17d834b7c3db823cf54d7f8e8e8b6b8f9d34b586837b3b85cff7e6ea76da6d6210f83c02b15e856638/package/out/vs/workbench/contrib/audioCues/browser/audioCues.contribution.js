/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/audioCues/browser/audioCueDebuggerContribution", "vs/workbench/contrib/audioCues/browser/audioCueLineFeatureContribution", "vs/workbench/contrib/audioCues/browser/audioCueService", "vs/workbench/contrib/audioCues/browser/commands"], function (require, exports, nls_1, actions_1, configurationRegistry_1, extensions_1, platform_1, contributions_1, audioCueDebuggerContribution_1, audioCueLineFeatureContribution_1, audioCueService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(audioCueService_1.IAudioCueService, audioCueService_1.AudioCueService);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(audioCueLineFeatureContribution_1.AudioCueLineFeatureContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(audioCueDebuggerContribution_1.AudioCueLineDebuggerContribution, 3 /* LifecyclePhase.Restored */);
    const audioCueFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'on', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('audioCues.enabled.auto', "Enable audio cue when a screen reader is attached."),
            (0, nls_1.localize)('audioCues.enabled.on', "Enable audio cue."),
            (0, nls_1.localize)('audioCues.enabled.off', "Disable audio cue.")
        ],
    };
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'properties': {
            'audioCues.enabled': {
                markdownDeprecationMessage: 'Deprecated. Use the specific setting for each audio cue instead (`audioCues.*`).',
            },
            'audioCues.volume': {
                'description': (0, nls_1.localize)('audioCues.volume', "The volume of the audio cues in percent (0-100)."),
                'type': 'number',
                'minimum': 0,
                'maximum': 100,
                'default': 70
            },
            'audioCues.lineHasBreakpoint': Object.assign({ 'description': (0, nls_1.localize)('audioCues.lineHasBreakpoint', "Plays a sound when the active line has a breakpoint.") }, audioCueFeatureBase),
            'audioCues.lineHasInlineSuggestion': Object.assign({ 'description': (0, nls_1.localize)('audioCues.lineHasInlineSuggestion', "Plays a sound when the active line has an inline suggestion.") }, audioCueFeatureBase),
            'audioCues.lineHasError': Object.assign({ 'description': (0, nls_1.localize)('audioCues.lineHasError', "Plays a sound when the active line has an error.") }, audioCueFeatureBase),
            'audioCues.lineHasFoldedArea': Object.assign({ 'description': (0, nls_1.localize)('audioCues.lineHasFoldedArea', "Plays a sound when the active line has a folded area that can be unfolded.") }, audioCueFeatureBase),
            'audioCues.lineHasWarning': Object.assign(Object.assign({ 'description': (0, nls_1.localize)('audioCues.lineHasWarning', "Plays a sound when the active line has a warning.") }, audioCueFeatureBase), { default: 'off' }),
            'audioCues.onDebugBreak': Object.assign({ 'description': (0, nls_1.localize)('audioCues.onDebugBreak', "Plays a sound when the debugger stopped on a breakpoint.") }, audioCueFeatureBase),
            'audioCues.noInlayHints': Object.assign({ 'description': (0, nls_1.localize)('audioCues.noInlayHints', "Plays a sound when trying to read a line with inlay hints that has no inlay hints.") }, audioCueFeatureBase),
        }
    });
    (0, actions_1.registerAction2)(commands_1.ShowAudioCueHelp);
});
//# sourceMappingURL=audioCues.contribution.js.map