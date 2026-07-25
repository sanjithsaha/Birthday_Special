(() => {

const layer = document.createElement("div");
layer.id = "sparkle-layer";
document.body.appendChild(layer);

const style = document.createElement("style");
style.textContent = `
#sparkle-layer{
position:fixed;
inset:0;
pointer-events:none;
overflow:hidden;
z-index:9999;
}

.sparkle{
position:absolute;
width:8px;
height:8px;
border-radius:50%;
background:radial-gradient(circle,#ffffff,#ffd54f,#f472b6);
box-shadow:
0 0 8px #ffffff,
0 0 18px #ffd54f,
0 0 35px #f472b6;
transform:translate(-50%,-50%);
}
`;
document.head.appendChild(style);

window.magicSparkles = function(x,y){

    for(let i=0;i<80;i++){

        const s=document.createElement("div");
        s.className="sparkle";

        s.style.left=x+"px";
        s.style.top=y+"px";

        layer.appendChild(s);

        const angle=Math.random()*Math.PI*2;
        const distance=80+Math.random()*220;

        gsap.fromTo(s,
        {
            scale:1,
            opacity:1
        },
        {
            duration:1.4,
            x:Math.cos(angle)*distance,
            y:Math.sin(angle)*distance,
            scale:0,
            opacity:0,
            rotation:Math.random()*720,
            ease:"power3.out",
            onComplete:()=>s.remove()
        });

    }

};

})();
