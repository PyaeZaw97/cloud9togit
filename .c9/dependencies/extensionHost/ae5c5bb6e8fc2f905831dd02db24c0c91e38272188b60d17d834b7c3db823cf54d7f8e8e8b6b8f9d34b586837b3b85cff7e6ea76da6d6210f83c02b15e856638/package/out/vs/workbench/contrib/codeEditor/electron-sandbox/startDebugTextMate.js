/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/textMate/browser/textMate", "vs/editor/common/services/model", "vs/workbench/services/editor/common/editorService", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/log/common/log", "vs/base/common/resources", "vs/platform/files/common/files"], function (require, exports, nls, range_1, actions_1, actions_2, textMate_1, model_1, editorService_1, uri_1, uuid_1, codeEditorService_1, host_1, environmentService_1, log_1, resources_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StartDebugTextMate extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.startDebugTextMate',
                title: { value: nls.localize('startDebugTextMate', "Start Text Mate Syntax Grammar Logging"), original: 'Start Text Mate Syntax Grammar Logging' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        _getOrCreateModel(modelService) {
            const model = modelService.getModel(StartDebugTextMate.resource);
            if (model) {
                return model;
            }
            return modelService.createModel('', null, StartDebugTextMate.resource);
        }
        _append(model, str) {
            const lineCount = model.getLineCount();
            model.applyEdits([{
                    range: new range_1.Range(lineCount, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, lineCount, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                    text: str
                }]);
        }
        async run(accessor) {
            const textMateService = accessor.get(textMate_1.ITextMateService);
            const modelService = accessor.get(model_1.IModelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environmentService_1.INativeWorkbenchEnvironmentService);
            const loggerService = accessor.get(log_1.ILoggerService);
            const fileService = accessor.get(files_1.IFileService);
            const pathInTemp = (0, resources_1.joinPath)(environmentService.tmpDir, `vcode-tm-log-${(0, uuid_1.generateUuid)()}.txt`);
            await fileService.createFile(pathInTemp);
            const logger = loggerService.createLogger(pathInTemp, { name: 'debug textmate' });
            const model = this._getOrCreateModel(modelService);
            const append = (str) => {
                this._append(model, str + '\n');
                scrollEditor();
                logger.info(str);
                logger.flush();
            };
            await hostService.openWindow([{ fileUri: pathInTemp }], { forceNewWindow: true });
            const textEditorPane = await editorService.openEditor({
                resource: model.uri,
                options: { pinned: true }
            });
            if (!textEditorPane) {
                return;
            }
            const scrollEditor = () => {
                const editors = codeEditorService.listCodeEditors();
                for (const editor of editors) {
                    if (editor.hasModel()) {
                        if (editor.getModel().uri.toString() === StartDebugTextMate.resource.toString()) {
                            editor.revealLine(editor.getModel().getLineCount());
                        }
                    }
                }
            };
            append(`// Open the file you want to test to the side and watch here`);
            append(`// Output mirrored at ${pathInTemp}`);
            textMateService.startDebugMode((str) => {
                this._append(model, str + '\n');
                scrollEditor();
                logger.info(str);
                logger.flush();
            }, () => {
            });
        }
    }
    StartDebugTextMate.resource = uri_1.URI.parse(`inmemory:///tm-log.txt`);
    (0, actions_1.registerAction2)(StartDebugTextMate);
});
//# sourceMappingURL=startDebugTextMate.js.map