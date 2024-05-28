console.log(tags,cluster);

window.addEventListener('load',init)

let tag_boxes=[];
let tags_selected_box;
let filter_box;
let tags_selected={
    narrative:[],
    object:[],
    domain:[]
}
let n_selected=0;
let card_container;
let cards;
let search_field;

let search_val='';
let radio_val='';


function init(){
    search_field=document.querySelector('#search-field');
    if(search_field){
        search_field.addEventListener('input',(e)=>{
            search_val=e.currentTarget.value.toLowerCase();
            filter_cards();
        })
    }
    radio_checkboxes=Array.from(document.querySelectorAll('.category-select input'));
    for(let checkbox of radio_checkboxes){
        checkbox.addEventListener('change',(e)=>{
            for(let box of radio_checkboxes){
                if(box.value!==checkbox.value) box.checked=false;
                
            }
            if(checkbox.checked) radio_val=checkbox.value;
            else radio_val='';
            card_container.classList.toggle('filtering',radio_val.length>0);
            for(let media_item of Array.from(document.querySelectorAll('.item'))){

                media_item.classList.toggle('in-filter',media_item.dataset.category == radio_val);
            }

        })
    }

    tag_boxes= Array.from(document.querySelectorAll('#filter input[type="checkbox"]'));
    tags_selected_box=document.querySelector('.selected-tags');
    filter_box=document.querySelector('#filter');
    card_container=document.querySelector('#cards');
    cards=Array.from(document.querySelectorAll('.card'));


    if(cluster=='manuscripts'){
        


        let resize_observer=new ResizeObserver(function(){
            console.log('resize box')
            filter_box.style.setProperty('--h',document.querySelector('#top-bar').offsetHeight+'px')
        })

        resize_observer.observe(document.querySelector('#top-bar'));

       tag_boxes.forEach((checkbox)=>{
            checkbox.addEventListener('change',evaluate_tags)
        })
    }

    target_blank();
}

function evaluate_tags(){
    let checked_boxes=tag_boxes.filter(a=>a.checked);
    filter_box.dataset.selected=checked_boxes.length;
    n_selected=checked_boxes.length
    // tags_selected_box.innerHTML='';
    
    tags_selected={
        narrative:[],
        object:[],
        domain:[]
    }

    for(let box of checked_boxes){
        let button=document.createElement('button');
        let category=box.parentNode.parentNode.dataset.category;
        let tag=box.dataset.tag;
        tags_selected[category].push(tag);
        if(!tags_selected_box.querySelector(`.selected-tag[data-category="${category}"][data-tag="${tag}"]`)){
            button.innerText=tag;
            button.dataset.category=category;
            button.dataset.tag=tag;
            button.classList.add('col-'+category)
            button.classList.add('selected-tag')
            button.addEventListener('click',remove_tag);
            tags_selected_box.appendChild(button);
        }
        
        
    }


    filter_cards();
}


function remove_tag(e){
    let category=e.currentTarget.dataset.category;
    let tag=e.currentTarget.dataset.tag;
    let box=document.querySelector(`#${category}-${tag.toLowerCase().replaceAll(' ','-')}`)
    if(box) box.checked=false;
    e.currentTarget.remove();
    evaluate_tags();
}




function filter_cards(){
    card_container.classList.toggle('filtering',n_selected>0||search_val.length>0);
    console.log(search_val,tags_selected)
    for(let card of cards){
        let narrative=card.dataset.narrative;
        let object=card.dataset.object;
        let domain=card.dataset.domain;
        card.classList.toggle('in-filter',
            (n_selected==0&&search_val.length==0)
            || (
                (search_val.length==0 || card.dataset.name.toLowerCase().includes(search_val) || card.dataset.id.toLowerCase().includes(search_val))
                && (tags_selected.narrative.length==0 || tags_selected.narrative.includes(narrative))
                && (tags_selected.object.length==0 || tags_selected.object.includes(object))
                && (tags_selected.domain.length==0 || tags_selected.domain.includes(domain))
            )
        )
    }
}

function target_blank(){
    document.querySelectorAll('a').forEach(link=>{
        if(link.host!==window.location.host){
            link.setAttribute('target', '_blank');
        }
    })
}