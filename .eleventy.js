
const marked = require('marked');
marked.use({mangle: false,headerIds: false});
require('dotenv').config();


function find_thumbnail(media,backup,path,type='manuscript'){
  let thumbnail=media.filter(a=>a.type=='image')[0];
  if(!thumbnail) thumbnail=backup.filter(a=>a.type=='image')[0];
  if(thumbnail){
    let name=type=='manuscript'?'scan@@sm':`img@@${thumbnail.name}@@sm`;
    return path+name;
  }else{
    return '';
  }
}

module.exports = function (eleventyConfig) {

    eleventyConfig.addNunjucksFilter( "thumbnail", function(item,type='manuscript') {
      if(type=='artifact'){
        return find_thumbnail(
          item.properties.media.value,
          item.properties.thumbnail?.value,
          `assets/images_for_web/archive/manuscript${item.properties.manuscript_id.value}/artifact${item.properties.artifact_subid.value}/`,
          'artifact'
        )
      }else if(type=='manuscript'){
        return find_thumbnail(
          item.properties.scan.value,
          [],
          `assets/images_for_web/archive/manuscript${item.properties.manuscript_id.value}/`
        )
      }else if(type=='moving image'){
        return find_thumbnail(
          [],
          item.properties.thumbnail?.value,
          `assets/images_for_web/archive/manuscript${item.properties.manuscript_id.value}/moving-image${item.properties.video_subid.value}/`,
          'moving image'
        )
      }else {
        return '';
      }
      

      // return process.env[value]
    });

    eleventyConfig.addNunjucksFilter( "env", function(value) {    
      return process.env[value]
    });

    

    eleventyConfig.addNunjucksFilter("zero_string",function(id,nz=4){
        let i=id;
        let n = 1;
        if ( i >= 100) { n += 2; i /= 100; }
        if ( i >= 10) { n += 1; }

        let zeros=Array(nz - n).fill('0').join('');

        return `${zeros}${id}`;
    })


    eleventyConfig.addNunjucksFilter( "get_constellation_props", function(item,type,cms) { 
      let props=[];

      if(type=='manuscript'){
        let artifacts=cms.artifacts
          .filter(a=>a.properties.manuscript_id.value==item.properties.manuscript_id.value)
          .map(a=>{
            return {
              orientation:'landscape',
              url: `archive/artifacts-cluster/artifact-${a.properties.manuscript_id.value}-${a.properties.artifact_subid.value}`,
              image:find_thumbnail(a.properties.media.value,a.properties.thumbnail?.value,`assets/images_for_web/archive/manuscript${a.properties.manuscript_id.value}/artifact${a.properties.artifact_subid.value}/`,'artifact')
            }
          })
        
        props=[
          {type:'text',label:'Name',value:item.properties.manuscript_name.value},
          {type:'tags',value:
          item.properties.narrative.value||item.properties.domain.value||item.properties.object.value?{
            narrative: item.properties.narrative.value,
            domain: item.properties.domain.value,
            object: item.properties.object.value
          }:false },
          {type:'accordion',label:'Description',value:item.properties.manuscript_description.value[0]?.plain_text.split('\n').map(a=>`<p>${a}</p>`).join('')
        },
          {type:'relatives',label:'Descendant Artifacts',value:artifacts.length>0?artifacts:false}
        ]

      }else if(type=='artifact'){
        let manuscripts=cms.manuscripts
          .filter(a=>a.properties.manuscript_id.value==item.properties.manuscript_id.value)
          .map(a=>{
            return {
              orientation:'vertical',
              url: `archive/manuscripts-cluster/manuscript-${a.properties.manuscript_id.value}`,
              image:find_thumbnail(a.properties.scan.value,[],`assets/images_for_web/archive/manuscript${a.properties.manuscript_id.value}/`)
            }
          })

        props=[
          {type:'text',label:'Name',value:item.properties.artifact_name.value},
          {type:'accordion',label:'Description',
          value:item.properties.artifact_description.value[0]?.plain_text
            .split('\n').map(a=>`<p>${a}</p>`).join('')

          },
          {type:'relatives',label:'Ancestor Manuscript',value:manuscripts.length>0?manuscripts:false}
        ]
      }else if(type=='moving image'){
        let manuscripts=cms.manuscripts
          .filter(a=>a.properties.manuscript_id.value==item.properties.manuscript_id.value)
          .map(a=>{
            return {
              orientation:'vertical',
              url: `archive/manuscripts-cluster/manuscript-${a.properties.manuscript_id.value}`,
              image:find_thumbnail(a.properties.scan.value,[],`assets/images_for_web/archive/manuscript${a.properties.manuscript_id.value}/`)
            }
          })
          

        props=[
          {type:'text',label:'Name',value:item.properties.video_name.value},
          {type:'text',label:'Category',value:item.properties.video_category.value},
          {type:'accordion',label:'Description',
            value:item.properties.video_description.value[0]?.plain_text.split('\n').map(a=>`<p>${a}</p>`).join('')
          },
          {type:'relatives',label:'Ancestor Manuscript',value:manuscripts.length>0?manuscripts:false}
        ]
      }else if(type=='rare media'){
        props=[
          {type:'text',label:'Name',value:item.properties.media_name.value},
          {type:'text',label:'Author',value:item.properties.authors.value[0]?.plain_text},
          {type:'text',label:'Category',value:item.properties.media_category.value},
          {type:'accordion',label:'Description',
            value:item.properties.media_description.value[0]?.plain_text.split('\n').map(a=>`<p>${a}</p>`).join('')
          }
        ]
      }

      return props.filter(a=>a.value);
    });

    eleventyConfig.addNunjucksFilter( "notion_data_sort_int", function(array,property) {    
      return array.sort((a,b)=>{
        return a.properties[property].value - b.properties[property].value;
      });
    });

    eleventyConfig.addNunjucksFilter( "notion_data_find", function(array,property,value) {   
      return array.find(item=>item.properties[property].value==value);
    });

    eleventyConfig.addNunjucksFilter( "notion_data_filter_by", function(array,property,value) {   
      return array.filter(item=>item.properties[property].value==value);
    });

    eleventyConfig.addNunjucksFilter( "md", function(value) {    
        var result;
          try {
            result = marked.parse(value)
            return result;
          } catch (e) {
            return "";
          }
      });

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

    eleventyConfig.setTemplateFormats("html,css,js,njk,otf,woff,woff2,md");
    eleventyConfig.addDataExtension("md", contents => {html:marked.parse(contents)});


    return {
        dir: {
            input: "input",
            output: "_site",
            data: '_data'
        }
    };
};
