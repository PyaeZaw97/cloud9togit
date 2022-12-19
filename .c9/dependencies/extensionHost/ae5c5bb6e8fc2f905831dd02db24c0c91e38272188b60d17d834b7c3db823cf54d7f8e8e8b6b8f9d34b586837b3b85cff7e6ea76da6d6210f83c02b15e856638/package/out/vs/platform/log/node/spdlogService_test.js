// Modifications Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
define(["require", "exports", "assert", "fs", "./spdlogLog", "mocha"], function (require, exports, assert, fs, spdlogLog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe("spdlogService", () => {
        it(`should get directory from path`, async function () {
            assert.deepEqual((0, spdlogLog_1.getLogDir)(`/local/home/test/output_logging_20191209T105841/1-AWS Toolkit Logs.log`), `/local/home/test/output_logging_20191209T105841`);
        });
        describe("WinstonRotatingLogger", () => {
            const name = "WinstonRotatingLogger";
            const filePath = `${__dirname}/${name}.log`;
            const logger = new spdlogLog_1.WinstonRotatingLogger(name, filePath, 1024 * 1024 * 30, 1);
            after(() => {
                fs.unlink(filePath, () => { });
            });
            it("should log output channel messages without modifications", (done) => {
                logger.info("test message\n");
                fs.readFile(filePath, (error, data) => {
                    assert.equal(data, "test message\n");
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=spdlogService_test.js.map