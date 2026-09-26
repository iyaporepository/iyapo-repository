const get_data=require('./notion.js');
const { AssetCache } = require("@11ty/eleventy-fetch");



async function get_cms_data(){
    let cached = new AssetCache("cms_data");
    if (cached.isCacheValid("15s")) {
		// return cached data.
		return cached.getCachedValue(); // a promise
	}

    let data=await get_data({do_image_processing:true});
    await cached.save(data, "json");

	return data;
    
}

get_cms_data();