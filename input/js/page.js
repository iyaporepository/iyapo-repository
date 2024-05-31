

let win={
    w:undefined,
    h:undefined,
    axis:undefined
}

let scroll_y=0;

const dom={}
const svg={}
const svg_back={}


let mouse={
    x:0,
    y:0,
    changed:false
}

let isDesktop=window.matchMedia('(min-width:840px)');

let current_size=isDesktop.matches?'desktop':'mobile';

let galaxy_settings={
    desktop:{
        n1:7,
        n2:30,
        r1:0.015,
        r2:0.1,
        pos_prop:'pos'
    },
    mobile:{
        n1:5,
        n2:15,
        r1:0.08,
        r2:0.32,
        pos_prop:'mobile_pos'
    },
}



let spotlight_mode='mouse';
let cluster_transition_start=0;
let cluster_transition_duration=400;
let cluster_transition_start_pos={x:0,y:0};

let current_view='galaxy';
let current_cluster;
let hovered_cluster='';

function update_spotlight_mode(v){
    spotlight_mode=v;
    dom.body.node().dataset.spotlightmode=v;
}
function update_archive_view(v){
    console.log('update archive view!',v)
    current_view=v;
    console.log(v)
    if(v!=='galaxy'){
        dom.body.node().dataset.cluster=v;
        current_cluster=archive_clusters.find(a=>a.name==v)
    }
        
        
    dom.body.node().dataset.view=v=='galaxy'?v:'cluster';
}





const scope_paths=[
    {
        side:'box',
        x:'top',
        y:'left'
    },
    {
        side:'box',
        x:'top',
        y:'right'
    },
    {
        side:'box',
        x:'bot',
        y:'left'
    },
    {
        side:'box',
        x:'bot',
        y:'right'
    }
]

let scope_back_paths=[
    {
        side:'back',
        x:'top',
        y:'left'
    },
    {
        side:'back',
        x:'top',
        y:'right',

    },
    {
        side:'back',
        x:'bot',
        y:'left'
    },
    {
        side:'back',
        x:'bot',
        y:'right'
    }
]




window.addEventListener('load',init);

function init(){
    if(is_landing){
        dom.svg=d3.select('#scope');
        dom.svg_back=d3.select('#scope-back')
        dom.body=d3.select('body')
        dom.portal=d3.select('#portal');
        dom.archive_window=d3.select('#archive-window');
        dom.masked_content=d3.select('#masked-content');
        svg.aperture=d3.select('#aperture');
        svg_back.aperture=d3.select('#aperture-back');
        svg.aperture_dom=d3.select('#aperture-dom');
        dom.lens=d3.select('#lens')
        svg.paths=dom.svg
            .insert('g','path')
            .attr('class','paths')
            .selectAll('path')
        svg_back.paths=dom.svg_back
            .insert('g','path')
            .attr('class','paths')
            .selectAll('path')
    
        set_size();
        // mouse={
        //     x:win.w/2,
        //     y:win.y/2
        // }

        document.querySelector('#go-to-about').addEventListener('click',()=>{
            window.scroll({left:0,top:win.h + 110,behavior:'smooth'})
            document.querySelector('#page-nav').classList.remove('open')
            reset_to_galaxy()
            
        })


        set_up_logo();
        set_scroll();
        window.addEventListener('resize',set_size);
        window.addEventListener('scroll',set_scroll)
        
        dom.archive_window.on('mousemove',set_cursor)
        dom.archive_window.on('click',handle_click)

       

        // d3.selectAll('#cluster-nav a').on('click',(e)=>{
     
        //     update_archive_view(e.currentTarget.dataset.name);
        // })
        
        
        dom.portal.on('load',function(){
            let location=parse_archive_location(dom.portal.node().contentWindow.location.href)
            console.log(location);
        })

        generate_galaxy(galaxy_settings[current_size])
    }

    target_blank();
    heading_anchor_links();
    cycle_galleries();

    d3.select('#toggle-nav').on('click',function(){
        document.querySelector('#page-nav').classList.toggle('open')
    })

    requestAnimationFrame(update_scope);
    
}


function reset_to_galaxy(){
    dom.archive_window.classed('mousemoved',false);
    dom.archive_window.classed('no-active-transition',false)

    update_archive_view('galaxy');
    update_spotlight_mode('mouse');
    setTimeout(()=>{
        dom.archive_window.classed('no-active-transition',true)
    },10)
}

function poisson_point_place(points=[],dimensions={x:1,y:1},radius=0.05,constraints={x:[0,1],y:[0,1]}){
    let new_point={x:-1,y:-1};
    let half_r=radius*0.5;
    let attempts=0;

    let x={
        span:constraints.x[1] - constraints.x[0],
        min:constraints.x[0]
    }

    let y={
        span:constraints.y[1] - constraints.y[0],
        min:constraints.y[0]
    }

    while(new_point.x==-1&&new_point.y==-1){
        let try_coords={
            x: (x.min + x.span * Math.random())*dimensions.w,
            y:(y.min + y.span * Math.random())*dimensions.h
        };
        let in_range=points.filter(a=>{
            return a.x>try_coords.x-half_r
                 &&a.x<try_coords.x+half_r
                 &&a.y>try_coords.y-half_r
                 &&a.y<try_coords.y+half_r
        })
        let fits=true;
        for(let p of in_range){
            if(distance(p,try_coords)<radius&&attempts<50) fits=false;
        }
        if(fits) new_point=try_coords;
        else attempts++;
    }

    return new_point;

}

function distance(p0,p1){
    return Math.sqrt((p0.x - p1.x)**2 + (p0.y - p1.y)**2);
}

function generate_galaxy({n1=7,n2=30,r1=0.015,r2=0.1,pos_prop="pos"}){
    let points=[];
    let dims=win;

    


    for(let cluster of archive_clusters){
        let radius=0.05;
        let pos=cluster[pos_prop];
        let constraints={
            x:[pos.x-radius,pos.x+radius],
            y:[pos.y-radius,pos.y+radius]
        }
        for(let p=0;p<n1;p++){
            let point=poisson_point_place(points,dims,dims.w*r1,constraints);
            point.i=p;
            point.type='cluster '+cluster.name;
            points.push(point);
        }
    }

    for(let p=0;p<n2;p++){
        let point=poisson_point_place(points,dims,dims.w*r2);
        point.i=p;
        point.type='';
        points.push(point);
    }

    
    let points_mapped=points.map(a=>{
        return {
            i:a.i,
            type:a.type,
            x:a.x/dims.w,
            y:a.y/dims.h
        }
    })

    d3.select('#galaxy .stars').selectAll('span').remove();
    d3.select('#masked-content .star-shadows').selectAll('span').remove();

    d3.select('#galaxy .stars').selectAll('span').data(points_mapped,(d)=>d.type+d.i)
    .join(
        enter=>enter.append('span').text('*').attr('class',(d)=>`star ${d.type}`).style('--x',(d)=>d.x).style('--y',(d)=>d.y)
    )

    let cluster_points=points_mapped.filter(a=>a.type.includes('cluster'))

    d3.select('#masked-content .star-shadows').selectAll('span').data(cluster_points,(d)=>d.type+d.i)
    .join(
        enter=>enter.append('span').text('*').attr('class',(d)=>`star ${d.type}`).style('--x',(d)=>d.x).style('--y',(d)=>d.y)
    )

    dom.cluster_stars=d3.selectAll('.star.cluster')

}


function set_scroll(){
    scroll_y=window.scrollY;
    
    requestAnimationFrame(()=>{
        dom.body.style('--scrolly',scroll_y);
        dom.body.classed('scrolled',scroll_y>2)
        if(scroll_y>2) dom.archive_window.classed('mousemoved',false);
        dom.body.classed('transitioned-logo',scroll_y>100)

        dom.archive_window.classed('collapsed',scroll_y-100>win.h)
        document.querySelector('#go-to-about').classList.toggle('current',scroll_y-100>win.h)
    })
}

function set_size(){
    win.w= dom.archive_window.node().offsetWidth;
    dom.archive_window.style('--archive-w',win.w+'px');
    win.h= dom.archive_window.node().offsetHeight;
    dom.archive_window.style('--archive-scroll-dist',win.h);
    win.axis={x:win.w/2,y:win.h};
    dom.svg.attr('height',win.h)
    dom.svg.attr('width',win.w)
    dom.svg.attr('viewBox', `0 0 ${win.w} ${win.h}`);

    let full_win_w=window.innerWidth;
    let margin=(full_win_w - win.w) / 2;
    console.log(margin)


    let new_size=isDesktop.matches?'desktop':'mobile';
    if(new_size!==current_size){
        console.log('change size...')
        generate_galaxy(galaxy_settings[new_size])
        current_size=new_size;
    }

    // current_size


    dom.svg_back.attr('height',win.h)
    dom.svg_back.attr('width',full_win_w)
    dom.svg_back.style('width',full_win_w+'px')
    dom.svg_back.attr('viewBox', `${margin * -1} ${win.h} ${win.w + margin*2} ${win.h*2}`);
}


function set_up_logo(){
    let options = {
        threshold: 1.0,
        rootMargin:'40px'
    };
    
    let observer = new IntersectionObserver(callback, options);
    observer.observe(document.querySelector('#scope'));

    function callback(entries){
        if(entries[0].isIntersecting){
            console.log('!')
            update_scope(mouse);
        }
        
    }
}

function set_cursor(){
    if(scroll_y<=2) dom.archive_window.classed('mousemoved',true);

    mouse={
        x:mousex=event.offsetX,
        y:mousex=event.offsetY,
        changed:true
    };
    
}

function handle_click(e){
    
    if(current_view=='galaxy'&&hovered_cluster!==''&&scroll_y<=0&&isDesktop.matches){
        update_archive_view(hovered_cluster)
        update_spotlight_mode('transition');
        cluster_transition_start=performance.now();
        cluster_transition_start_pos.x=mouse.x;
        cluster_transition_start_pos.y=mouse.y;

        // dom.portal.node().setAttribute('src',base_url+'archive/'+hovered_cluster.replace(' ','-')+'-cluster')
        dom.portal.attr('src',base_url+'archive/'+hovered_cluster.replace(' ','-')+'-cluster')
        
        
        
        // console.log(dom.portal.node().contentWindow.document);
        
        
    }
}

function parse_archive_location(url=''){
    console.log('location change!',url)
    let base_url=window.location.origin+'/';
    let paths=url.replace(base_url,'').split('/').filter(a=>a.length>0&&a!=='archive'&&a!=='iyapo-repository');
    if(paths.length>0){
        update_archive_view(paths[0].replace('-cluster','').replace('-',' '));
        if(!isDesktop.matches){
            update_spotlight_mode('hide');
        }
    } else {
        reset_to_galaxy()
    }
    

    let location={
        cluster:paths[0]?.replace('-cluster','') || ''
    }


    if(paths.length>1){
        location.constellation=paths[1].replace(`${current_cluster.single}-`,'').split('-').map(a=>parseInt(a));
    }
        
    window.scroll({top:0,behavior:'smooth'});
       
    return location;

}


function portal_click(){
    console.log('iframe click')
}


function update_scope(){
    let pos=spotlight_mode=='transition'?cluster_transition_start_pos:mouse;
    // console.log('mousemove?')


    if(mouse.changed&&spotlight_mode=='mouse'||spotlight_mode=='transition'){

        let box={
            center:{x:pos.x,y:pos.y},
            top:pos.y-90,
            bot:pos.y+90,
            left:pos.x-90,
            right:pos.x+90
        }

        if(spotlight_mode=='transition'){
            let progress=(performance.now() - cluster_transition_start) / cluster_transition_duration;
            box.top=box.top * (1 - progress);
            box.left=box.left * (1 - progress);
            box.right=box.right+ (win.w - box.right) * progress;
            box.bot=box.bot+ (win.h - box.bot) * progress;
            box.center.x=box.center.x + (win.axis.x - box.center.x)*progress;
            box.center.y=box.center.y + (win.h/2 - box.center.y)*progress;

            if(progress>=1){
                update_spotlight_mode('hide');
            }
        }
        
        svg.aperture.attr('d',`M ${box.left} ${box.top} H ${box.right} V ${box.bot} H ${box.left} Z`)
        let back={
            left:win.axis.x +  (box.left - win.axis.x) * -100,
            right:win.axis.x + (box.right - win.axis.x) * -100,
            top:win.axis.y + (box.top - win.axis.y) * -100,
            bot:win.axis.y + (box.bot - win.axis.y) * -100
        }
    
    
        svg.aperture_dom.style('left',box.left+'px').style('top',box.top+'px');
        dom.masked_content.style('mask-position',`${box.left}px ${box.top}px`).style('-webkit-mask-position',`${box.left}px ${box.top}px`);
        
        let angle=Math.atan2(box.center.x-win.axis.x,box.center.y-win.axis.y);
        dom.lens.style('--rad',(-1*angle+Math.PI/2)+'rad');
        dom.lens.classed('left',pos.x<win.axis.x)
    
        let intersecting=dom.cluster_stars.filter((d,i)=>{
            let left=d.x * win.w;
            let top=d.y * win.h;
    
            return left>box.left 
                && left<box.right
                && top>box.top
                && top<box.bot;
        }).data()
        
        dom.svg.classed('intersecting-cluster',intersecting.length>0);
        hovered_cluster=intersecting.length>0?intersecting[0].type.replace('cluster ',''):'';
        svg.aperture_dom.text(hovered_cluster);
    
        update_paths({box,back})

        mouse.changed=false;
    }


    

    requestAnimationFrame(update_scope);

}

function update_paths(coords){
    svg.paths=svg.paths.data(scope_paths, d=>`${d.x}-${d.y}-${d.side}`)
        .join(
            enter=>enter.append('path').attr('class',d=>'side-'+d.side)
            .attr('data-line',d=>`${d.x}-${d.y}-${d.side}`)
            .attr('vector-effect','non-scaling-stroke')
            .attr('d',d=>{
                return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
            }).each((d,i,nodes)=>{
                d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
            }),
        update=>update.attr('d',d=>{
            return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
        }).each((d,i,nodes)=>{
            d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
        }))

    svg_back.paths=svg_back.paths.data(scope_back_paths, d=>`${d.x}-${d.y}-${d.side}`)
        .join(
            enter=>enter.append('path').attr('class',d=>'side-'+d.side)
            .attr('data-line',d=>`${d.x}-${d.y}-${d.side}`)
            .attr('vector-effect','non-scaling-stroke')
            .attr('d',d=>{
                return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
            }).each((d,i,nodes)=>{
                d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
            }),
        update=>update.attr('d',d=>{
            return `M ${win.axis.x} ${win.axis.y}  L ${coords[d.side][d.y]} ${coords[d.side][d.x]}`
        }).each((d,i,nodes)=>{
            d3.select(nodes[i]).style('--l',nodes[i].getTotalLength())
        }))
}

function cycle_galleries(){
    let galleries=Array.from(document.querySelectorAll('.gallery.carousel'));
    for(let gallery of galleries){
        let l=parseInt(gallery.dataset.length);
        set_current(0,l,gallery)
        let interval=setInterval(interval_f,5000)

        function interval_f(){
            let n=parseInt(gallery.dataset.n);
            n=n==l-1?0:n+1;
            set_current(n,l,gallery)
        }

        let buttons=Array.from(gallery.querySelectorAll('button'))
        for(let button of buttons){
            button.addEventListener('click',function(){
                let n=parseInt(gallery.dataset.n);
                if(button.classList.contains('next')) n=n==l-1?0:n+1;
                else n=n==0?l-1:n-1;
                clearInterval(interval)
                set_current(n,l,gallery)
                interval=setInterval(interval_f,5000)
            })
        }

    }

    function set_current(n,l,gallery){
        gallery.dataset.n=n;
        for(let slide of Array.from(gallery.querySelectorAll('.slide') )){
            let i=slide.dataset.i;
            slide.classList.toggle(
                "active",
                i==n
            )
        }
    }
}


function heading_anchor_links(){
    for(let h2 of document.querySelectorAll('.prose h2')){
        
        h2.addEventListener('click',()=>{
            console.log('copy h2',h2.id)
            if (!window.isSecureContext) {
                console.log('copy failed');
                return;
            }
            navigator.clipboard
                .writeText(`${window.location.toString().split('#')[0]}#${h2.parentNode.id}`);
        })
    }
}

function target_blank(){
    document.querySelectorAll('a').forEach(link=>{
        if(link.host!==window.location.host){
            link.setAttribute('target', '_blank');
        }
    })
}