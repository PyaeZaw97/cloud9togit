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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/extensions/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/platform/native/electron-sandbox/native", "vs/platform/product/common/productService", "vs/platform/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, resources_1, resolverService_1, dialogs_1, environmentService_1, lifecycle_1, perfviewEditor_1, extensions_1, clipboardService_1, uri_1, opener_1, native_1, productService_1, files_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupProfiler = void 0;
    let StartupProfiler = class StartupProfiler {
        constructor(_dialogService, _environmentService, _textModelResolverService, _clipboardService, lifecycleService, extensionService, _openerService, _nativeHostService, _productService, _fileService, _labelService) {
            this._dialogService = _dialogService;
            this._environmentService = _environmentService;
            this._textModelResolverService = _textModelResolverService;
            this._clipboardService = _clipboardService;
            this._openerService = _openerService;
            this._nativeHostService = _nativeHostService;
            this._productService = _productService;
            this._fileService = _fileService;
            this._labelService = _labelService;
            // wait for everything to be ready
            Promise.all([
                lifecycleService.when(4 /* LifecyclePhase.Eventually */),
                extensionService.whenInstalledExtensionsRegistered()
            ]).then(() => {
                this._stopProfiling();
            });
        }
        _stopProfiling() {
            if (!this._environmentService.args['prof-startup-prefix']) {
                return;
            }
            const profileFilenamePrefix = uri_1.URI.file(this._environmentService.args['prof-startup-prefix']);
            const dir = (0, resources_1.dirname)(profileFilenamePrefix);
            const prefix = (0, resources_1.basename)(profileFilenamePrefix);
            const removeArgs = ['--prof-startup'];
            const markerFile = this._fileService.readFile(profileFilenamePrefix).then(value => removeArgs.push(...value.toString().split('|')))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })) // (1) delete the file to tell the main process to stop profiling
                .then(() => new Promise(resolve => {
                const check = () => {
                    this._fileService.exists(profileFilenamePrefix).then(exists => {
                        if (exists) {
                            resolve();
                        }
                        else {
                            setTimeout(check, 500);
                        }
                    });
                };
                check();
            }))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })); // (3) finally delete the file again
            markerFile.then(() => {
                return this._fileService.resolve(dir).then(stat => {
                    return (stat.children ? stat.children.filter(value => value.resource.path.includes(prefix)) : []).map(stat => stat.resource.path);
                });
            }).then(files => {
                const profileFiles = files.reduce((prev, cur) => `${prev}${this._labelService.getUriLabel((0, resources_1.joinPath)(dir, cur))}\n`, '\n');
                return this._dialogService.confirm({
                    type: 'info',
                    message: (0, nls_1.localize)('prof.message', "Successfully created profiles."),
                    detail: (0, nls_1.localize)('prof.detail', "Please create an issue and manually attach the following files:\n{0}", profileFiles),
                    primaryButton: (0, nls_1.localize)('prof.restartAndFileIssue', "&&Create Issue and Restart"),
                    secondaryButton: (0, nls_1.localize)('prof.restart', "&&Restart")
                }).then(res => {
                    if (res.confirmed) {
                        Promise.all([
                            this._nativeHostService.showItemInFolder(uri_1.URI.joinPath(dir, files[0]).fsPath),
                            this._createPerfIssue(files)
                        ]).then(() => {
                            // keep window stable until restart is selected
                            return this._dialogService.confirm({
                                type: 'info',
                                message: (0, nls_1.localize)('prof.thanks', "Thanks for helping us."),
                                detail: (0, nls_1.localize)('prof.detail.restart', "A final restart is required to continue to use '{0}'. Again, thank you for your contribution.", this._productService.nameLong),
                                primaryButton: (0, nls_1.localize)('prof.restart.button', "&&Restart"),
                                secondaryButton: undefined
                            }).then(() => {
                                // now we are ready to restart
                                this._nativeHostService.relaunch({ removeArgs });
                            });
                        });
                    }
                    else {
                        // simply restart
                        this._nativeHostService.relaunch({ removeArgs });
                    }
                });
            });
        }
        async _createPerfIssue(files) {
            const reportIssueUrl = this._productService.reportIssueUrl;
            if (!reportIssueUrl) {
                return;
            }
            const ref = await this._textModelResolverService.createModelReference(perfviewEditor_1.PerfviewInput.Uri);
            try {
                await this._clipboardService.writeText(ref.object.textEditorModel.getValue());
            }
            finally {
                ref.dispose();
            }
            const body = `
1. :warning: We have copied additional data to your clipboard. Make sure to **paste** here. :warning:
1. :warning: Make sure to **attach** these files from your *home*-directory: :warning:\n${files.map(file => `-\`${file}\``).join('\n')}
`;
            const baseUrl = reportIssueUrl;
            const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
            this._openerService.open(uri_1.URI.parse(`${baseUrl}${queryStringPrefix}body=${encodeURIComponent(body)}`));
        }
    };
    StartupProfiler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, lifecycle_1.ILifecycleService),
        __param(5, extensions_1.IExtensionService),
        __param(6, opener_1.IOpenerService),
        __param(7, native_1.INativeHostService),
        __param(8, productService_1.IProductService),
        __param(9, files_1.IFileService),
        __param(10, label_1.ILabelService)
    ], StartupProfiler);
    exports.StartupProfiler = StartupProfiler;
});
//# sourceMappingURL=startupProfiler.js.map