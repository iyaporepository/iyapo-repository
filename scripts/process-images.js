const sharp = require('sharp');
const stream=require('stream');
const fs = require('fs');
const https = require('https');

let aspect_ratios={};

let sizes={
    sm:500,
    md:1000,
    lg:1500,
    xl:2500
}


let archive_root='assets/images_for_web/archive';
let pages_root='assets/images_for_web/pages';
let rare_media_root='assets/images_for_web/rare-media';

let get_path={
    manuscript:(id,size,ext)=>`${archive_root}/manuscript${id}/scan@@${size}.${ext}`,
    artifact:(id,subid,size,name,ext)=>`${archive_root}/manuscript${id}/artifact${subid}/img@@${name}@@${size}.${ext}`,
    rare_media:(id,size,ext)=>`${rare_media_root}/media@@${id}@@${size}.${ext}`,
    moving_image:(id,subid,size,name,ext)=>`${archive_root}/manuscript${id}/moving-image${subid}/img@@${name}@@${size}.${ext}`,
    standalone:(name,size,ext)=>`${pages_root}/img@@${name}@@${size}.${ext}`
}


function get_path_pair(image,size){
    let jpg=image.archive_type=='manuscript'?
                get_path.manuscript(image.manuscript_id,size,'jpg')
            :image.archive_type=='artifact'?
                get_path.artifact(
                    image.manuscript_id,
                    image.artifact_subid,
                    size,
                    image.filename,
                    'jpg')
            :image.archive_type=='moving-image'?
                get_path.moving_image(
                    image.manuscript_id,
                    image.video_subid,
                    size,
                    image.filename,
                    'jpg')
            :image.archive_type=='rare-media'?
                get_path.rare_media(image.media_id,size,'jpg')
            :image.archive_type=='standalone'?
                get_path.standalone(image.filename,size,'jpg')
            :'';

    let webp=image.archive_type=='manuscript'?
                get_path.manuscript(image.manuscript_id,size,'webp')
            :image.archive_type=='artifact'?
                get_path.artifact(
                    image.manuscript_id,
                    image.artifact_subid,
                    size,
                    image.filename,
                    'webp')
            :image.archive_type=='moving-image'?
                get_path.moving_image(
                    image.manuscript_id,
                    image.video_subid,
                    size,
                    image.filename,
                    'webp')
            :image.archive_type=='rare-media'?
                get_path.rare_media(image.media_id,size,'webp')
            :image.archive_type=='standalone'?
                get_path.standalone(image.filename,size,'webp')
            :'';

    return {jpg,webp}
}


module.exports=async function process_images(file_processing_queue,cms){
    console.log(`   processing ${file_processing_queue.length} valid files...`)
    let new_counter=0;

    // create any new directory folders
    for(let manuscript of cms.manuscripts){
        create_folders(manuscript,cms)
    }

    for(let file of file_processing_queue){
        if(file.file_type=='image'){
            let size_missing=false;
            // check if any of the sizes don't exist
            
            for(let size of file?.sizes || []){
                file.filename = file.name.replace(/\.[^/.]+$/, '');

                let path=get_path_pair(file,size);
                let exists=fs.existsSync(path.jpg)&&fs.existsSync(path.webp);
                if(!exists) size_missing=true;
            }

            if(size_missing){
                console.log(`      downloading and resizing ${file.name}...`);
                new_counter++;
                await load_image(file);
                // if at least one does not exist, redowload and process the image
            }

            if(file.archive_type=='standalone'){
                let rendition=get_path_pair(file,file?.sizes[0]);
                let aspect_ratio=await sharp(rendition.jpg).metadata().then((meta)=>{return meta?.height/meta?.width})
                aspect_ratios["img-"+file.name]=aspect_ratio;
            }
        }else{
            // just download it directly
            // console.log(file);
            let path=get_path.rare_media(file.media_id,'attachment',file.extension)
            let exists=fs.existsSync(path);
            if(!exists){
                let new_file=fs.createWriteStream(path);
                console.log(`      downloading ${file.name}.${file.extension}...`);
                await new Promise((resolve)=>{
                    https.get(file.url, function(response) {
                        response.pipe(new_file);
                        new_file.on("finish", () => {
                            new_file.close();
                            resolve();
                        });
                    });
                })
                new_counter++;
            }
        }
        

        


     
    }

    console.log(`   processed ${new_counter} new files.`);
    return {
        aspect_ratios
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

    let moving_images=data.moving_images.filter(a=>a.properties.manuscript_id.value==manuscript.properties.manuscript_id.value);
    for(let vid of moving_images){
        let subdir=dir+'/moving-image'+vid.properties.video_subid.value;
        if (!fs.existsSync(subdir)){
            fs.mkdirSync(subdir, { recursive: true });
        }
    }
}


function load_image(image){

    return new Promise(async (resolve) => {

        let promises=[];
        const sharpStream = sharp({ failOn: 'none' });
        for(let size of image.sizes){
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

