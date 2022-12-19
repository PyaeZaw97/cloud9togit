var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "assert", "fs", "vs/base/common/platform", "vs/base/node/powershell"], function (require, exports, assert, fs, platform, powershell_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function checkPath(exePath) {
        // Check to see if the path exists
        let pathCheckResult = false;
        try {
            const stat = fs.statSync(exePath);
            pathCheckResult = stat.isFile();
        }
        catch (_a) {
            // fs.exists throws on Windows with SymbolicLinks so we
            // also use lstat to try and see if the file exists.
            try {
                pathCheckResult = fs.statSync(fs.readlinkSync(exePath)).isFile();
            }
            catch (_b) {
            }
        }
        assert.strictEqual(pathCheckResult, true);
    }
    if (platform.isWindows) {
        suite('PowerShell finder', () => {
            test('Can find first available PowerShell', async () => {
                const pwshExe = await (0, powershell_1.getFirstAvailablePowerShellInstallation)();
                const exePath = pwshExe === null || pwshExe === void 0 ? void 0 : pwshExe.exePath;
                assert.notStrictEqual(exePath, null);
                assert.notStrictEqual(pwshExe === null || pwshExe === void 0 ? void 0 : pwshExe.displayName, null);
                checkPath(exePath);
            });
            test('Can enumerate PowerShells', async () => {
                var e_1, _a;
                const pwshs = new Array();
                try {
                    for (var _b = __asyncValues((0, powershell_1.enumeratePowerShellInstallations)()), _c; _c = await _b.next(), !_c.done;) {
                        const p = _c.value;
                        pwshs.push(p);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const powershellLog = 'Found these PowerShells:\n' + pwshs.map(p => `${p.displayName}: ${p.exePath}`).join('\n');
                assert.strictEqual(pwshs.length >= 1, true, powershellLog);
                for (const pwsh of pwshs) {
                    checkPath(pwsh.exePath);
                }
                // The last one should always be Windows PowerShell.
                assert.strictEqual(pwshs[pwshs.length - 1].displayName, 'Windows PowerShell', powershellLog);
            });
        });
    }
});
//# sourceMappingURL=powershell.test.js.map