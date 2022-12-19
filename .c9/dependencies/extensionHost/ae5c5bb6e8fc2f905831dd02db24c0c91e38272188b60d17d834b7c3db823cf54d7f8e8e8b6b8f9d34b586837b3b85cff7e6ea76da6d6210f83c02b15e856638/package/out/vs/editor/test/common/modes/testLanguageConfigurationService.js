define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, event_1, lifecycle_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestLanguageConfigurationService = void 0;
    class TestLanguageConfigurationService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._registry = this._register(new languageConfigurationRegistry_1.LanguageConfigurationRegistry());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this._registry.onDidChange((e) => this._onDidChange.fire(new languageConfigurationRegistry_1.LanguageConfigurationServiceChangeEvent(e.languageId))));
        }
        register(languageId, configuration, priority) {
            return this._registry.register(languageId, configuration, priority);
        }
        getLanguageConfiguration(languageId) {
            var _a;
            return (_a = this._registry.getLanguageConfiguration(languageId)) !== null && _a !== void 0 ? _a : new languageConfigurationRegistry_1.ResolvedLanguageConfiguration('unknown', {});
        }
    }
    exports.TestLanguageConfigurationService = TestLanguageConfigurationService;
});
//# sourceMappingURL=testLanguageConfigurationService.js.map