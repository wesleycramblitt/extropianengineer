
document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(Draggable,DrawSVGPlugin,EaselPlugin,Flip,GSDevTools,InertiaPlugin,MotionPathHelper,MotionPathPlugin,MorphSVGPlugin,Observer,Physics2DPlugin,PhysicsPropsPlugin,PixiPlugin,ScrambleTextPlugin,ScrollTrigger,ScrollSmoother,ScrollToPlugin,SplitText,TextPlugin,RoughEase,ExpoScaleEase,SlowMo,CustomEase,CustomBounce,CustomWiggle)

      //Scramble header
    gsap.to(document.getElementById("hero"), {duration: 1, scrambleText: "Wes Cramblitt"});

    gsap.to(document.getElementById("hero2"), {duration: 1, scrambleText: "Scientific Software Engineer"});
         
    gsap.to(document.getElementById("hero3"), {duration: 1, scrambleText: "C++ | OpenGL | Javascript | Python"});
})

