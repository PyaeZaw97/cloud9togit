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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/format/browser/format", "vs/editor/common/core/range", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contributions", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/editor/common/languages/language", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/editor/common/config/editorConfigurationSchema", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/languageFeatures", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/base/common/uuid"], function (require, exports, editorBrowser_1, editorExtensions_1, editorContextKeys_1, nls, contextkey_1, quickInput_1, cancellation_1, instantiation_1, format_1, range_1, telemetry_1, extensions_1, platform_1, configurationRegistry_1, contributions_1, extensions_2, lifecycle_1, configuration_1, notification_1, language_1, extensionManagement_1, editorConfigurationSchema_1, dialogs_1, languageFeatures_1, languageStatusService_1, editorService_1, commands_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DefaultFormatter = class DefaultFormatter extends lifecycle_1.Disposable {
        constructor(_extensionService, _extensionEnablementService, _configService, _notificationService, _dialogService, _quickInputService, _languageService, _languageFeaturesService, _languageStatusService, _editorService) {
            super();
            this._extensionService = _extensionService;
            this._extensionEnablementService = _extensionEnablementService;
            this._configService = _configService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._quickInputService = _quickInputService;
            this._languageService = _languageService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageStatusService = _languageStatusService;
            this._editorService = _editorService;
            this._languageStatusStore = this._store.add(new lifecycle_1.DisposableStore());
            this._store.add(this._extensionService.onDidChangeExtensions(this._updateConfigValues, this));
            this._store.add(format_1.FormattingConflicts.setFormatterSelector((formatter, document, mode) => this._selectFormatter(formatter, document, mode)));
            this._store.add(_editorService.onDidActiveEditorChange(this._updateStatus, this));
            this._store.add(_languageFeaturesService.documentFormattingEditProvider.onDidChange(this._updateStatus, this));
            this._store.add(_languageFeaturesService.documentRangeFormattingEditProvider.onDidChange(this._updateStatus, this));
            this._store.add(_configService.onDidChangeConfiguration(e => e.affectsConfiguration(DefaultFormatter.configName) && this._updateStatus()));
            this._updateConfigValues();
        }
        async _updateConfigValues() {
            var _a, _b;
            let extensions = await this._extensionService.getExtensions();
            extensions = extensions.sort((a, b) => {
                var _a, _b;
                let boostA = (_a = a.categories) === null || _a === void 0 ? void 0 : _a.find(cat => cat === 'Formatters' || cat === 'Programming Languages');
                let boostB = (_b = b.categories) === null || _b === void 0 ? void 0 : _b.find(cat => cat === 'Formatters' || cat === 'Programming Languages');
                if (boostA && !boostB) {
                    return -1;
                }
                else if (!boostA && boostB) {
                    return 1;
                }
                else {
                    return a.name.localeCompare(b.name);
                }
            });
            DefaultFormatter.extensionIds.length = 0;
            DefaultFormatter.extensionItemLabels.length = 0;
            DefaultFormatter.extensionDescriptions.length = 0;
            DefaultFormatter.extensionIds.push(null);
            DefaultFormatter.extensionItemLabels.push(nls.localize('null', 'None'));
            DefaultFormatter.extensionDescriptions.push(nls.localize('nullFormatterDescription', "None"));
            for (const extension of extensions) {
                if (extension.main || extension.browser) {
                    DefaultFormatter.extensionIds.push(extension.identifier.value);
                    DefaultFormatter.extensionItemLabels.push((_a = extension.displayName) !== null && _a !== void 0 ? _a : '');
                    DefaultFormatter.extensionDescriptions.push((_b = extension.description) !== null && _b !== void 0 ? _b : '');
                }
            }
        }
        static _maybeQuotes(s) {
            return s.match(/\s/) ? `'${s}'` : s;
        }
        async _analyzeFormatter(formatter, document) {
            const defaultFormatterId = this._configService.getValue(DefaultFormatter.configName, {
                resource: document.uri,
                overrideIdentifier: document.getLanguageId()
            });
            if (defaultFormatterId) {
                // good -> formatter configured
                const defaultFormatter = formatter.find(formatter => extensions_1.ExtensionIdentifier.equals(formatter.extensionId, defaultFormatterId));
                if (defaultFormatter) {
                    // formatter available
                    return defaultFormatter;
                }
                // bad -> formatter gone
                const extension = await this._extensionService.getExtension(defaultFormatterId);
                if (extension && this._extensionEnablementService.isEnabled((0, extensions_2.toExtension)(extension))) {
                    // formatter does not target this file
                    const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
                    const detail = nls.localize('miss', "Extension '{0}' is configured as formatter but it cannot format '{1}'-files", extension.displayName || extension.name, langName);
                    return detail;
                }
            }
            else if (formatter.length === 1) {
                // ok -> nothing configured but only one formatter available
                return formatter[0];
            }
            const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
            const message = !defaultFormatterId
                ? nls.localize('config.needed', "There are multiple formatters for '{0}' files. One of them should be configured as default formatter.", DefaultFormatter._maybeQuotes(langName))
                : nls.localize('config.bad', "Extension '{0}' is configured as formatter but not available. Select a different default formatter to continue.", defaultFormatterId);
            return message;
        }
        async _selectFormatter(formatter, document, mode) {
            const formatterOrMessage = await this._analyzeFormatter(formatter, document);
            if (typeof formatterOrMessage !== 'string') {
                return formatterOrMessage;
            }
            if (mode !== 2 /* FormattingMode.Silent */) {
                // running from a user action -> show modal dialog so that users configure
                // a default formatter
                const result = await this._dialogService.confirm({
                    message: nls.localize('miss.1', "Configure Default Formatter"),
                    detail: formatterOrMessage,
                    primaryButton: nls.localize('do.config', "Configure..."),
                    secondaryButton: nls.localize('cancel', "Cancel")
                });
                if (result.confirmed) {
                    return this._pickAndPersistDefaultFormatter(formatter, document);
                }
            }
            else {
                // no user action -> show a silent notification and proceed
                this._notificationService.prompt(notification_1.Severity.Info, formatterOrMessage, [{ label: nls.localize('do.config', "Configure..."), run: () => this._pickAndPersistDefaultFormatter(formatter, document) }], { silent: true });
            }
            return undefined;
        }
        async _pickAndPersistDefaultFormatter(formatter, document) {
            const picks = formatter.map((formatter, index) => {
                return {
                    index,
                    label: formatter.displayName || (formatter.extensionId ? formatter.extensionId.value : '?'),
                    description: formatter.extensionId && formatter.extensionId.value
                };
            });
            const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
            const pick = await this._quickInputService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter._maybeQuotes(langName)) });
            if (!pick || !formatter[pick.index].extensionId) {
                return undefined;
            }
            this._configService.updateValue(DefaultFormatter.configName, formatter[pick.index].extensionId.value, {
                resource: document.uri,
                overrideIdentifier: document.getLanguageId()
            });
            return formatter[pick.index];
        }
        // --- status item
        _updateStatus() {
            this._languageStatusStore.clear();
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const document = editor.getModel();
            const formatter = (0, format_1.getRealAndSyntheticDocumentFormattersOrdered)(this._languageFeaturesService.documentFormattingEditProvider, this._languageFeaturesService.documentRangeFormattingEditProvider, document);
            if (formatter.length === 0) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            this._languageStatusStore.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            this._analyzeFormatter(formatter, document).then(result => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                if (typeof result !== 'string') {
                    return;
                }
                const command = { id: `formatter/configure/dfl/${(0, uuid_1.generateUuid)()}`, title: nls.localize('do.config', "Configure...") };
                this._languageStatusStore.add(commands_1.CommandsRegistry.registerCommand(command.id, () => this._pickAndPersistDefaultFormatter(formatter, document)));
                this._languageStatusStore.add(this._languageStatusService.addStatus({
                    id: 'formatter.conflict',
                    name: nls.localize('summary', "Formatter Conflicts"),
                    selector: { language: document.getLanguageId(), pattern: document.uri.fsPath },
                    severity: notification_1.Severity.Error,
                    label: nls.localize('formatter', "Formatting"),
                    detail: result,
                    busy: false,
                    source: '',
                    command,
                    accessibilityInfo: undefined
                }));
            });
        }
    };
    DefaultFormatter.configName = 'editor.defaultFormatter';
    DefaultFormatter.extensionIds = [];
    DefaultFormatter.extensionItemLabels = [];
    DefaultFormatter.extensionDescriptions = [];
    DefaultFormatter = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, language_1.ILanguageService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, languageStatusService_1.ILanguageStatusService),
        __param(9, editorService_1.IEditorService)
    ], DefaultFormatter);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DefaultFormatter, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(Object.assign(Object.assign({}, editorConfigurationSchema_1.editorConfigurationBaseNode), { properties: {
            [DefaultFormatter.configName]: {
                description: nls.localize('formatter.default', "Defines a default formatter which takes precedence over all other formatter settings. Must be the identifier of an extension contributing a formatter."),
                type: ['string', 'null'],
                default: null,
                enum: DefaultFormatter.extensionIds,
                enumItemLabels: DefaultFormatter.extensionItemLabels,
                markdownEnumDescriptions: DefaultFormatter.extensionDescriptions
            }
        } }));
    function logFormatterTelemetry(telemetryService, mode, options, pick) {
        function extKey(obj) {
            return obj.extensionId ? extensions_1.ExtensionIdentifier.toKey(obj.extensionId) : 'unknown';
        }
        /*
         * __GDPR__
            "formatterpick" : {
                "mode" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "extensions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "pick" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            }
         */
        telemetryService.publicLog('formatterpick', {
            mode,
            extensions: options.map(extKey),
            pick: pick ? extKey(pick) : 'none'
        });
    }
    async function showFormatterPick(accessor, model, formatters) {
        const quickPickService = accessor.get(quickInput_1.IQuickInputService);
        const configService = accessor.get(configuration_1.IConfigurationService);
        const languageService = accessor.get(language_1.ILanguageService);
        const overrides = { resource: model.uri, overrideIdentifier: model.getLanguageId() };
        const defaultFormatter = configService.getValue(DefaultFormatter.configName, overrides);
        let defaultFormatterPick;
        const picks = formatters.map((provider, index) => {
            const isDefault = extensions_1.ExtensionIdentifier.equals(provider.extensionId, defaultFormatter);
            const pick = {
                index,
                label: provider.displayName || '',
                description: isDefault ? nls.localize('def', "(default)") : undefined,
            };
            if (isDefault) {
                // autofocus default pick
                defaultFormatterPick = pick;
            }
            return pick;
        });
        const configurePick = {
            label: nls.localize('config', "Configure Default Formatter...")
        };
        const pick = await quickPickService.pick([...picks, { type: 'separator' }, configurePick], {
            placeHolder: nls.localize('format.placeHolder', "Select a formatter"),
            activeItem: defaultFormatterPick
        });
        if (!pick) {
            // dismissed
            return undefined;
        }
        else if (pick === configurePick) {
            // config default
            const langName = languageService.getLanguageName(model.getLanguageId()) || model.getLanguageId();
            const pick = await quickPickService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter._maybeQuotes(langName)) });
            if (pick && formatters[pick.index].extensionId) {
                configService.updateValue(DefaultFormatter.configName, formatters[pick.index].extensionId.value, overrides);
            }
            return undefined;
        }
        else {
            // picked one
            return pick.index;
        }
    }
    (0, editorExtensions_1.registerEditorAction)(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.multiple',
                label: nls.localize('formatDocument.label.multiple', "Format Document With..."),
                alias: 'Format Document...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasMultipleDocumentFormattingProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const model = editor.getModel();
            const provider = (0, format_1.getRealAndSyntheticDocumentFormattersOrdered)(languageFeaturesService.documentFormattingEditProvider, languageFeaturesService.documentRangeFormattingEditProvider, model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentWithProvider, provider[pick], editor, 1 /* FormattingMode.Explicit */, cancellation_1.CancellationToken.None);
            }
            logFormatterTelemetry(telemetryService, 'document', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class FormatSelectionMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection.multiple',
                label: nls.localize('formatSelection.label.multiple', "Format Selection With..."),
                alias: 'Format Code...',
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable), editorContextKeys_1.EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider),
                contextMenuOpts: {
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const model = editor.getModel();
            let range = editor.getSelection();
            if (range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber));
            }
            const provider = languageFeaturesService.documentRangeFormattingEditProvider.ordered(model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentRangesWithProvider, provider[pick], editor, range, cancellation_1.CancellationToken.None);
            }
            logFormatterTelemetry(telemetryService, 'range', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
});
//# sourceMappingURL=formatActionsMultiple.js.map