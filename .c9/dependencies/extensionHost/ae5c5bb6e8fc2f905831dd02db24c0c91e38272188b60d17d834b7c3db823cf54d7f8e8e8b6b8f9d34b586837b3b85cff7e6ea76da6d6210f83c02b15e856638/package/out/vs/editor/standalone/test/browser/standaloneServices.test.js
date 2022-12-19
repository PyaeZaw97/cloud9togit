/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/standalone/browser/standaloneThemeService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, standaloneServices_1, standaloneCodeEditorService_1, standaloneThemeService_1, contextKeyService_1, instantiationService_1, serviceCollection_1, log_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StandaloneKeybindingService', () => {
        class TestStandaloneKeybindingService extends standaloneServices_1.StandaloneKeybindingService {
            testDispatch(e) {
                super._dispatch(e, null);
            }
        }
        test('issue microsoft/monaco-editor#167', () => {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            const configurationService = new standaloneServices_1.StandaloneConfigurationService();
            const contextKeyService = new contextKeyService_1.ContextKeyService(configurationService);
            const commandService = new standaloneServices_1.StandaloneCommandService(instantiationService);
            const notificationService = new standaloneServices_1.StandaloneNotificationService();
            const standaloneThemeService = new standaloneThemeService_1.StandaloneThemeService();
            const codeEditorService = new standaloneCodeEditorService_1.StandaloneCodeEditorService(contextKeyService, standaloneThemeService);
            const keybindingService = new TestStandaloneKeybindingService(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService, new log_1.NullLogService(), codeEditorService);
            let commandInvoked = false;
            keybindingService.addDynamicKeybinding('testCommand', 67 /* KeyCode.F9 */, () => {
                commandInvoked = true;
            }, undefined);
            keybindingService.testDispatch({
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                keyCode: 67 /* KeyCode.F9 */,
                code: null
            });
            assert.ok(commandInvoked, 'command invoked');
        });
    });
});
//# sourceMappingURL=standaloneServices.test.js.map