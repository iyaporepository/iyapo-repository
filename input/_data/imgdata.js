const { AssetCache } = require("@11ty/eleventy-fetch");

module.exports = async function () {
	let cached = new AssetCache("img_data");

	return cached.getCachedValue();
    
};