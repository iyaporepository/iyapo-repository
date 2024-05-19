const sharp = require('sharp');
const stream=require('stream');
const fs = require('fs');



let sizes={
    sm:500,
    md:1000,
    lg:1500,
    xl:2500
}


let archive_root='assets/images_for_web/archive';

let get_path={
    manuscript:(id,size,ext)=>`${archive_root}/manuscript${id}/scan@@${size}.${ext}`,
    artifact:(id,subid,size,name,ext)=>`${archive_root}/manuscript${id}/artifact${subid}/img@@${name}@@${size}.${ext}`
}


function get_path_pair(image,size){
    let jpg=image.type=='manuscript'?
                get_path.manuscript(image.metadata.manuscript_id,size,'jpg')
            :image.type=='artifact'?
                get_path.artifact(
                    image.metadata.manuscript_id,
                    image.metadata.artifact_subid,
                    size,
                    image.filename,
                    'jpg')
            :'';

    let webp=image.type=='manuscript'?
                get_path.manuscript(image.metadata.manuscript_id,size,'webp')
            :image.type=='artifact'?
                get_path.artifact(
                    image.metadata.manuscript_id,
                    image.metadata.artifact_subid,
                    size,
                    image.filename,
                    'webp')
            :'';

    return {jpg,webp}
}


module.exports=async function process_images(image_processing_queue,cms){
    console.log(`   processing ${image_processing_queue.length} valid images...`)
    // create any new directory folders
    for(let manuscript of cms.manuscripts){
        create_folders(manuscript,cms)
    }

    for(let image of image_processing_queue){

        let size_missing=false;
         // check if any of the sizes don't exist
         
        for(let size of image.metadata?.sizes || []){
            image.filename = image.name.replace(/\.[^/.]+$/, '');

            let path=get_path_pair(image,size);
            let exists=fs.existsSync(path.jpg)&&fs.existsSync(path.webp);
            if(!exists) size_missing=true;
        }

        if(size_missing){
            console.log(`      downloading and resizing ${image.name}...`);
            await load_image(image);
            // if at least one does not exist, redowload and process the image
        }else{
            console.log(`      ${image.name} already exists`);
        }

     
    }
    
    // return true;
}


function create_folders(manuscript,data){
    let dir=archive_root+'/manuscript'+manuscript.properties.manuscript_id.value;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    manuscript.dir=dir;
    let artifacts=data.artifacts.filter(a=>a.properties.manuscript_id.value==manuscript.properties.manuscript_id.value);
    for(let artifact of artifacts){
        let subdir=dir+'/artifact'+artifact.properties.artifact_subid.value;
        if (!fs.existsSync(subdir)){
            fs.mkdirSync(subdir, { recursive: true });
        }
    }
}


function load_image(image){

    return new Promise(async (resolve) => {

        let promises=[];
        const sharpStream = sharp({ failOn: 'none' });
        for(let size of image.metadata.sizes){
            let path=get_path_pair(image,size);
            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('jpg')
                    .toFile(path.jpg)
            );
            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('webp')
                    .toFile(path.webp)
            );
        }

        const {body}=await fetch(image.url);
        let readableStream=stream.Readable.fromWeb(body)
        readableStream.pipe(sharpStream);

        Promise.all(promises)
        .then(res => { resolve(true) })
        
    })
}
