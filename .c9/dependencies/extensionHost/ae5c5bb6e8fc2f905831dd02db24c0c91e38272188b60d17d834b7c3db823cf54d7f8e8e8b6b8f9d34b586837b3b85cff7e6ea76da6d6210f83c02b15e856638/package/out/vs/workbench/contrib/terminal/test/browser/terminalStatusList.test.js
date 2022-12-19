/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons", "vs/base/common/severity", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalStatusList"], function (require, exports, assert_1, codicons_1, severity_1, testConfigurationService_1, iconRegistry_1, themeService_1, terminalStatusList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function statusesEqual(list, expected) {
        (0, assert_1.deepStrictEqual)(list.statuses.map(e => [e.id, e.severity]), expected);
    }
    suite('Workbench - TerminalStatusList', () => {
        let list;
        let configService;
        setup(() => {
            configService = new testConfigurationService_1.TestConfigurationService();
            list = new terminalStatusList_1.TerminalStatusList(configService);
        });
        teardown(() => {
            list.dispose();
        });
        test('primary', () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            (0, assert_1.strictEqual)((_a = list.primary) === null || _a === void 0 ? void 0 : _a.id, undefined);
            list.add({ id: 'info1', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)((_b = list.primary) === null || _b === void 0 ? void 0 : _b.id, 'info1');
            list.add({ id: 'warning1', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)((_c = list.primary) === null || _c === void 0 ? void 0 : _c.id, 'warning1');
            list.add({ id: 'info2', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)((_d = list.primary) === null || _d === void 0 ? void 0 : _d.id, 'warning1');
            list.add({ id: 'warning2', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)((_e = list.primary) === null || _e === void 0 ? void 0 : _e.id, 'warning2');
            list.add({ id: 'info3', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)((_f = list.primary) === null || _f === void 0 ? void 0 : _f.id, 'warning2');
            list.add({ id: 'error1', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)((_g = list.primary) === null || _g === void 0 ? void 0 : _g.id, 'error1');
            list.add({ id: 'warning3', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)((_h = list.primary) === null || _h === void 0 ? void 0 : _h.id, 'error1');
            list.add({ id: 'error2', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)((_j = list.primary) === null || _j === void 0 ? void 0 : _j.id, 'error2');
            list.remove('error1');
            (0, assert_1.strictEqual)((_k = list.primary) === null || _k === void 0 ? void 0 : _k.id, 'error2');
            list.remove('error2');
            (0, assert_1.strictEqual)((_l = list.primary) === null || _l === void 0 ? void 0 : _l.id, 'warning3');
        });
        test('statuses', () => {
            (0, assert_1.strictEqual)(list.statuses.length, 0);
            list.add({ id: 'info', severity: severity_1.default.Info });
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            list.add({ id: 'error', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)(list.statuses.length, 3);
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error],
            ]);
            list.remove('info');
            list.remove('warning');
            list.remove('error');
            (0, assert_1.strictEqual)(list.statuses.length, 0);
        });
        test('onDidAddStatus', async () => {
            const result = await new Promise(r => {
                list.onDidAddStatus(r);
                list.add({ id: 'test', severity: severity_1.default.Info });
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('onDidRemoveStatus', async () => {
            const result = await new Promise(r => {
                list.onDidRemoveStatus(r);
                list.add({ id: 'test', severity: severity_1.default.Info });
                list.remove('test');
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('onDidChangePrimaryStatus', async () => {
            const result = await new Promise(r => {
                list.onDidRemoveStatus(r);
                list.add({ id: 'test', severity: severity_1.default.Info });
                list.remove('test');
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('add', () => {
            statusesEqual(list, []);
            list.add({ id: 'info', severity: severity_1.default.Info });
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning]
            ]);
            list.add({ id: 'error', severity: severity_1.default.Error });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error]
            ]);
        });
        test('add should remove animation', () => {
            statusesEqual(list, []);
            list.add({ id: 'info', severity: severity_1.default.Info, icon: iconRegistry_1.spinningLoading });
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            (0, assert_1.strictEqual)(list.statuses[0].icon.id, codicons_1.Codicon.play.id, 'loading~spin should be converted to play');
            list.add({ id: 'warning', severity: severity_1.default.Warning, icon: themeService_1.ThemeIcon.modify(codicons_1.Codicon.zap, 'spin') });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning]
            ]);
            (0, assert_1.strictEqual)(list.statuses[1].icon.id, codicons_1.Codicon.zap.id, 'zap~spin should have animation removed only');
        });
        test('remove', () => {
            list.add({ id: 'info', severity: severity_1.default.Info });
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            list.add({ id: 'error', severity: severity_1.default.Error });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error]
            ]);
            list.remove('warning');
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['error', severity_1.default.Error]
            ]);
            list.remove('info');
            statusesEqual(list, [
                ['error', severity_1.default.Error]
            ]);
            list.remove('error');
            statusesEqual(list, []);
        });
        test('toggle', () => {
            const status = { id: 'info', severity: severity_1.default.Info };
            list.toggle(status, true);
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            list.toggle(status, false);
            statusesEqual(list, []);
        });
    });
});
//# sourceMappingURL=terminalStatusList.test.js.map