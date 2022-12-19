/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/browser/dom", "vs/workbench/contrib/debug/common/debugModel", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/debug/test/browser/callStack.test", "vs/workbench/contrib/debug/browser/statusbarColorProvider", "vs/base/common/platform", "vs/workbench/contrib/debug/test/browser/mockDebug", "vs/base/common/lifecycle"], function (require, exports, assert, baseDebugView_1, dom, debugModel_1, highlightedLabel_1, linkDetector_1, workbenchTestServices_1, callStack_test_1, statusbarColorProvider_1, platform_1, mockDebug_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    suite('Debug - Base Debug View', () => {
        let disposables;
        let linkDetector;
        /**
         * Instantiate services for use by the functions being tested.
         */
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            linkDetector = instantiationService.createInstance(linkDetector_1.LinkDetector);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('render view tree', () => {
            const container = $('.container');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            assert.strictEqual(treeContainer.className, 'debug-view-content');
            assert.strictEqual(container.childElementCount, 1);
            assert.strictEqual(container.firstChild, treeContainer);
            assert.strictEqual(treeContainer instanceof HTMLDivElement, true);
        });
        test('render expression value', () => {
            let container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)('render \n me', container, { showHover: true });
            assert.strictEqual(container.className, 'value');
            assert.strictEqual(container.title, 'render \n me');
            assert.strictEqual(container.textContent, 'render \n me');
            const expression = new debugModel_1.Expression('console');
            expression.value = 'Object';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true });
            assert.strictEqual(container.className, 'value unavailable error');
            expression.available = true;
            expression.value = '"string value"';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, linkDetector });
            assert.strictEqual(container.className, 'value string');
            assert.strictEqual(container.textContent, '"string value"');
            expression.type = 'boolean';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true });
            assert.strictEqual(container.className, 'value boolean');
            assert.strictEqual(container.textContent, expression.value);
            expression.value = 'this is a long string';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, maxValueLength: 4, linkDetector });
            assert.strictEqual(container.textContent, 'this...');
            expression.value = platform_1.isWindows ? 'C:\\foo.js:5' : '/foo.js:5';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, linkDetector });
            assert.ok(container.querySelector('a'));
            assert.strictEqual(container.querySelector('a').textContent, expression.value);
        });
        test('render variable', () => {
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const stackFrame = new debugModel_1.StackFrame(thread, 1, null, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: undefined, endColumn: undefined }, 0, true);
            const scope = new debugModel_1.Scope(stackFrame, 1, 'local', 1, false, 10, 10);
            let variable = new debugModel_1.Variable(session, 1, scope, 2, 'foo', 'bar.foo', undefined, 0, 0, undefined, {}, 'string');
            let expression = $('.');
            let name = $('.');
            let value = $('.');
            const label = new highlightedLabel_1.HighlightedLabel(name);
            let lazyButton = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, []);
            assert.strictEqual(label.element.textContent, 'foo');
            assert.strictEqual(value.textContent, '');
            assert.strictEqual(value.title, '');
            variable.value = 'hey';
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.strictEqual(value.textContent, 'hey');
            assert.strictEqual(label.element.textContent, 'foo:');
            assert.strictEqual(label.element.title, 'string');
            variable.value = platform_1.isWindows ? 'C:\\foo.js:5' : '/foo.js:5';
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.ok(value.querySelector('a'));
            assert.strictEqual(value.querySelector('a').textContent, variable.value);
            variable = new debugModel_1.Variable(session, 1, scope, 2, 'console', 'console', '5', 0, 0, undefined, { kind: 'virtual' });
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.strictEqual(name.className, 'virtual');
            assert.strictEqual(label.element.textContent, 'console:');
            assert.strictEqual(label.element.title, 'console');
            assert.strictEqual(value.className, 'value number');
        });
        test('statusbar in debug mode', () => {
            const model = (0, mockDebug_1.createMockDebugModel)();
            const session = (0, callStack_test_1.createMockSession)(model);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(0 /* State.Inactive */, undefined), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(1 /* State.Initializing */, session), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, session), true);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(2 /* State.Stopped */, session), true);
            session.configuration.noDebug = true;
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, session), false);
        });
    });
});
//# sourceMappingURL=baseDebugView.test.js.map