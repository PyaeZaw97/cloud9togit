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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/map", "vs/base/common/stream", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/hash", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopy"], function (require, exports, resources_1, uri_1, arrays_1, objects_1, async_1, files_1, map_1, stream_1, buffer_1, lifecycle_1, log_1, network_1, hash_1, types_1, workingCopy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hashIdentifier = exports.InMemoryWorkingCopyBackupService = exports.WorkingCopyBackupService = exports.WorkingCopyBackupsModel = void 0;
    class WorkingCopyBackupsModel {
        constructor(backupRoot, fileService) {
            this.backupRoot = backupRoot;
            this.fileService = fileService;
            this.cache = new map_1.ResourceMap();
        }
        static async create(backupRoot, fileService) {
            const model = new WorkingCopyBackupsModel(backupRoot, fileService);
            await model.resolve();
            return model;
        }
        async resolve() {
            try {
                const backupRootStat = await this.fileService.resolve(this.backupRoot);
                if (backupRootStat.children) {
                    await async_1.Promises.settled(backupRootStat.children
                        .filter(child => child.isDirectory)
                        .map(async (backupSchemaFolder) => {
                        // Read backup directory for backups
                        const backupSchemaFolderStat = await this.fileService.resolve(backupSchemaFolder.resource);
                        // Remember known backups in our caches
                        //
                        // Note: this does NOT account for resolving
                        // associated meta data because that requires
                        // opening the backup and reading the meta
                        // preamble. Instead, when backups are actually
                        // resolved, the meta data will be added via
                        // additional `update` calls.
                        if (backupSchemaFolderStat.children) {
                            for (const backupForSchema of backupSchemaFolderStat.children) {
                                if (!backupForSchema.isDirectory) {
                                    this.add(backupForSchema.resource);
                                }
                            }
                        }
                    }));
                }
            }
            catch (error) {
                // ignore any errors
            }
        }
        add(resource, versionId = 0, meta) {
            this.cache.set(resource, {
                versionId,
                meta: (0, objects_1.deepClone)(meta)
            });
        }
        update(resource, meta) {
            const entry = this.cache.get(resource);
            if (entry) {
                entry.meta = (0, objects_1.deepClone)(meta);
            }
        }
        count() {
            return this.cache.size;
        }
        has(resource, versionId, meta) {
            const entry = this.cache.get(resource);
            if (!entry) {
                return false; // unknown resource
            }
            if (typeof versionId === 'number' && versionId !== entry.versionId) {
                return false; // different versionId
            }
            if (meta && !(0, objects_1.equals)(meta, entry.meta)) {
                return false; // different metadata
            }
            return true;
        }
        get() {
            return Array.from(this.cache.keys());
        }
        remove(resource) {
            this.cache.delete(resource);
        }
        move(source, target) {
            const entry = this.cache.get(source);
            if (entry) {
                this.cache.delete(source);
                this.cache.set(target, entry);
            }
        }
        clear() {
            this.cache.clear();
        }
    }
    exports.WorkingCopyBackupsModel = WorkingCopyBackupsModel;
    let WorkingCopyBackupService = class WorkingCopyBackupService {
        constructor(backupWorkspaceHome, fileService, logService) {
            this.fileService = fileService;
            this.logService = logService;
            this.impl = this.initialize(backupWorkspaceHome);
        }
        initialize(backupWorkspaceHome) {
            if (backupWorkspaceHome) {
                return new WorkingCopyBackupServiceImpl(backupWorkspaceHome, this.fileService, this.logService);
            }
            return new InMemoryWorkingCopyBackupService();
        }
        reinitialize(backupWorkspaceHome) {
            // Re-init implementation (unless we are running in-memory)
            if (this.impl instanceof WorkingCopyBackupServiceImpl) {
                if (backupWorkspaceHome) {
                    this.impl.initialize(backupWorkspaceHome);
                }
                else {
                    this.impl = new InMemoryWorkingCopyBackupService();
                }
            }
        }
        hasBackups() {
            return this.impl.hasBackups();
        }
        hasBackupSync(identifier, versionId, meta) {
            return this.impl.hasBackupSync(identifier, versionId, meta);
        }
        backup(identifier, content, versionId, meta, token) {
            return this.impl.backup(identifier, content, versionId, meta, token);
        }
        discardBackup(identifier, token) {
            return this.impl.discardBackup(identifier, token);
        }
        discardBackups(filter) {
            return this.impl.discardBackups(filter);
        }
        getBackups() {
            return this.impl.getBackups();
        }
        resolve(identifier) {
            return this.impl.resolve(identifier);
        }
        toBackupResource(identifier) {
            return this.impl.toBackupResource(identifier);
        }
        joinBackups() {
            return this.impl.joinBackups();
        }
    };
    WorkingCopyBackupService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupService);
    exports.WorkingCopyBackupService = WorkingCopyBackupService;
    let WorkingCopyBackupServiceImpl = class WorkingCopyBackupServiceImpl extends lifecycle_1.Disposable {
        constructor(backupWorkspaceHome, fileService, logService) {
            super();
            this.backupWorkspaceHome = backupWorkspaceHome;
            this.fileService = fileService;
            this.logService = logService;
            this.ioOperationQueues = this._register(new async_1.ResourceQueue()); // queue IO operations to ensure write/delete file order
            this.model = undefined;
            this.initialize(backupWorkspaceHome);
        }
        initialize(backupWorkspaceResource) {
            this.backupWorkspaceHome = backupWorkspaceResource;
            this.ready = this.doInitialize();
        }
        async doInitialize() {
            // Create backup model
            this.model = await WorkingCopyBackupsModel.create(this.backupWorkspaceHome, this.fileService);
            // Migrate hashes as needed. We used to hash with a MD5
            // sum of the path but switched to our own simpler hash
            // to avoid a node.js dependency. We still want to
            // support the older hash to prevent dataloss, so we:
            // - iterate over all backups
            // - detect if the file name length is 32 (MD5 length)
            // - read the backup's target file path
            // - rename the backup to the new hash
            // - update the backup in our model
            for (const backupResource of this.model.get()) {
                if ((0, resources_1.basename)(backupResource).length !== 32) {
                    continue; // not a MD5 hash, already uses new hash function
                }
                try {
                    const identifier = await this.resolveIdentifier(backupResource, this.model);
                    if (!identifier) {
                        this.logService.warn(`Backup: Unable to read target URI of backup ${backupResource} for migration to new hash.`);
                        continue;
                    }
                    const expectedBackupResource = this.toBackupResource(identifier);
                    if (!(0, resources_1.isEqual)(expectedBackupResource, backupResource)) {
                        await this.fileService.move(backupResource, expectedBackupResource, true);
                        this.model.move(backupResource, expectedBackupResource);
                    }
                }
                catch (error) {
                    this.logService.error(`Backup: Unable to migrate backup ${backupResource} to new hash.`);
                }
            }
            return this.model;
        }
        async hasBackups() {
            const model = await this.ready;
            return model.count() > 0;
        }
        hasBackupSync(identifier, versionId, meta) {
            if (!this.model) {
                return false;
            }
            const backupResource = this.toBackupResource(identifier);
            return this.model.has(backupResource, versionId, meta);
        }
        async backup(identifier, content, versionId, meta, token) {
            const model = await this.ready;
            if (token === null || token === void 0 ? void 0 : token.isCancellationRequested) {
                return;
            }
            const backupResource = this.toBackupResource(identifier);
            if (model.has(backupResource, versionId, meta)) {
                // return early if backup version id matches requested one
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource).queue(async () => {
                if (token === null || token === void 0 ? void 0 : token.isCancellationRequested) {
                    return;
                }
                if (model.has(backupResource, versionId, meta)) {
                    // return early if backup version id matches requested one
                    // this can happen when multiple backup IO operations got
                    // scheduled, racing against each other.
                    return;
                }
                // Encode as: Resource + META-START + Meta + END
                // and respect max length restrictions in case
                // meta is too large.
                let preamble = this.createPreamble(identifier, meta);
                if (preamble.length >= WorkingCopyBackupServiceImpl.PREAMBLE_MAX_LENGTH) {
                    preamble = this.createPreamble(identifier);
                }
                // Update backup with value
                const preambleBuffer = buffer_1.VSBuffer.fromString(preamble);
                let backupBuffer;
                if ((0, stream_1.isReadableStream)(content)) {
                    backupBuffer = (0, buffer_1.prefixedBufferStream)(preambleBuffer, content);
                }
                else if (content) {
                    backupBuffer = (0, buffer_1.prefixedBufferReadable)(preambleBuffer, content);
                }
                else {
                    backupBuffer = buffer_1.VSBuffer.concat([preambleBuffer, buffer_1.VSBuffer.fromString('')]);
                }
                // Write backup via file service
                await this.fileService.writeFile(backupResource, backupBuffer);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // write into the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.add(backupResource, versionId, meta);
            });
        }
        createPreamble(identifier, meta) {
            return `${identifier.resource.toString()}${WorkingCopyBackupServiceImpl.PREAMBLE_META_SEPARATOR}${JSON.stringify(Object.assign(Object.assign({}, meta), { typeId: identifier.typeId }))}${WorkingCopyBackupServiceImpl.PREAMBLE_END_MARKER}`;
        }
        async discardBackups(filter) {
            const model = await this.ready;
            // Discard all but some backups
            const except = filter === null || filter === void 0 ? void 0 : filter.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                await async_1.Promises.settled(model.get().map(async (backupResource) => {
                    if (!exceptMap.has(backupResource)) {
                        await this.doDiscardBackup(backupResource);
                    }
                }));
            }
            // Discard all backups
            else {
                await this.deleteIgnoreFileNotFound(this.backupWorkspaceHome);
                model.clear();
            }
        }
        discardBackup(identifier, token) {
            const backupResource = this.toBackupResource(identifier);
            return this.doDiscardBackup(backupResource, token);
        }
        async doDiscardBackup(backupResource, token) {
            const model = await this.ready;
            if (token === null || token === void 0 ? void 0 : token.isCancellationRequested) {
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource).queue(async () => {
                if (token === null || token === void 0 ? void 0 : token.isCancellationRequested) {
                    return;
                }
                // Delete backup file ignoring any file not found errors
                await this.deleteIgnoreFileNotFound(backupResource);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // delete of the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.remove(backupResource);
            });
        }
        async deleteIgnoreFileNotFound(backupResource) {
            try {
                await this.fileService.del(backupResource, { recursive: true });
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error; // re-throw any other error than file not found which is OK
                }
            }
        }
        async getBackups() {
            const model = await this.ready;
            const backups = await Promise.all(model.get().map(backupResource => this.resolveIdentifier(backupResource, model)));
            return (0, arrays_1.coalesce)(backups);
        }
        async resolveIdentifier(backupResource, model) {
            // Read the entire backup preamble by reading up to
            // `PREAMBLE_MAX_LENGTH` in the backup file until
            // the `PREAMBLE_END_MARKER` is found
            const backupPreamble = await this.readToMatchingString(backupResource, WorkingCopyBackupServiceImpl.PREAMBLE_END_MARKER, WorkingCopyBackupServiceImpl.PREAMBLE_MAX_LENGTH);
            if (!backupPreamble) {
                return undefined;
            }
            // Figure out the offset in the preamble where meta
            // information possibly starts. This can be `-1` for
            // older backups without meta.
            const metaStartIndex = backupPreamble.indexOf(WorkingCopyBackupServiceImpl.PREAMBLE_META_SEPARATOR);
            // Extract the preamble content for resource and meta
            let resourcePreamble;
            let metaPreamble;
            if (metaStartIndex > 0) {
                resourcePreamble = backupPreamble.substring(0, metaStartIndex);
                metaPreamble = backupPreamble.substr(metaStartIndex + 1);
            }
            else {
                resourcePreamble = backupPreamble;
                metaPreamble = undefined;
            }
            // Try to parse the meta preamble for figuring out
            // `typeId` and `meta` if defined.
            const { typeId, meta } = this.parsePreambleMeta(metaPreamble);
            // Update model entry with now resolved meta
            model.update(backupResource, meta);
            return {
                typeId: typeId !== null && typeId !== void 0 ? typeId : workingCopy_1.NO_TYPE_ID,
                resource: uri_1.URI.parse(resourcePreamble)
            };
        }
        async readToMatchingString(backupResource, matchingString, maximumBytesToRead) {
            const contents = (await this.fileService.readFile(backupResource, { length: maximumBytesToRead })).value.toString();
            const matchingStringIndex = contents.indexOf(matchingString);
            if (matchingStringIndex >= 0) {
                return contents.substr(0, matchingStringIndex);
            }
            // Unable to find matching string in file
            return undefined;
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const model = await this.ready;
            if (!model.has(backupResource)) {
                return undefined; // require backup to be present
            }
            // Load the backup content and peek into the first chunk
            // to be able to resolve the meta data
            const backupStream = await this.fileService.readFileStream(backupResource);
            const peekedBackupStream = await (0, stream_1.peekStream)(backupStream.value, 1);
            const firstBackupChunk = buffer_1.VSBuffer.concat(peekedBackupStream.buffer);
            // We have seen reports (e.g. https://github.com/microsoft/vscode/issues/78500) where
            // if VSCode goes down while writing the backup file, the file can turn empty because
            // it always first gets truncated and then written to. In this case, we will not find
            // the meta-end marker ('\n') and as such the backup can only be invalid. We bail out
            // here if that is the case.
            const preambleEndIndex = firstBackupChunk.buffer.indexOf(WorkingCopyBackupServiceImpl.PREAMBLE_END_MARKER_CHARCODE);
            if (preambleEndIndex === -1) {
                this.logService.trace(`Backup: Could not find meta end marker in ${backupResource}. The file is probably corrupt (filesize: ${backupStream.size}).`);
                return undefined;
            }
            const preambelRaw = firstBackupChunk.slice(0, preambleEndIndex).toString();
            // Extract meta data (if any)
            let meta;
            const metaStartIndex = preambelRaw.indexOf(WorkingCopyBackupServiceImpl.PREAMBLE_META_SEPARATOR);
            if (metaStartIndex !== -1) {
                meta = this.parsePreambleMeta(preambelRaw.substr(metaStartIndex + 1)).meta;
            }
            // Update model entry with now resolved meta
            model.update(backupResource, meta);
            // Build a new stream without the preamble
            const firstBackupChunkWithoutPreamble = firstBackupChunk.slice(preambleEndIndex + 1);
            let value;
            if (peekedBackupStream.ended) {
                value = (0, buffer_1.bufferToStream)(firstBackupChunkWithoutPreamble);
            }
            else {
                value = (0, buffer_1.prefixedBufferStream)(firstBackupChunkWithoutPreamble, peekedBackupStream.stream);
            }
            return { value, meta };
        }
        parsePreambleMeta(preambleMetaRaw) {
            let typeId = undefined;
            let meta = undefined;
            if (preambleMetaRaw) {
                try {
                    meta = JSON.parse(preambleMetaRaw);
                    typeId = meta === null || meta === void 0 ? void 0 : meta.typeId;
                    // `typeId` is a property that we add so we
                    // remove it when returning to clients.
                    if (typeof (meta === null || meta === void 0 ? void 0 : meta.typeId) === 'string') {
                        delete meta.typeId;
                        if ((0, types_1.isEmptyObject)(meta)) {
                            meta = undefined;
                        }
                    }
                }
                catch (error) {
                    // ignore JSON parse errors
                }
            }
            return { typeId, meta };
        }
        toBackupResource(identifier) {
            return (0, resources_1.joinPath)(this.backupWorkspaceHome, identifier.resource.scheme, hashIdentifier(identifier));
        }
        joinBackups() {
            return this.ioOperationQueues.whenDrained();
        }
    };
    WorkingCopyBackupServiceImpl.PREAMBLE_END_MARKER = '\n';
    WorkingCopyBackupServiceImpl.PREAMBLE_END_MARKER_CHARCODE = '\n'.charCodeAt(0);
    WorkingCopyBackupServiceImpl.PREAMBLE_META_SEPARATOR = ' '; // using a character that is know to be escaped in a URI as separator
    WorkingCopyBackupServiceImpl.PREAMBLE_MAX_LENGTH = 10000;
    WorkingCopyBackupServiceImpl = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupServiceImpl);
    class InMemoryWorkingCopyBackupService {
        constructor() {
            this.backups = new map_1.ResourceMap();
        }
        async hasBackups() {
            return this.backups.size > 0;
        }
        hasBackupSync(identifier, versionId) {
            const backupResource = this.toBackupResource(identifier);
            return this.backups.has(backupResource);
        }
        async backup(identifier, content, versionId, meta, token) {
            const backupResource = this.toBackupResource(identifier);
            this.backups.set(backupResource, {
                typeId: identifier.typeId,
                content: content instanceof buffer_1.VSBuffer ? content : content ? (0, stream_1.isReadableStream)(content) ? await (0, buffer_1.streamToBuffer)(content) : (0, buffer_1.readableToBuffer)(content) : buffer_1.VSBuffer.fromString(''),
                meta
            });
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const backup = this.backups.get(backupResource);
            if (backup) {
                return { value: (0, buffer_1.bufferToStream)(backup.content), meta: backup.meta };
            }
            return undefined;
        }
        async getBackups() {
            return Array.from(this.backups.entries()).map(([resource, backup]) => ({ typeId: backup.typeId, resource }));
        }
        async discardBackup(identifier) {
            this.backups.delete(this.toBackupResource(identifier));
        }
        async discardBackups(filter) {
            const except = filter === null || filter === void 0 ? void 0 : filter.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                for (const backup of await this.getBackups()) {
                    if (!exceptMap.has(this.toBackupResource(backup))) {
                        await this.discardBackup(backup);
                    }
                }
            }
            else {
                this.backups.clear();
            }
        }
        toBackupResource(identifier) {
            return uri_1.URI.from({ scheme: network_1.Schemas.inMemory, path: hashIdentifier(identifier) });
        }
        async joinBackups() {
            return;
        }
    }
    exports.InMemoryWorkingCopyBackupService = InMemoryWorkingCopyBackupService;
    /*
     * Exported only for testing
     */
    function hashIdentifier(identifier) {
        // IMPORTANT: for backwards compatibility, ensure that
        // we ignore the `typeId` unless a value is provided.
        // To preserve previous backups without type id, we
        // need to just hash the resource. Otherwise we use
        // the type id as a seed to the resource path.
        let resource;
        if (identifier.typeId.length > 0) {
            const typeIdHash = hashString(identifier.typeId);
            if (identifier.resource.path) {
                resource = (0, resources_1.joinPath)(identifier.resource, typeIdHash);
            }
            else {
                resource = identifier.resource.with({ path: typeIdHash });
            }
        }
        else {
            resource = identifier.resource;
        }
        return hashPath(resource);
    }
    exports.hashIdentifier = hashIdentifier;
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return hashString(str);
    }
    function hashString(str) {
        return (0, hash_1.hash)(str).toString(16);
    }
});
//# sourceMappingURL=workingCopyBackupService.js.map