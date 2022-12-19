define(["require", "exports", "assert", "vs/base/common/cancellation"], function (require, exports, assert, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CancellationToken', function () {
        test('None', () => {
            assert.strictEqual(cancellation_1.CancellationToken.None.isCancellationRequested, false);
            assert.strictEqual(typeof cancellation_1.CancellationToken.None.onCancellationRequested, 'function');
        });
        test('cancel before token', function () {
            const source = new cancellation_1.CancellationTokenSource();
            assert.strictEqual(source.token.isCancellationRequested, false);
            source.cancel();
            assert.strictEqual(source.token.isCancellationRequested, true);
            return new Promise(resolve => {
                source.token.onCancellationRequested(() => resolve());
            });
        });
        test('cancel happens only once', function () {
            let source = new cancellation_1.CancellationTokenSource();
            assert.strictEqual(source.token.isCancellationRequested, false);
            let cancelCount = 0;
            function onCancel() {
                cancelCount += 1;
            }
            source.token.onCancellationRequested(onCancel);
            source.cancel();
            source.cancel();
            assert.strictEqual(cancelCount, 1);
        });
        test('cancel calls all listeners', function () {
            let count = 0;
            let source = new cancellation_1.CancellationTokenSource();
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.cancel();
            assert.strictEqual(count, 3);
        });
        test('token stays the same', function () {
            let source = new cancellation_1.CancellationTokenSource();
            let token = source.token;
            assert.ok(token === source.token); // doesn't change on get
            source.cancel();
            assert.ok(token === source.token); // doesn't change after cancel
            source.cancel();
            assert.ok(token === source.token); // doesn't change after 2nd cancel
            source = new cancellation_1.CancellationTokenSource();
            source.cancel();
            token = source.token;
            assert.ok(token === source.token); // doesn't change on get
        });
        test('dispose calls no listeners', function () {
            let count = 0;
            let source = new cancellation_1.CancellationTokenSource();
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.dispose();
            source.cancel();
            assert.strictEqual(count, 0);
        });
        test('dispose calls no listeners (unless told to cancel)', function () {
            let count = 0;
            let source = new cancellation_1.CancellationTokenSource();
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.dispose(true);
            // source.cancel();
            assert.strictEqual(count, 1);
        });
        test('parent cancels child', function () {
            let parent = new cancellation_1.CancellationTokenSource();
            let child = new cancellation_1.CancellationTokenSource(parent.token);
            let count = 0;
            child.token.onCancellationRequested(() => count += 1);
            parent.cancel();
            assert.strictEqual(count, 1);
            assert.strictEqual(child.token.isCancellationRequested, true);
            assert.strictEqual(parent.token.isCancellationRequested, true);
        });
    });
});
//# sourceMappingURL=cancellation.test.js.map