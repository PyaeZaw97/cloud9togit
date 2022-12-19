define(["require", "exports", "assert", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService"], function (require, exports, assert, testConfigurationService_1, contextKeyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ContextKeyService', () => {
        test('updateParent', () => {
            const root = new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService());
            const parent1 = root.createScoped(document.createElement('div'));
            const parent2 = root.createScoped(document.createElement('div'));
            const child = parent1.createScoped(document.createElement('div'));
            parent1.createKey('testA', 1);
            parent1.createKey('testB', 2);
            parent1.createKey('testD', 0);
            parent2.createKey('testA', 3);
            parent2.createKey('testC', 4);
            parent2.createKey('testD', 0);
            let complete;
            let reject;
            const p = new Promise((_complete, _reject) => {
                complete = _complete;
                reject = _reject;
            });
            child.onDidChangeContext(e => {
                try {
                    assert.ok(e.affectsSome(new Set(['testA'])), 'testA changed');
                    assert.ok(e.affectsSome(new Set(['testB'])), 'testB changed');
                    assert.ok(e.affectsSome(new Set(['testC'])), 'testC changed');
                    assert.ok(!e.affectsSome(new Set(['testD'])), 'testD did not change');
                    assert.strictEqual(child.getContextKeyValue('testA'), 3);
                    assert.strictEqual(child.getContextKeyValue('testB'), undefined);
                    assert.strictEqual(child.getContextKeyValue('testC'), 4);
                    assert.strictEqual(child.getContextKeyValue('testD'), 0);
                }
                catch (err) {
                    reject(err);
                    return;
                }
                complete();
            });
            child.updateParent(parent2);
            return p;
        });
    });
});
//# sourceMappingURL=contextkey.test.js.map