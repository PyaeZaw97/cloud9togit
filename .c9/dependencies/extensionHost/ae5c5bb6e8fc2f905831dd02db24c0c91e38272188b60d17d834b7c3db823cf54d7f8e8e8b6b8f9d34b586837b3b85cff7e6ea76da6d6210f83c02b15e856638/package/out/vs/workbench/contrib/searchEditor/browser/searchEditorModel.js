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
define(["require", "exports", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/types", "vs/editor/common/model/textModel", "vs/workbench/contrib/searchEditor/browser/constants", "vs/base/common/event", "vs/base/common/map"], function (require, exports, model_1, language_1, instantiation_1, searchEditorSerialization_1, workingCopyBackup_1, types_1, textModel_1, constants_1, event_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.searchEditorModelFactory = exports.SearchEditorModel = exports.SearchConfigurationModel = void 0;
    class SearchConfigurationModel {
        constructor(config) {
            this.config = config;
            this._onConfigDidUpdate = new event_1.Emitter();
            this.onConfigDidUpdate = this._onConfigDidUpdate.event;
        }
        updateConfig(config) { this.config = config; this._onConfigDidUpdate.fire(config); }
    }
    exports.SearchConfigurationModel = SearchConfigurationModel;
    let SearchEditorModel = class SearchEditorModel {
        constructor(resource, workingCopyBackupService) {
            this.resource = resource;
            this.workingCopyBackupService = workingCopyBackupService;
        }
        async resolve() {
            return (0, types_1.assertIsDefined)(exports.searchEditorModelFactory.models.get(this.resource)).resolve();
        }
    };
    SearchEditorModel = __decorate([
        __param(1, workingCopyBackup_1.IWorkingCopyBackupService)
    ], SearchEditorModel);
    exports.SearchEditorModel = SearchEditorModel;
    class SearchEditorModelFactory {
        constructor() {
            this.models = new map_1.ResourceMap();
        }
        initializeModelFromExistingModel(accessor, resource, config) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            var _a;
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            return Promise.resolve({
                                resultsModel: (_a = modelService.getModel(resource)) !== null && _a !== void 0 ? _a : modelService.createModel('', languageService.createById('search-result'), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        initializeModelFromRawData(accessor, resource, config, contents) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            return Promise.resolve({
                                resultsModel: modelService.createModel(contents !== null && contents !== void 0 ? contents : '', languageService.createById('search-result'), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        initializeModelFromExistingFile(accessor, resource, existingFile) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: async () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            const { text, config } = await instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, existingFile);
                            return ({
                                resultsModel: modelService.createModel(text !== null && text !== void 0 ? text : '', languageService.createById('search-result'), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        async tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService) {
            const backup = await workingCopyBackupService.resolve({ resource, typeId: constants_1.SearchEditorWorkingCopyTypeId });
            let model = modelService.getModel(resource);
            if (!model && backup) {
                const factory = await (0, textModel_1.createTextBufferFactoryFromStream)(backup.value);
                model = modelService.createModel(factory, languageService.createById('search-result'), resource);
            }
            if (model) {
                const existingFile = model.getValue();
                const { text, config } = (0, searchEditorSerialization_1.parseSerializedSearchEditor)(existingFile);
                modelService.destroyModel(resource);
                return ({
                    resultsModel: modelService.createModel(text !== null && text !== void 0 ? text : '', languageService.createById('search-result'), resource),
                    configurationModel: new SearchConfigurationModel(config)
                });
            }
            else {
                return undefined;
            }
        }
    }
    exports.searchEditorModelFactory = new SearchEditorModelFactory();
});
//# sourceMappingURL=searchEditorModel.js.map