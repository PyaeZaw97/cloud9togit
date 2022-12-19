/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/performance", "vs/base/common/types"], function (require, exports, errorMessage_1, errors_1, performance_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDB = void 0;
    class MissingStoresError extends Error {
        constructor(db) {
            super('Missing stores');
            this.db = db;
        }
    }
    class IndexedDB {
        constructor(database, name) {
            this.name = name;
            this.database = null;
            this.pendingTransactions = [];
            this.database = database;
        }
        static async create(name, version, stores) {
            const database = await IndexedDB.openDatabase(name, version, stores);
            return new IndexedDB(database, name);
        }
        static async openDatabase(name, version, stores) {
            (0, performance_1.mark)(`code/willOpenDatabase/${name}`);
            try {
                return await IndexedDB.doOpenDatabase(name, version, stores);
            }
            catch (err) {
                if (err instanceof MissingStoresError) {
                    console.info(`Attempting to recreate the IndexedDB once.`, name);
                    try {
                        // Try to delete the db
                        await IndexedDB.deleteDatabase(err.db);
                    }
                    catch (error) {
                        console.error(`Error while deleting the IndexedDB`, (0, errors_1.getErrorMessage)(error));
                        throw error;
                    }
                    return await IndexedDB.doOpenDatabase(name, version, stores);
                }
                throw err;
            }
            finally {
                (0, performance_1.mark)(`code/didOpenDatabase/${name}`);
            }
        }
        static doOpenDatabase(name, version, stores) {
            return new Promise((c, e) => {
                const request = window.indexedDB.open(name, version);
                request.onerror = () => e(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            console.error(`Error while opening IndexedDB. Could not find '${store}'' object store`);
                            e(new MissingStoresError(db));
                            return;
                        }
                    }
                    c(db);
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store);
                        }
                    }
                };
            });
        }
        static deleteDatabase(indexedDB) {
            return new Promise((c, e) => {
                // Close any opened connections
                indexedDB.close();
                // Delete the db
                const deleteRequest = window.indexedDB.deleteDatabase(indexedDB.name);
                deleteRequest.onerror = (err) => e(deleteRequest.error);
                deleteRequest.onsuccess = () => c();
            });
        }
        hasPendingTransactions() {
            return this.pendingTransactions.length > 0;
        }
        close() {
            if (this.pendingTransactions.length) {
                this.pendingTransactions.splice(0, this.pendingTransactions.length).forEach(transaction => transaction.abort());
            }
            if (this.database) {
                this.database.close();
            }
            this.database = null;
        }
        async runInTransaction(store, transactionMode, dbRequestFn) {
            if (!this.database) {
                throw new Error(`IndexedDB database '${this.name}' is not opened.`);
            }
            const transaction = this.database.transaction(store, transactionMode);
            this.pendingTransactions.push(transaction);
            return new Promise((c, e) => {
                transaction.oncomplete = () => {
                    if ((0, types_1.isArray)(request)) {
                        c(request.map(r => r.result));
                    }
                    else {
                        c(request.result);
                    }
                };
                transaction.onerror = () => e(transaction.error);
                const request = dbRequestFn(transaction.objectStore(store));
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
        async getKeyValues(store, isValid) {
            if (!this.database) {
                throw new Error(`IndexedDB database '${this.name}' is not opened.`);
            }
            const transaction = this.database.transaction(store, 'readonly');
            this.pendingTransactions.push(transaction);
            return new Promise(resolve => {
                const items = new Map();
                const objectStore = transaction.objectStore(store);
                // Open a IndexedDB Cursor to iterate over key/values
                const cursor = objectStore.openCursor();
                if (!cursor) {
                    return resolve(items); // this means the `ItemTable` was empty
                }
                // Iterate over rows of `ItemTable` until the end
                cursor.onsuccess = () => {
                    if (cursor.result) {
                        // Keep cursor key/value in our map
                        if (isValid(cursor.result.value)) {
                            items.set(cursor.result.key.toString(), cursor.result.value);
                        }
                        // Advance cursor to next row
                        cursor.result.continue();
                    }
                    else {
                        resolve(items); // reached end of table
                    }
                };
                // Error handlers
                const onError = (error) => {
                    console.error(`IndexedDB getKeyValues(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                    resolve(items);
                };
                cursor.onerror = () => onError(cursor.error);
                transaction.onerror = () => onError(transaction.error);
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
    }
    exports.IndexedDB = IndexedDB;
});
//# sourceMappingURL=indexedDB.js.map