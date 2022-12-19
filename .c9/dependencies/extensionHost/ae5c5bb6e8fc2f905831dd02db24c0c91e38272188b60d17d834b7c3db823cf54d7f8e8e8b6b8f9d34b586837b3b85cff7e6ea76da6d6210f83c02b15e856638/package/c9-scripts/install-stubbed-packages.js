// Runs as postinstall hook
// Creates packages in c9-package-overrides for all stubbed dependencies
// c9-package-overrides is set as VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH for extension host process
const path = require("path");
const proc = require("child_process");

const JSON_PATH = `${__dirname}/../package.json`;
const MODULES_PATH = `${__dirname}/../c9-package-overrides`;
const STUB_PATH = `${__dirname}/../c9-package-stub`;

const packageConfig = require(JSON_PATH);
const stubbedDependencies = (packageConfig.stubbedDependencies || []).concat(packageConfig.stubbedDevDependencies || []);

for (const depName of stubbedDependencies) {
	const destination = path.join(MODULES_PATH, depName);
	console.log(`creating a stub in ${destination}`);
	proc.execSync(`rm -rf ${destination}`);
	proc.execSync(`mkdir -p ${destination}`);
	proc.execSync(`cp -R ${STUB_PATH}/* ${destination}`);
}
