const proxy = new Proxy({}, {
    get: (_target, prop) => {
		console.log("Warning, accessing property of a stubbed dependency is not safe:", prop);
		// Return a string to have more visibility if there will be errors down the line
		return "stubbed";
	},
});

module.exports = proxy;
