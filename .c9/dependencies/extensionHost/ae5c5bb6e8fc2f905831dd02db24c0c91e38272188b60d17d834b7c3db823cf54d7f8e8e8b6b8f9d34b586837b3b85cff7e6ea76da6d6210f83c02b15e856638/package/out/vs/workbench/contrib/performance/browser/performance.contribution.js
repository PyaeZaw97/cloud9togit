/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, actions_1, instantiation_1, platform_1, actions_2, contributions_1, editor_1, perfviewEditor_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- startup performance view
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(perfviewEditor_1.PerfviewContrib, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(perfviewEditor_1.PerfviewInput.Id, class {
        canSerialize() {
            return true;
        }
        serialize() {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(perfviewEditor_1.PerfviewInput);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perfview.show',
                title: { value: (0, nls_1.localize)('show.label', "Startup Performance"), original: 'Startup Performance' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            return editorService.openEditor(instaService.createInstance(perfviewEditor_1.PerfviewInput), { pinned: true });
        }
    });
});
//# sourceMappingURL=performance.contribution.js.map