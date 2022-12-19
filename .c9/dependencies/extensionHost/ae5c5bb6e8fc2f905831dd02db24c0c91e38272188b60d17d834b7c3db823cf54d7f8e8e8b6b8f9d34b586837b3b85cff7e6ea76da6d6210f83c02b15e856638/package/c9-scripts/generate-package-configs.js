const fs = require("fs");

const JSON_PATH = `${__dirname}/../package.json`;
const C9_JSON_PATH = `${__dirname}/../c9-package.json`;
const BUILD_JSON_PATH = `${__dirname}/../c9-build/package.json`;
const C9_BUILD_JSON_PATH = `${__dirname}/../c9-build/c9-package.json`;

function pinVersion(version) {
	if (version && version.startsWith("^")) {
		return version.slice(1);
	}
	return version;
}

const packageConfig = require(JSON_PATH);

packageConfig.name = "@c9/vscode-source"
packageConfig["npm-pretty-much"] = {
	allowUnsafeName: "Cloud9 owns the @c9 namespace",
};
packageConfig.private = false;
packageConfig.files = [
	"out/*",
	"c9-extensions/*",
	"c9-scripts/*",
	"c9-package-stub/*",
	"c9-package-overrides/*",
	"src/*",
	"product.json"
];

delete packageConfig.scripts["preinstall"];
packageConfig.scripts["postinstall"] = "node c9-scripts/install-stubbed-packages.js"
packageConfig.scripts["precommit"] = "node c9-build/c9-hygiene.js";
packageConfig.scripts["pretest"] = "npm run prepare-build-folder && npm run build";
packageConfig.scripts["test"] = "mocha -r ts-node/register -r tsconfig-paths/register './**/*_test.ts'";
packageConfig.scripts["build"] = "npm run compile && npm run prepare-builtin-extensions";
packageConfig.scripts["prepare-build-folder"] = "npm install --prefix ./c9-build && npm install --prefix ./c9-build/lib/watch";
packageConfig.scripts["prepare-builtin-extensions"] = "cd c9-scripts && ts-node prepare-builtin-extensions.ts";
packageConfig.scripts["compile"] = "gulp --gulpfile ./c9-gulpfile.js compile-client";
packageConfig.scripts["watch"] = "gulp --gulpfile ./c9-gulpfile.js watch-client";
packageConfig.scripts["hygiene"] = "gulp --gulpfile ./c9-gulpfile.js hygiene";
packageConfig.scripts["clean"] = "rm -rf node_modules && rm -rf c9-build/node_modules";
packageConfig.scripts["compile-extensions"] = "gulp --gulpfile ./c9-gulpfile.js compile-extensions compile-extension-media --max_old_space_size=4095";

delete packageConfig.devDependencies["husky"];
delete packageConfig.devDependencies["tsec"];

// Additional dependencies used by our modifications
packageConfig.dependencies["winston"] = "^3.3.3";
packageConfig.devDependencies["ts-node"] = "^7.0.1";
packageConfig.devDependencies["mocha"] = "^5.2.0";
packageConfig.devDependencies["tsconfig-paths"] = "^3.5.0";

// Later version is not available in npmpm registry
packageConfig.dependencies["jschardet"] = "2.1.0";

// Exact versions of node types and typescript are necessary for the compilation process
packageConfig.devDependencies["@types/node"] = pinVersion(packageConfig.devDependencies["@types/node"]);
packageConfig.devDependencies["typescript"] = pinVersion(packageConfig.devDependencies["typescript"]);

// Dependencies that are not in the npmpm registry or want to use internet during installation
const depsToStub = [
	"keytar",
	"native-keymap",
	"native-watchdog",
	"native-is-elevated",
	"vscode-ripgrep",
	"@vscode/ripgrep",
	"@vscode/sqlite3",
	"node-pty",
	"spdlog",
	"@parcel/watcher",
];
const devDepsToStub = [
	"7zip",
	"gulp-buffer",
	"innosetup",
	"@playwright/test",
	"@vscode/test-web",
	"@vscode/telemetry-extractor",
];
for (const dep of depsToStub) {
	delete packageConfig.dependencies[dep];
}
for (const dep of devDepsToStub) {
	delete packageConfig.devDependencies[dep];
}
packageConfig.stubbedDependencies = depsToStub;
packageConfig.stubbedDevDependencies = devDepsToStub;

packageConfig.bundledDependencies = Object.keys(packageConfig.dependencies);

delete packageConfig.optionalDependencies;

fs.writeFileSync(C9_JSON_PATH, JSON.stringify(packageConfig, null, 2));

const buildPackageConfig = require(BUILD_JSON_PATH);
// Exact versions of node types and typescript are necessary for the compilation process
buildPackageConfig.devDependencies["@types/node"] = pinVersion(buildPackageConfig.devDependencies["@types/node"]);
buildPackageConfig.devDependencies["typescript"] = pinVersion(buildPackageConfig.devDependencies["typescript"]);
buildPackageConfig.devDependencies["vsce"] = pinVersion(buildPackageConfig.devDependencies["vsce"]);
// Depends on vscode-ripgrep, which we can't build without the internet connection
delete buildPackageConfig.devDependencies["@vscode/extension-telemetry"];
fs.writeFileSync(C9_BUILD_JSON_PATH, JSON.stringify(buildPackageConfig, null, 2));


// TSConfigs may have to be modified for the future vscode versions, but for now it's ok

// const commentLinesRegExp = new RegExp(/\/\/.*/, 'gi');
// const BUILD_TS_CONFIG_PATH = `${__dirname}/../c9-build/tsconfig.json`;
// const buildTSConfigFile = fs.readFileSync(BUILD_TS_CONFIG_PATH);
// const buildTSConfig = JSON.parse(buildTSConfigFile.toString('utf8').replace(commentLinesRegExp, '').trim());
// fs.writeFileSync(BUILD_TS_CONFIG_PATH, JSON.stringify(buildTSConfig, null, '\t'));
// const SRC_TS_CONFIG_PATH = `${__dirname}/../src/tsconfig.json`;
// const srcTSConfigFile = fs.readFileSync(SRC_TS_CONFIG_PATH);
// const srcTSConfig = JSON.parse(srcTSConfigFile.toString('utf8').replace(commentLinesRegExp, '').trim());
// srcTSConfig.compilerOptions.strict = false;
// srcTSConfig.compilerOptions.noImplicitAny = false;
// srcTSConfig.compilerOptions.declaration = true;
// srcTSConfig.compilerOptions.skipLibCheck = true;
// srcTSConfig.compilerOptions.noImplicitReturns = false;
// srcTSConfig.compilerOptions.target = "es6";
// srcTSConfig.compilerOptions.lib = [
// 	"dom",
// 	"es5",
// 	"es2015",
// 	"webworker"
// ];
// fs.writeFileSync(SRC_TS_CONFIG_PATH, JSON.stringify(srcTSConfig, null, '\t'));
