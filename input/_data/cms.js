// import get_data from '../../notion.js';
const get_data=require('../../scripts/notion.js');
const { AssetCache } = require("@11ty/eleventy-fetch");

module.exports = async function () {
	// Pass in your unique custom cache key
	// (normally this would be tied to your API URL)
	let cached = new AssetCache("cms_data");

	// check if the cache is fresh within the last day
	if (cached.isCacheValid("30m")) {
		// return cached data.
		return cached.getCachedValue(); // a promise
	}
    
    let data=await get_data({do_image_processing:true});
    await cached.save(data, "json");

	return data;
};