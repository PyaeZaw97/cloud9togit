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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lazy", "vs/base/common/types", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testResult"], function (require, exports, buffer_1, lazy_1, types_1, uri_1, environment_1, files_1, instantiation_1, log_1, storage_1, workspace_1, storedValue_1, testResult_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestResultStorage = exports.InMemoryResultStorage = exports.BaseTestResultStorage = exports.ITestResultStorage = exports.RETAIN_MAX_RESULTS = void 0;
    exports.RETAIN_MAX_RESULTS = 128;
    const RETAIN_MIN_RESULTS = 16;
    const RETAIN_MAX_BYTES = 1024 * 128;
    const CLEANUP_PROBABILITY = 0.2;
    exports.ITestResultStorage = (0, instantiation_1.createDecorator)('ITestResultStorage');
    /**
     * Data revision this version of VS Code deals with. Should be bumped whenever
     * a breaking change is made to the stored results, which will cause previous
     * revisions to be discarded.
     */
    const currentRevision = 1;
    let BaseTestResultStorage = class BaseTestResultStorage {
        constructor(storageService, logService) {
            this.storageService = storageService;
            this.logService = logService;
            this.stored = new storedValue_1.StoredValue({
                key: 'storedTestResults',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */
            }, this.storageService);
        }
        /**
         * @override
         */
        async read() {
            const results = await Promise.all(this.stored.get([]).map(async ({ id, rev }) => {
                if (rev !== currentRevision) {
                    return undefined;
                }
                try {
                    const contents = await this.readForResultId(id);
                    if (!contents) {
                        return undefined;
                    }
                    return new testResult_1.HydratedTestResult(contents, () => this.readOutputForResultId(id));
                }
                catch (e) {
                    this.logService.warn(`Error deserializing stored test result ${id}`, e);
                    return undefined;
                }
            }));
            return results.filter(types_1.isDefined);
        }
        /**
         * @override
         */
        getOutputController(resultId) {
            return new testResult_1.LiveOutputController(new lazy_1.Lazy(() => {
                const stream = (0, buffer_1.newWriteableBufferStream)();
                const promise = this.storeOutputForResultId(resultId, stream);
                return [stream, promise];
            }), () => this.readOutputForResultId(resultId));
        }
        /**
         * @override
         */
        getResultOutputWriter(resultId) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            this.storeOutputForResultId(resultId, stream);
            return stream;
        }
        /**
         * @override
         */
        async persist(results) {
            const toDelete = new Map(this.stored.get([]).map(({ id, bytes }) => [id, bytes]));
            const toStore = [];
            const todo = [];
            let budget = RETAIN_MAX_BYTES;
            // Run until either:
            // 1. We store all results
            // 2. We store the max results
            // 3. We store the min results, and have no more byte budget
            for (let i = 0; i < results.length && i < exports.RETAIN_MAX_RESULTS && (budget > 0 || toStore.length < RETAIN_MIN_RESULTS); i++) {
                const result = results[i];
                const existingBytes = toDelete.get(result.id);
                if (existingBytes !== undefined) {
                    toDelete.delete(result.id);
                    toStore.push({ id: result.id, rev: currentRevision, bytes: existingBytes });
                    budget -= existingBytes;
                    continue;
                }
                const obj = result.toJSON();
                if (!obj) {
                    continue;
                }
                const contents = buffer_1.VSBuffer.fromString(JSON.stringify(obj));
                todo.push(this.storeForResultId(result.id, obj));
                toStore.push({ id: result.id, rev: currentRevision, bytes: contents.byteLength });
                budget -= contents.byteLength;
                if (result instanceof testResult_1.LiveTestResult && result.completedAt !== undefined) {
                    todo.push(result.output.close());
                }
            }
            for (const id of toDelete.keys()) {
                todo.push(this.deleteForResultId(id).catch(() => undefined));
            }
            this.stored.store(toStore);
            await Promise.all(todo);
        }
    };
    BaseTestResultStorage = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, log_1.ILogService)
    ], BaseTestResultStorage);
    exports.BaseTestResultStorage = BaseTestResultStorage;
    class InMemoryResultStorage extends BaseTestResultStorage {
        constructor() {
            super(...arguments);
            this.cache = new Map();
        }
        async readForResultId(id) {
            return Promise.resolve(this.cache.get(id));
        }
        storeForResultId(id, contents) {
            this.cache.set(id, contents);
            return Promise.resolve();
        }
        deleteForResultId(id) {
            this.cache.delete(id);
            return Promise.resolve();
        }
        readOutputForResultId(id) {
            throw new Error('Method not implemented.');
        }
        storeOutputForResultId(id, input) {
            throw new Error('Method not implemented.');
        }
    }
    exports.InMemoryResultStorage = InMemoryResultStorage;
    let TestResultStorage = class TestResultStorage extends BaseTestResultStorage {
        constructor(storageService, logService, workspaceContext, fileService, environmentService) {
            super(storageService, logService);
            this.fileService = fileService;
            this.directory = uri_1.URI.joinPath(environmentService.workspaceStorageHome, workspaceContext.getWorkspace().id, 'testResults');
        }
        async readForResultId(id) {
            const contents = await this.fileService.readFile(this.getResultJsonPath(id));
            return JSON.parse(contents.value.toString());
        }
        storeForResultId(id, contents) {
            return this.fileService.writeFile(this.getResultJsonPath(id), buffer_1.VSBuffer.fromString(JSON.stringify(contents)));
        }
        deleteForResultId(id) {
            return this.fileService.del(this.getResultJsonPath(id)).catch(() => undefined);
        }
        async readOutputForResultId(id) {
            try {
                const { value } = await this.fileService.readFileStream(this.getResultOutputPath(id));
                return value;
            }
            catch (_a) {
                return (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.alloc(0));
            }
        }
        async storeOutputForResultId(id, input) {
            await this.fileService.createFile(this.getResultOutputPath(id), input);
        }
        /**
         * @inheritdoc
         */
        async persist(results) {
            await super.persist(results);
            if (Math.random() < CLEANUP_PROBABILITY) {
                await this.cleanupDereferenced();
            }
        }
        /**
         * Cleans up orphaned files. For instance, output can get orphaned if it's
         * written but the editor is closed before the test run is complete.
         */
        async cleanupDereferenced() {
            const { children } = await this.fileService.resolve(this.directory);
            if (!children) {
                return;
            }
            const stored = new Set(this.stored.get([]).filter(s => s.rev === currentRevision).map(s => s.id));
            await Promise.all(children
                .filter(child => !stored.has(child.name.replace(/\.[a-z]+$/, '')))
                .map(child => this.fileService.del(child.resource).catch(() => undefined)));
        }
        getResultJsonPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.json`);
        }
        getResultOutputPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.output`);
        }
    };
    TestResultStorage = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, log_1.ILogService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService)
    ], TestResultStorage);
    exports.TestResultStorage = TestResultStorage;
});
//# sourceMappingURL=testResultStorage.js.map