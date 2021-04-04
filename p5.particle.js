// by Bob Cook, professorcook.org
// questions/problems/suggestions kindlecbook at gmail.com
function frect(fountain, particle) {
    fill(fountain.colors[Math.floor(particle.life*fountain.colors.length)]);
    noStroke();   
    rect(particle.location.x, particle.location.y, particle.partSize, particle.partSize);
}

function fellipse(fountain, particle) {
    fill(fountain.colors[Math.floor(particle.life*fountain.colors.length)]);
    noStroke();   
    ellipse(particle.location.x, particle.location.y, particle.partSize, particle.partSize);
}

function fellipse2(fountain, particle) {
    fill(fountain.colors[particle.id%fountain.colors.length]);
    noStroke();   
    ellipse(particle.location.x, particle.location.y, particle.partSize, particle.partSize);
}

function imagetint(fount, img, index, color) {
  if (fount.icache === undefined) fount.icache = [];
  var x = fount.icache[index];
  if (x) return x;
  var A = color.rgba[3]/255;
  x = img.get();
  x.loadPixels();
  var n = x.pixels.length;
  if (color.rgba[0]==255 && color.rgba[1]==255 && color.rgba[2]==255) {
    for (var i = 3; i < n; i+=4) {
      var j = x.pixels[i];
      if (j==0) continue;
      x.pixels[i] *= A;
    }
  } else {
    var R = color.rgba[0]/255;
    var G = color.rgba[1]/255;
    var B = color.rgba[2]/255;
    for (var i = 0; i < n; i+=4) {
      var j = x.pixels[i+3];
      if (j==0) continue;
      x.pixels[i] *= R;
      x.pixels[i+1] *= G;
      x.pixels[i+2] *= B;
      x.pixels[i+3] = j*A;
    }
  }
  x.updatePixels();
  fount.icache[index] = x;
  return x;
}

function fimage(fountain, particle) {
   var i = Math.floor(particle.life*fountain.colors.length);
   var c = fountain.colors[i];
   if (alpha(c)==0) return;
   var img = fountain.f.image;
   if (alpha(c)!=255 || red(c)!=255 || green(c)!=255 || blue(c)!=255) {
    tint(c);
   }
    noStroke();
    if (particle.rotation==0 && particle.partSize == 1) {
      image(img, particle.location.x, particle.location.y);
      noTint();
      return;
    }
    push();
    translate(particle.location.x, particle.location.y);  
    rotate(particle.rotation);
    scale(particle.partSize);    
    image(img, 0, 0);
    pop();
    noTint();
}

function fpoint(fountain, particle) {
       
stroke(fountain.colors[Math.floor(particle.life*fountain.colors.length)]);
    noFill();   
    point(particle.location.x, particle.location.y);
}

var fdisplay = {ellipse: fellipse, rect: frect, image: fimage, point: fpoint, ellipse2: fellipse2};
function Particle() {
  this.velocity = createVector();
  this.partSize = 0;
  this.location = createVector();
  this.life = 0;
  this.rotation = 0;
  this.id = 0;
}
var Fountain_random = [];
var Fountain_randomNo = 200;

function Fountain(defs, nameOrF, x, y) {
    while (Fountain_randomNo > Fountain_random.length-1)
      Fountain_random.push(random());
    this.irand = int(random(0,Fountain_random.length-1));
    this.particles = [];
    this.n = 1;
    this.id = 0;
    this.dxy = null;
    if (defs!=null) {
      for (var i = 0; i < defs.parts.length; i++)
        if (defs.parts[i].name == nameOrF) {
          this.init(defs.parts[i], x, y);
        }
    } else this.init(nameOrF, x, y);
    Object.defineProperties(this, {
        "length": {
            "get": function () {
                return this.particles.length;
            }
        }
    });
    Object.defineProperties(this, {
        "left": {
            "get": function () {
                return this.n;
            }
        }
    });
    Object.defineProperties(this, {
        "done": {
            "get": function () {
                return this.n <= 0 && this.particles.length==0;
            }
        }
    });
}

Fountain.prototype.init = function(defs, x, y) {
  this.f = defs;
  this.location = createVector(x || width*this.f.x,
                               y || height*this.f.y);
  if (this.f.dxy) this.dxy =
    createVector(width*this.f.dxy[0], height*this.f.dxy[1]);
  this.n = this.f.limit||99999999;
  this.draw = fdisplay[this.f.shape||"ellipse"];
  this.f.rotation = this.f.rotation || 0;
  this.step = 0;
  this.f.rate = this.f.rate||[0,1];
  this.count = this.f.rate[0];
  this.f.angle = this.f.angle||[0,0];
  this.f.speed = this.f.speed||1;
  this.f.speedx = this.f.speedx||0;
  this.f.size = this.f.size||[2,2];
  this.f.gravity = this.f.gravity||0.01;
  this.f.sizePercent = this.f.sizePercent||1;
  this.f.lifetime = this.f.lifetime||99999999;
  if (this.f.acceleration) this.f.acceleration = createVector(this.f.acceleration[0], this.f.acceleration[1]);
  if (this.f.file) {
    if (!this.f.image) this.f.image = loadImage(this.f.file);
    this.image = this.f.image;
  }
  if (!this.f.colors) {
    this.f.colors = [];
    for (var j=0; j<this.f.color.length; j++)
      this.f.colors[j] = color(this.f.color[j]);
  }
  this.colors = this.f.colors; //for sharing across fountains
}

function Fountain_display(name, proc) {
  fdisplay[name] = proc;
}

Fountain.prototype.random = function (a,b) {
 if (a == b) return a;
 return (b-a)*Fountain_random[this.irand++%Fountain_randomNo]+a;
}
 
Fountain.prototype.Draw = function () {
  push(); imageMode(CENTER); angleMode(DEGREES); rectMode(CENTER); ellipseMode(CENTER);
  for (var x = this.particles.length-1; x >= 0 ; x--) {
    this.draw(this, this.particles[x]);
  }
  pop();
}

Fountain.prototype.CreateN = function(x, y, ang) {
  var i, k = this.f.rate[this.step+1];
  if (k < 1) {
    if (k!=0 && this.random(0,1) > k) return;
    i = this.count; this.count = 0;
  } else i = this.random(1,k);
  for (var j=0; j<i; j++) this.Create(x, y, ang);
  if (--this.count <= 0) {
    this.step = (this.step+2)%this.f.rate.length;
    this.count = this.f.rate[this.step];
  }
}

Fountain.prototype.Create = function(x, y, ang) {
  if (this.n-- <= 0) return null;
  var ps = new Particle();
  var angle = ang || this.random(this.f.angle[0], this.f.angle[1]);
  var speed = this.f.speed;
  var sx = this.f.speedx;
  if (sx) speed += this.random(-sx, sx);
  if (this.f.acceleration) ps.acceleration = this.f.acceleration;
  ps.velocity.set(cos(radians(angle))*speed,
                    sin(radians(angle)) * speed);
  ps.partSize = this.random(this.f.size[0], this.f.size[1]);
  if (this.f.rotation!=0) ps.rotation = this.random(0,360);
  ps.location.set(x === undefined ? this.location.x : x,
                  y === undefined ? this.location.y : y);
  if (this.dxy != null) {
    ps.location.add(this.random(-this.dxy.x,this.dxy.x),
                    this.random(-this.dxy.y,this.dxy.y));
  }
  ps.id = this.id++;
  this.particles.push(ps);
  return ps;
}
Fountain.prototype.StepOne = function(i) {
  var particle = this.particles[i];
  // add the velocity to the positions
  if (particle.acceleration) {
    particle.location.add(particle.velocity);
    particle.velocity.add(particle.acceleration);
  } else {
    particle.location.add(particle.velocity);
    // add some gravity
    particle.velocity.y += this.f.gravity;
  }
  // make the particles shrink
  particle.partSize *= this.f.sizePercent;
  particle.rotation += this.f.rotation;
  particle.life += 1.0/this.f.lifetime;
  if (particle.partSize < 0.1 || 
      particle.location.y > height+particle.partSize || 
      particle.life >= 1) {
        this.particles.splice(i, 1);
        return true;
      }
    return false; //if not deleted
}
Fountain.prototype.Step = function() {
 for (var x = 0; x < this.particles.length; x++) {
  this.StepOne(x);
 }
}
Fountain.prototype.Stop = function() {
  this.n=0;
  this.particles = [];
}
