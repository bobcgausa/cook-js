# Welcome to Particles for P5!

* [How Does This Work?](#how-does-this-work)
* [Particle](#particle)
* [Fountain](#fountain)
* [Issues](#issues)
* [License](#license)


## How Does This Work?

p5.particle is a library to add particle support to [p5.js](http://p5js.org/).

## Particle
A Particle object is simply a data definition.  There are no methods. 
The data fields consist only of properties that are likely to vary on a per-particle basis.
Properties that are common to all particles, such as gravity, are defined in the parent Fountain.
Further, per-particle properties, such as color, that can be derived from a particle's id or life are also factored
out into its Fountain definition.

The Fountain's particle creation function returns a Particle object so that it is easy for users to add additional, 
per-particle properties.

A Particle terminates and is deallocated when 1) its "life" is greater than or equal one, 2) its "partSize" is less than 0.1,
or 3) its "location" is greater than the canvas height.

function Particle() {<br>
  this.velocity = createVector();  // applied to location every Step<br>
  this.partSize = 0;               // typically width and height, scale factor for images ( 1 means no scaling)<br>
  this.location = createVector();  // center of all shapes and images<br>
  this.life = 0;                   // 0 to 1<br>
  this.rotation = 0;               // in degrees<br>
  this.id = 0;                     // unique id counter per Fountain<br>
}

## Fountain
A Fountain object encapsulates all the properties needed for Particle creation.
A Fountain definition is data driven.
The input can come from a user-created object, or a JSON file or string.

Fountain(defs, nameOrF [ , x, y]) // xy, if present, override the data input location<br>
(JSON object, name of a particle definition) OR<br>
(null, user-created particle definition)

var x = new Fountain(null, objectDef);

x.length  // number of active particles<br>
x.left    // number of particles left to create<br>
x.done    // Fountain has generated all particles and they have all terminated

x.Draw();  // Draw all particles<br>
x.Step();  // Step all particles, e.g. location.add(velocity)<br>
x.Stop();  // Set left=0 and clear all active particles<br>
x.Create( [ x, y [, angle]]);  // Create one particle, returns a Particle object or null if left==0<br>
x.CreateN( [ x, y [, angle]]); // Uses a Fountain's "rate" property to create bursts of particles

Particle drawing is totally up to the user.
The following function can be called to extend the set of default drawing routines.

function Fountain_display(name, proc) {<br>
  fdisplay[name] = proc;<br>
}

Here is an example of one of the default drawing routines (shape name "point").
Note that the choice of color changes as the "life" property progresses from 0 to 1.

function fpoint(fountain, particle) {<br>
stroke(fountain.colors[Math.floor(particle.life*fountain.colors.length)]);<br>
    noFill(); <br>  
    point(particle.location.x, particle.location.y);<br>
}

The default shape options for drawing are listed next:<br>
"ellipse"_____filled ellipse partSize x partSize, color based on life<br>
"ellipse2"____filled ellipse partSize x partSize, color based on id<br>
"image"_____tinted image, color based on life, rotated by angle, and scaled by partSize<br>
"point"_______point, color based on life<br>
"rect"________filled rectangle partSize x partSize, color based on life, no rotation<br>


Examples can be found at [jsfiddle.net](http://jsfiddle.net/bobcook/cr1t6fzg/).<br>
[Particle #1 JSON Example](http://jsfiddle.net/bobcook/cr1t6fzg/)<br>
[Particle #2 User Structure](http://jsfiddle.net/bobcook/53h2uss8/)<br>
[Particle #3 User Drawing Function](http://jsfiddle.net/bobcook/mph714p8/)<br>
[Particle #4 Vary speed with speedx](http://jsfiddle.net/bobcook/en4he5vt/)<br>
[Particle #5 Generation patterns with rate](http://jsfiddle.net/bobcook/rLvhc8h2/)

TESTING: Tested on Internet Explorer, Firefox, Chrome, ChromeBook, Edge

## Fountain/Particle Definition Properties
The object definition passed to the Fountain constructor can be user-defined or JSON as follows:<br>

var t =<br>
        '{   ' +<br>
        '    "parts": [   ' +<br>
        '    {   ' +<br>
        '    "name": "foo",   ' +<br>
        '    "color":   ' +<br>
        '    ["yellow"]   ' +<br>
'}]}';<br>

    var u = <br>
    {name: "test",<br>
     size: [2,8],<br>
     angle: [250, 290],<br>
     color: ["blue"],<br>
     rate: [200,10,200,0]<br>
    };<br>
    defs = JSON.parse(t);<br>
    of = new Fountain(defs, 'foo');<br>
    of2 = new Fountain(null, u);
    
acceleration_added to velocity on every step, default 0, omitted if gravity is specified<br>
angle[a,b]___random directional angle in degrees, default [0,0], initial velocity = angle*speed<br>
colors[a...]_array of color names or [r,g,b,a], sets this.colors, indexed by "life" fraction when drawing<br>
dxy[a,b]_____fraction of screen width/height, centered at xy, [-a:a,-b:b] defines generation box, default [0,0]<br>
file_________path string for an image file, sets this.image and this.f.image equal to loadImage<br>
gravity______applied to velocity.y at every Step, default 0.01, omitted if acceleration is specified<br>
lifetime_____number of steps for each particle to live, default 99999999<br>
limit________number of particles to generate, default 99999999<br>
rate[a,b...]_array of pairs [count, particles-to-generate-per-CreateN], default [0,1], cycles<br>
rotation_____angular velocity in degrees, default 0<br>
shape________string name of a "Draw" routine set by Fountain_display, default "ellipse"<br>
size[a,b]____randomly sets partSize, default [2,2]<br>
sizePercent__grow or shrink partSize on every Step, default 1<br>
speed________determines initial velocity, default 1<br>
speedx_______random add-on to speed at particle creation [-speedx,speedx], default 0<br>
x____________fraction of screen width<br>
y____________fraction of screen height

## Issues
Report issues in this repo to kindlecbook at gmail.com

## License
There is no license.  Use as you wish.
