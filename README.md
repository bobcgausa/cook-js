# Welcome to Box2D Physics for P5!

## How Does This Work?

b2.js is a library to add Box2D support (http://box2d.org/) to P5.  box2d-html5.js is also included as it contains Box2D.  There is a tutorial with many links to JSFiddle examples here (http://professorcook.org/CHAPphysics.pdf).

# Welcome to Particles for P5! (note: doesn't use physics)

* [How Does This Work?](#how-does-this-work)
* [Particle](#particle)
* [Fountain](#fountain)
* [Issues](#issues)
* [License](#license)


## How Does This Work?

p5.particle.js is a library to add particle support to [p5.js](http://p5js.org/).
Click https://editor.p5js.org/Bobcook47/sketches/-89EdNdlO to see examples.
This repository contains two projects: a Box2D physics library and a Particle library.
The Particle library does not use the physics library; they are separate.
Use https://rawgit.com/bobcgausa/cook-js/master/p5.particle.js to include particles in your project.

## Particle
A Particle object is simply a data definition.  There are no methods. 
The data fields consist only of properties that are likely to vary on a per-particle basis.
Properties that are common to all particles, such as gravity, are defined in the parent Fountain.
Since particles are so numerous, every effort was made to minimize the size of their structure definition.
For example, per-particle properties, such as color, that can be derived from a particle's id or life are factored
out into its Fountain definition.

The Fountain's particle creation function returns a Particle object so that it is easy for users to add additional, 
per-particle properties.

A Particle terminates and is deallocated when 1) its "life" is greater than or equal one, 2) its "partSize" is less than 0.1,
or 3) its "location" is greater than the canvas height.

```
function Particle() {
  this.velocity = createVector();  // applied to location every Step
  this.partSize = 0;               // typically width and height, scale factor for images ( 1 means no scaling)
  this.location = createVector();  // center of all shapes and images
  this.life = 0;                   // 0 to 1
  this.rotation = 0;               // in degrees
  this.id = 0;                     // unique id counter per Fountain
}
```

## Fountain

A Fountain object encapsulates all the properties needed for Particle creation.
A Fountain definition is data driven.
The input can come from a user-created object, or a JSON file or string.

```
// xy, if present, overrides the data input location
// (JSON object, name of a particle definition) OR
// (null, user-created particle definition)
Fountain(defs, nameOrF [ , x, y]);

var x = new Fountain(null, objectDef);

x.length  // number of active particles
x.left    // number of particles left to create
x.done    // Fountain has generated all particles and they have all terminated

x.Draw();  // Draw all particles  NOTE: may need to surround with push/pop to prevent side effects 
x.Step();  // Step all particles, e.g. location.add(velocity)
x.Stop();  // Set left=0 and clear all active particles
x.Create( [ x, y [, angle]]);  // Create one particle, returns a Particle object or null if left==0
x.CreateN( [ x, y [, angle]]); // Uses a Fountain's "rate" property to create bursts of particles
```

Particle drawing is totally up to the user.
The following function can be called to extend the set of default drawing routines.

```
function Fountain_display(name, proc) {
  fdisplay[name] = proc;
}
```

Here is an example of one of the default drawing routines (shape name "point").
Note that the choice of color changes as the "life" property progresses from 0 to 1.

```
function fpoint(fountain, particle) {
  stroke(fountain.colors[Math.floor(particle.life*fountain.colors.length)]);
  noFill();
  point(particle.location.x, particle.location.y);
}
```

The default shape options for drawing are listed next:

* `ellipse`: filled ellipse partSize x partSize, color based on life, no rotation
* `ellipse2`: filled ellipse partSize x partSize, color based on id, no rotation
* `image`: tinted image, color based on life, rotated by angle, and scaled by partSize
* `point: point, color based on life
* `rect`: filled rectangle partSize x partSize, color based on life, no rotation

Examples can be found at [jsfiddle.net](http://jsfiddle.net/bobcook/cr1t6fzg/):

* [Particle #1 JSON Example](http://jsfiddle.net/bobcook/cr1t6fzg/)
* [Particle #2 User Structure](http://jsfiddle.net/bobcook/53h2uss8/)
* [Particle #3 User Drawing Function](http://jsfiddle.net/bobcook/mph714p8/)
* [Particle #4 Vary speed with speedx](http://jsfiddle.net/bobcook/en4he5vt/)
* [Particle #5 Generation patterns with rate](http://jsfiddle.net/bobcook/rLvhc8h2/)

TESTING: Tested on Internet Explorer, Firefox, Chrome, ChromeBook, Edge

## Fountain/Particle Definition Properties

The object definition passed to the Fountain constructor can be user-defined or JSON as follows:

```
var t = '{' +
        '    "parts": [' +
        '      {' +
        '        "name": "foo",' +
        '        "color": ["yellow"]' +
        '      }' +
        '    ]
        '}';

var u = {
  name: "test",
  size: [2,8],
  angle: [250, 290],
  color: ["blue"],
  rate: [200,10,200,0]
};

defs = JSON.parse(t);
of = new Fountain(defs, 'foo');
of2 = new Fountain(null, u);
```

* `acceleration`: added to velocity on every step, default 0, omitted if gravity is specified
* `angle[a,b]`: random directional angle in degrees, default [0,0], initial velocity = angle*speed
* `color[a...]`: array of color names or [r,g,b,a], sets this.colors, indexed by "life" fraction when drawing
* `dxy[a,b]`: fraction of screen width/height, centered at xy, [-a:a,-b:b] defines generation box, default [0,0]
* `file`: path string for an image file, sets this.image and this.f.image equal to loadImage
          note: file must be preloaded
* `gravity`: applied to velocity.y at every Step, default 0.01, omitted if acceleration is specified
* `lifetime`: number of steps for each particle to live, default 99999999
* `limit`: number of particles to generate, default 99999999
* `rate[a,b...]`: array of pairs [repeatCount, 1 to particles-to-generate-per-CreateN], default [0,1], cycles
* `rotation`: angular velocity in degrees, default 0
* `shape`: string name of a "Draw" routine set by Fountain_display, default "ellipse"
* `size[a,b]`: randomly sets partSize between a and b if a != b, default [2,2]
* `sizePercent`: grow or shrink partSize on every Step, default 1
* `speed`: determines initial velocity, default 1
* `speedx`: random add-on to speed at particle creation [-speedx,speedx], default 0
* `x`: fraction of screen width
* `y`: fraction of screen height

## Issues

Report issues in this repo to kindlecbook at gmail.com

## License

There is no license.  Use as you wish.
