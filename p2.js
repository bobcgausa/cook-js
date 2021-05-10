var b2world;
var b2bods = [];
var b2new = [];
var b2scaleFactor = 30;
var b2contacts = [];
var box2d = planck;

var b2V = function (x, y) {
  return new box2d.Vec2(x, y);
};
var b2newWorld = function (scaleFactor, gravityVector) {
  // Initialize box2d physics and create the world
  b2world = new box2d.World(gravityVector, true);
  b2scaleFactor = scaleFactor;
  b2setWorld();
  return b2world;
};

//box2d degrades as distance from 0,0 increases
//"If your world units become larger than -1 to 1 kilometer,
//then the lost precision can affect stability."
//or a pixel limit of scale*1000 with origin at 0
//default is to leave out-of-view space so that objects
//can leave the scene and reappear without deletion
function b2setWorld(x, y, w, h) {
  //x is left boundary, y is center
  b2world.width = w == undefined ? width * 2 : w;
  b2world.height = h == undefined ? height * 2 : h;
  b2world.x = x == undefined ? -width * 0.5 : x;
  b2world.y = y == undefined ? height * 0.5 : x;
  b2world.origin = b2V(0, 0);
}
function b2getWorld() {
  //lower left, top right
  return new box2d.AABB(
    b2V(b2world.x, b2world.y + b2world.width / 2),
    b2V(b2world.x + b2world.width, b2world.y - b2world.width / 2)
  );
}
function b2setOrigin(v) {
  b2world.origin = v;
}
function b2getOrigin(v) {
  return b2world.origin;
}
function b2shiftOrigin(v) {
  b2world.origin.add(v);
}

var b2scaleTo = function (a) {
  return box2d.Vec2(a.x / b2scaleFactor, a.y / b2scaleFactor);
};

var b2scalexyTo = function (x, y) {
  return box2d.Vec2(x / b2scaleFactor, y / b2scaleFactor);
};

var b2scaleFrom = function (a) {
  return createVector(a.x * b2scaleFactor, a.y * b2scaleFactor);
};

function b2scalexTo(x) {
  return x / b2scaleFactor;
}

function b2scalexFrom(x) {
  return x * b2scaleFactor;
}

function b2getBodyFromBox2d(box2dBody) {
  return box2dBody.m_userData.body;
}

function b2Update(timeScale, forceStep, positionStep) {
  // 2nd and 3rd arguments are velocity and position iterations
  b2world.step(timeScale || 1 / 30, forceStep || 8, positionStep || 4);
  if (b2contacts.length == 0) return;
  for (var i = 0; i < b2contacts.length; i += 2) {
    if (b2contacts[i].m_userData.body.m_collision != null) {
      b2contacts[i].m_userData.body.m_collision(
        b2contacts[i],
        b2contacts[i + 1]
      );
    } else if (b2contacts[i + 1].m_userData.body.m_collision != null) {
      b2contacts[i + 1].m_userData.body.m_collision(
        b2contacts[i + 1],
        b2contacts[i]
      );
    }
  }
  b2contacts = [];
}

function b2Draw(debug) {
  push();
  imageMode(CENTER);
  rectMode(CENTER);
  ellipseMode(CENTER);
  angleMode(RADIANS);
  var i = -1;
  while (++i < b2bods.length) {
    if (!b2bods[i].body.isActive()) {
      b2world.destroyBody(b2bods[i].body);
      if (i > 0) b2bods[i] = b2bods[b2bods.length - 1];
      b2bods.pop();
      continue;
    }
    var pos = b2bods[i].position;
    if (pos.x < b2world.x || pos.x > b2world.x + b2world.width) {
      b2bods[i].destroy();
      continue;
    }
    if (
      pos.y < b2world.y - b2world.height * 0.5 ||
      pos.y > b2world.y + b2world.height * 0.5
    ) {
      b2bods[i].destroy();
      continue;
    }
    if (this.m_life-- < 0) {
      b2bods[i].destroy();
      continue;
    }
    if (!b2bods[i].m_visible) continue;
    translate(-b2world.origin.x+pos.x, -b2world.origin.y+pos.y);
    var a = b2bods[i].body.getAngle();
    if (a != 0) rotate(a);
    if (b2bods[i].m_display) {
      push(); b2bods[i].m_display(b2bods[i]); pop();
    } else b2bods[i].draw();
    resetMatrix();
  }
  if (debug) b2debugDraw(this.canvas, b2scaleFactor, b2world);
  while (b2new.length > 0) b2bods.push(b2new.pop());
  pop();
}

b2Body.prototype.destroy = function () {
  this.body.SetActive(false);
};

function b2Destroy() {
  for (var i = 0; i < b2new.length; i++) b2world.destroyBody(b2new[i].body);
  b2new = [];
  for (var i = 0; i < b2bods.length; i++) b2world.destroyBody(b2bods[i].body);
  b2bods = [];
}

var b2getBodyFromFixture = function (fixture) {
  return fixture.m_body.m_userData.body;
};

function b2Body(type, dynamic, xy, wh, props) {
  var v = b2scaleTo(xy);
  if (dynamic) this.body = b2world.createDynamicBody(v);
  else this.body = b2world.createBody(v);
  if (props == undefined) props = {};
  this.m_life = props.life || 10000000;
  if (props.collision) {
    this.m_collision = props.collision;
    b2world.on("begin-contact", b2Listener);
  }
  this.m_visible = props.visible == undefined ? true : props.visible;
  this.m_display = props.display || null;
  var temp = props.userData || null;
  var temp2 = props.angle || 0;
  props.angle = 0;
  this.body.m_userData = { body: this, user: temp };
  b2new.push(this);
  if (temp) props.userData = null;
  this.addTo(type, b2V(0, 0), wh, props);
  if (temp2 != 0) this.body.setAngle(temp2);
  if (temp) props.userData = temp;
  props.angle = temp2;
  Object.defineProperties(this, {
    aabb: {
      get: function () {
        return b2getAABB(this);
      },
    },
  });
  Object.defineProperties(this, {
    active: {
      get: function () {
        return this.body.isActive();
      },
      set: function (x) {
        this.body.setActive(x);
      },
    },
  });
  Object.defineProperties(this, {
    advance: {
      set: function (x) {
        this.body.advance(x);
      },
    },
  });
  Object.defineProperties(this, {
    angle: {
      get: function () {
        return this.body.getAngle();
      },
      set: function (x) {
        this.body.setAngle(x);
      },
    },
  });
  Object.defineProperties(this, {
    angularDamping: {
      get: function () {
        return this.body.getAngularDamping();
      },
      set: function (x) {
        this.body.setAngularDamping(x);
      },
    },
  });
  Object.defineProperties(this, {
    angularImpulse: {
      set: function (x) {
        this.body.applyAngularImpulse(x, true);
      },
    },
  });
  Object.defineProperties(this, {
    angularVelocity: {
      get: function () {
        return this.body.getAngularVelocity();
      },
      set: function (x) {
        this.body.setAngularVelocity(x);
      },
    },
  });
  Object.defineProperties(this, {
    awake: {
      get: function () {
        return this.body.isAwake();
      },
      set: function (x) {
        this.body.setAwake(x);
      },
    },
  });
  Object.defineProperties(this, {
    bullet: {
      get: function () {
        return this.body.isBullet();
      },
      set: function (x) {
        this.body.setBullet(x);
      },
    },
  });
  Object.defineProperties(this, {
    // offset from position
    centerOfMass: {
      get: function () {
        return b2scaleFrom(this.body.getWorldCenter());
      },
    },
  });
  Object.defineProperties(this, {
    collision: {
      get: function () {
        return this.m_collision;
      },
      set: function (x) {
        this.m_collision = x;
        b2world.on("begin-contact", b2Listener);
      },
    },
  });
  Object.defineProperties(this, {
    density: {
      get: function () {
        return this.body.m_fixtureList.getDensity();
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.setDensity(x);
        }
      },
    },
  });
  Object.defineProperties(this, {
    display: {
      get: function () {
        return this.m_display;
      },
      set: function (x) {
        this.m_display = x;
      },
    },
  });
  Object.defineProperties(this, {
    dynamic: {
      get: function () {
        return this.body.isDynamic();
      },
      set: function (x) {
        if (x) this.body.setDynamic();
      },
    },
  });
  Object.defineProperties(this, {
    filterCategoryBits: {
      get: function () {
        return this.body.m_fixtureList.m_filterCategoryBits;
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.m_filterCategoryBits = x;
        }
      },
    },
  });
  Object.defineProperties(this, {
    filterMaskBits: {
      get: function () {
        return this.body.m_fixtureList.m_filterMaskBits;
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.m_filterMaskBits = x;
        }
      },
    },
  });
  Object.defineProperties(this, {
    filterGroupIndex: {
      get: function () {
        return this.body.m_fixtureList.m_filterGroupIndex;
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.m_filterGroupIndex = x;
        }
      },
    },
  });
  Object.defineProperties(this, {
    fixedRotation: {
      get: function () {
        return this.body.isFixedRotation();
      },
      set: function (x) {
        this.body.setFixedRotation(x);
      },
    },
  });
  Object.defineProperties(this, {
    fixtureList: {
      get: function () {
        return this.body.getFixtureList();
      },
    },
  });
  Object.defineProperties(this, {
    fixture: {
      get: function () {
        return this.body.getFixtureList();
      },
    },
  });
  Object.defineProperties(this, {
    force: {
      set: function (x) {
        this.body.applyForceToCenter(x, true);
      },
    },
  });
  Object.defineProperties(this, {
    friction: {
      get: function () {
        return this.body.m_fixtureList.getFriction();
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.setFriction(x);
        }
      },
    },
  });
  Object.defineProperties(this, {
    gravityScale: {
      get: function () {
        return this.body.getGravityScale();
      },
      set: function (x) {
        this.body.setGravityScale(x);
      },
    },
  });
  Object.defineProperties(this, {
    image: {
      get: function () {
        return this.fixture.m_image;
      },
      set: function (x) {
        this.fixture.m_image = x;
      },
    },
  });
  Object.defineProperties(this, {
    imageResize: {
      get: function () {
        return this.fixture.m_imageResize;
      },
      set: function (x) {
        this.fixture.m_imageResize = x;
      },
    },
  });
  Object.defineProperties(this, {
    impulse: {
      set: function (x) {
        this.body.applyLinearImpulse(x, this.body.getWorldCenter(), true);
      },
    },
  });
  Object.defineProperties(this, {
    inertia: {
      get: function () {
        return this.body.getInertia();
      },
    },
  });
  Object.defineProperties(this, {
    jointList: {
      get: function () {
        return this.body.getJointList();
      },
    },
  });
  Object.defineProperties(this, {
    kinematic: {
      get: function () {
        return this.body.isKinematic();
      },
      set: function (x) {
        if (x) this.body.setKinematic();
      },
    },
  });
  Object.defineProperties(this, {
    life: {
      get: function () {
        return this.m_life;
      },
      set: function (x) {
        this.m_life = x;
      },
    },
  });
  Object.defineProperties(this, {
    linearDamping: {
      get: function () {
        return this.body.getLinearDamping();
      },
      set: function (x) {
        this.body.setLinearDamping(x);
      },
    },
  });
  Object.defineProperties(this, {
    linearVelocity: {
      get: function () {
        return this.body.getLinearVelocity();
      },
      set: function (x) {
        this.body.setLinearVelocity(x);
      },
    },
  });
  Object.defineProperties(this, {
    // offset from position
    localCenter: {
      get: function () {
        return b2scaleFrom(this.body.getLocalCenter());
      },
    },
  });
  Object.defineProperties(this, {
    mass: {
      get: function () {
        return this.body.getMass();
      },
    },
  });
  Object.defineProperties(this, {
    massData: {
      get: function () {
        var t = { I: 0, center: b2V(0, 0), mass: 0 };
        this.body.getMassData(t);
        t.center = b2scaleFrom(t.center);
      },
      set: function (x) {
        x.center = b2scaleTo(x.center);
        this.body.setMassData(x);
      },
    },
  });
  Object.defineProperties(this, {
    next: {
      get: function () {
        return this.body.getNext();
      },
    },
  });
  Object.defineProperties(this, {
    position: {
      get: function () {
        return b2scaleFrom(this.body.getPosition());
      },
      set: function (x) {
        this.body.setPosition(b2scaleTo(x));
      },
    },
  });
  Object.defineProperties(this, {
    restitution: {
      get: function () {
        return this.body.m_fixtureList.getRestitution();
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.setRestitution(x);
        }
      },
    },
  });
  Object.defineProperties(this, {
    sensor: {
      get: function () {
        return this.body.m_fixtureList.isSensor();
      },
      set: function (x) {
        for (
          var fixture = this.body.getFixtureList();
          fixture;
          fixture = fixture.getNext()
        ) {
          fixture.setSensor(x);
        }
      },
    },
  });
  Object.defineProperties(this, {
    sleepingAllowed: {
      get: function () {
        return this.body.isSleepingAllowed();
      },
      set: function (x) {
        this.body.setSleepingAllowed(x);
      },
    },
  });
  Object.defineProperties(this, {
    static: {
      get: function () {
        return this.body.isStatic();
      },
      set: function (x) {
        if (x) this.body.setStatic();
      },
    },
  });
  Object.defineProperties(this, {
    torque: {
      set: function (x) {
        this.body.applyTorque(x, true);
      },
    },
  });
  Object.defineProperties(this, {
    transform: {
      get: function () {
        var t = this.body.getTransform();
        return { position: b2scaleFrom(t.p), angle: asin(t.q.s) };
      },
      set: function (x) {
        this.body.setTransform(b2scaleTo(x.position), x.angle);
      },
    },
  });
  Object.defineProperties(this, {
    userData: {
      get: function () {
        return this.body.m_userData.user;
      },
      set: function (x) {
        this.body.m_userData.user = x;
      },
    },
  });
  Object.defineProperties(this, {
    visible: {
      get: function () {
        return this.m_visible;
      },
      set: function (x) {
        this.m_visible = x;
      },
    },
  });
  Object.defineProperties(this, {
    world: {
      get: function () {
        return this.body.getWorld();
      },
    },
  });
  Object.defineProperties(this, {
    // offset from position
    worldCenter: {
      get: function () {
        return b2scaleFrom(this.body.getWorldCenter());
      },
    },
  });
  Object.defineProperties(this, {
    // offset from position
    worldLocked: {
      get: function () {
        return this.body.isWorldLocked();
      },
    },
  });
}

b2Body.prototype.applyForce = function (force, position) {
  this.body.applyForce(force, b2scaleTo(position), true);
};
b2Body.prototype.applyImpulse = function (force, position) {
  this.body.applyLinearImpulse(force, b2scaleTo(position), true);
};
b2Body.prototype.destroyFixture = function (fixture) {
  this.body.destroyFixture(fixture);
};
b2Body.prototype.velocityFromLocalPoint = function (point) {
  return this.body.getLinearVelocityFromLocalPoint(b2scaleTo(point));
};
b2Body.prototype.velocityFromWorldPoint = function (point) {
  return this.body.getLinearVelocityFromWorldPoint(b2scaleTo(point));
};
b2Body.prototype.localPoint = function (point) {
  return b2scaleFrom(this.body.getLocalPoint(b2scaleTo(point)));
};
b2Body.prototype.localVector = function (vector) {
  return b2scaleFrom(this.body.getLocalVector(b2scaleTo(vector)));
};
b2Body.prototype.worldPoint = function (point) {
  return b2scaleFrom(this.body.getWorldPoint(b2scaleTo(point)));
};
b2Body.prototype.worldVector = function (vector) {
  return b2scaleFrom(this.body.getWorldVector(b2scaleTo(vector)));
};
b2Body.prototype.resetMassData = function () {
  this.body.resetMassData();
};
b2Body.prototype.shouldCollide = function (body) {
  return this.body.shouldCollide(body.body);
};
b2Body.prototype.synchronizeFixtures = function () {
  this.body.synchronizeFixtures();
};
b2Body.prototype.synchronizeTransform = function () {
  this.body.synchronizeTransform();
};

b2Body.prototype.addTo = function (type, xy, wh, /*optional*/ props) {
  var x = b2scaleTo(xy);
  if (props == undefined) props = {};
  if (type == "box") {
    w = b2scaleTo(wh);
    s = box2d.Box(w.x / 2, w.y / 2, x, props.angle || 0);
  } else if (type == "circle") {
    w = b2scaleTo(wh);
    s = box2d.Circle(w.x / 2);
    s.m_p.x = x.x;
    s.m_p.y = x.y;
  } else if (type == "polygon") {
    if (!Array.isArray(wh)) return null;
    var vecs = [];
    for (var i = 0; i < wh.length; i++) {
      w = b2scaleTo(wh[i]);
      w.x += x.x;
      w.y += x.y;
      vecs[i] = w;
    }
    s = box2d.Polygon(vecs);
  } else if (type == "edge" || type == "chain") {
    if (!Array.isArray(wh) /*|| this.body.m_type != 'static'*/) return null;
    var vecs = [];
    var j = wh.length;
    var closed = false;
    if (wh[0].x == wh[j - 1].x && wh[0].y == wh[j - 1].y) {
      j--;
      closed = true;
    }
    for (var i = 0; i < j; i++) {
      w = b2scaleTo(wh[i]);
      w.x += x.x;
      w.y += x.y;
      vecs[i] = w;
    }
    s = box2d.Chain(vecs, closed);
    props.density = 0;
    props.restitution = 0;
  }
  props.shape = s;
  if (props.density == undefined) props.density = 5;
  if (props.friction == undefined) props.friction = 0.5;
  if (props.restitution == undefined) props.restitution = 0.2;
  c = this.body.createFixture(props);
  if (props.image) c.m_image = props.image;
  if (props.imageResize) c.m_imageResize = props.imageResize;
  c.m_userData = {
    body: this,
    user: null,
  };
  return c;
};

// ContactListener for collisions!
function b2Listener(contact) {
  // Get both fixtures
  var f1 = contact.getFixtureA();
  var f2 = contact.getFixtureB();
  // Get both bodies
  var b1 = f1.m_userData.body;
  if (!b1.body.isActive()) return;
  var b2 = f2.m_userData.body;
  if (!b2.body.isActive()) return;
  if (b1.collision == null && b2.collision == null) return;
  b2contacts.push(f1, f2);
}

b2Body.prototype.destroy = function () {
  this.body.setActive(false);
};
b2Body.prototype.draw = function () {
  for (
    var fixture = this.body.getFixtureList();
    fixture;
    fixture = fixture.getNext()
  ) {
    if (fixture.m_image) {
      if (fixture.m_imageResize)
        image(
          fixture.m_image,
          0,
          0,
          fixture.m_imageResize.x,
          fixture.m_imageResize.y,
          0,
          0
        );
      else image(fixture.m_image, 0, 0);
      continue;
    }
    this.drawFixture(fixture);
  } //for fixture
  return;
};

b2Body.prototype.drawFixture = function (fixture) {
  var s = fixture.m_shape;
  if (s.m_type == "polygon" || s.m_type == "chain") {
    if (s.m_type == "chain") {
      push();
      noFill();
    }
    v = s.m_vertices;
    beginShape();
    for (var i = 0; i < v.length; i++) {
      vertex(v[i].x * b2scaleFactor, v[i].y * b2scaleFactor);
    }
    if (s.m_type != "chain") endShape(CLOSE);
    else {
      endShape();
      pop();
    }
  } else if (s.m_type == "circle") {
    var d = s.m_radius * b2scaleFactor * 2;
    ellipse(s.m_p.x * b2scaleFactor, s.m_p.y * b2scaleFactor, d, d);
  } else if (s.m_type == "edge") {
    line(
      s.m_vertex1.x * b2scaleFactor,
      s.m_vertex1.y * b2scaleFactor,
      s.m_vertex2.x * b2scaleFactor,
      s.m_vertex2.y * b2scaleFactor
    );
  }
};

var b2getFixtureAt = function (x, y) {
  var mouseInWorld = b2V(x / b2scaleFactor, y / b2scaleFactor);
  var aabb = new box2d.AABB();
  aabb.lowerBound = new b2V(mouseInWorld.x - 0.001, mouseInWorld.y - 0.001);
  aabb.upperBound = new b2V(mouseInWorld.x + 0.001, mouseInWorld.y + 0.001);

  // Query the world for overlapping shapes.

  var selectedBody = null;
  b2world.queryAABB(aabb, function (fixture) {
    if (!fixture.getBody().isStatic()) {
      if (
        fixture
          .getShape()
          .testPoint(fixture.getBody().getTransform(), mouseInWorld)
      ) {
        selectedBody = fixture;
        return false;
      }
    }
    return true;
  });
  return selectedBody;
};

b2Body.prototype.toString = function () {
  var v = this.body.getLinearVelocity();
  var xy = b2scaleFrom(this.body.getPosition());
  var a = degrees(this.body.getAngle()) % 360;
  return (
    "xy=(" +
    xy.x.toFixed() +
    ", " +
    xy.y.toFixed() +
    ")\nv=(" +
    v.x.toFixed(2) +
    ", " +
    v.y.toFixed(2) +
    ")\na=" +
    a.toFixed(2)
  );
};

// -----------------------------------------------------------------------------
// Draw Methods
// -----------------------------------------------------------------------------

var b2debugDraw = function (canvas, scale, world) {
  var context = canvas.getContext("2d");
  //context.fillStyle = '#DDD';
  //context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw joints
  for (var j = world.m_jointList; j; j = j.m_next) {
    context.lineWidth = 0.25;
    context.strokeStyle = "#00F";
    drawJoint(context, scale, world, j);
  }
};

var drawJoint = function (context, scale, world, joint) {
  context.save();
  context.scale(scale, scale);
  context.lineWidth /= scale;

  var b1 = joint.m_bodyA;
  var b2 = joint.m_bodyB;
  var x1 = b1.getPosition();
  var x2 = b2.getPosition();
  var p1;
  var p2;
  context.beginPath();
  switch (joint.m_type) {
    case "distance-joint":
    case "rope-joint":
      context.moveTo(x1.x, x1.y);
      context.lineTo(x2.x, x2.y);
      break;
    case "wheel-joint":
    case "revolute-joint":
      p1 = joint.m_localAnchorA;
      p2 = joint.m_localAnchorB;
      var a = b2.getAngle();
      var v = b2V(cos(a), sin(a));
      context.moveTo(x2.x, x2.y);
      context.lineTo(x2.x + v.x, x2.y + v.y);
      break;
    case "mouse-joint":
    case "weld-joint":
      p1 = joint.getAnchorA();
      p2 = joint.getAnchorB();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      break;
    case "pulley-joint":
      p1 = joint.m_groundAnchorA;
      p2 = joint.m_groundAnchorB;
      context.moveTo(p1.x, p1.y);
      context.lineTo(x1.x, x1.y);
      context.moveTo(p2.x, p2.y);
      context.lineTo(x2.x, x2.y);
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      break;
    default:
      break;
  }
  context.closePath();
  context.stroke();
  context.restore();
};

b2Body.prototype.createJoint = function b2Joint(type, bodyB, props, anchor) {
  var j,
    bodyA = this;
  j = {
    bodyA: this.body,
    bodyB: bodyB.body,
    length: props.length != undefined ? b2scalexTo(props.length) : null,
    frequencyHz: props.frequencyHz,
    dampingRatio: props.dampingRatio,
    collideConnected: props.collideConnected,
    maxLength:
      props.maxLength != undefined ? b2scalexTo(props.maxLength) : null,
    userData: props.userData,
    lengthA: props.lengthA != undefined ? b2scalexTo(props.lengthA) : null,
    lengthB: props.lengthB != undefined ? b2scalexTo(props.lengthB) : null,
    ratio: props.ratio,
    groundAnchorA: props.groundAnchorA
      ? b2scaleTo(props.groundAnchorA)
      : b2V(0, 0),
    groundAnchorB: props.groundAnchorB
      ? b2scaleTo(props.groundAnchorB)
      : b2V(0, 0),
    enableLimit: props.enableLimit,
    enableMotor: props.enableMotor,
    lowerAngle: props.lowerAngle,
    maxMotorTorque: props.maxMotorTorque,
    maxMotorForce: props.maxMotorForce,
    motorSpeed: props.motorSpeed,
    referenceAngle: props.referenceAngle,
    upperAngle: props.upperAngle,
    maxForce: props.maxForce,
    maxTorque: props.maxTorque,
    localAxisA: props.localAxisA,
    upperTranslation: props.upperTranslation
      ? b2scalexTo(props.upperTranslation)
      : 1,
    lowerTranslation: props.lowerTranslation
      ? b2scalexTo(props.lowerTranslation)
      : 1,
    angularOffset: props.angularOffset,
    joint1: props.joint1,
    joint2: props.joint2,
    correctionFactor: props.correctionFactor,
    linearOffset: props.linearOffset
      ? b2scaleTo(props.linearOffset)
      : b2V(0, 0),
  };
  if (anchor) {
    j.localAnchorA = bodyA.body.getLocalPoint(b2scaleTo(anchor));
    j.localAnchorB = bodyB.body.getLocalPoint(b2scaleTo(anchor));
  } else {
    j.localAnchorA = props.localAnchorA
      ? b2scaleTo(props.localAnchorA)
      : b2V(0, 0);
    j.localAnchorB = props.localAnchorB
      ? b2scaleTo(props.localAnchorB)
      : b2V(0, 0);
  }
  if (type == "distance") {
    j = planck.DistanceJoint(j);
  } else if (type == "pulley") {
    j = planck.PulleyJoint(j);
  } else if (type == "wheel") {
    j = planck.WheelJoint(j);
  } else if (type == "rope") {
    j = planck.RopeJoint(j);
  } else if (type == "weld") {
    j = planck.WeldJoint(j);
  } else if (type == "revolute") {
    j = planck.RevoluteJoint(j);
  } else if (type == "gear") {
    j = planck.GearJoint(j);
  } else if (type == "friction") {
    j = planck.FrictionJoint(j);
  } else if (type == "motor") {
    j = planck.MotorJoint(j);
  } else if (type == "prismatic") {
    j = planck.PrismaticJoint(j);
  } else if (type == "mouse") {
    /*j = new box2d.b2MouseJointDef();
        j.bodyA = bodyA!=null?bodyA.body:b2world.CreateBody(new box2d.b2BodyDef());
        j.bodyB = bodyB.body;
        j.target = b2scaleTo(props.xy);
        j.collideConnected = true;
        j.maxForce = props.maxForce||(1000.0 * bodyB.body.GetMass());
        j.frequencyHz = props.frequency||5;  // Try a value less than 5 (0 for no elasticity)
        j.dampingRatio = props.damping||0.9; // Ranges between 0 and 1 (1 for no springiness)
        bodyB.body.SetAwake(true);
        bodyA=bodyB;*/
  }
  return b2world.createJoint(j);
};

function b2getAABB(body) {
  var aabb = new planck.AABB();
  var t = new planck.Transform();
  t.setIdentity();
  var shapeAABB = new planck.AABB();
  aabb.lowerBound = b2V(1000000, 1000000);
  aabb.upperBound = b2V(-1000000, -1000000);
  var fixture = body.body.getFixtureList();
  while (fixture) {
    var shape = fixture.getShape();
    var childCount = shape.getChildCount(); //only for chains
    for (var child = 0; child < childCount; ++child) {
      shape.computeAABB(shapeAABB, body.body.m_xf, child);
      b2unionTo(aabb, shapeAABB);
    }
    fixture = fixture.getNext();
  }
  aabb.lowerBound.mul(b2scaleFactor); //upper left, offset from center
  aabb.upperBound.mul(b2scaleFactor); //lower right
  return aabb;
}

function b2unionTo(a, b) {
  a.lowerBound.x = min(a.lowerBound.x, b.lowerBound.x);
  a.lowerBound.y = min(a.lowerBound.y, b.lowerBound.y);
  a.upperBound.x = max(a.upperBound.x, b.upperBound.x);
  a.upperBound.y = max(a.upperBound.y, b.upperBound.y);
}

// The ray cast collects multiple hits along the ray in ALL mode.
// The fixtures are not necessary reported in order.
// We might not capture the closest fixture in ANY.
var b2rayCast = (function () {
  var def = {
    ANY: 0,
    NEAREST: 2,
    ALL: 1,
  };

  var reset = function (mode, ignore) {
    def.points = [];
    def.normals = [];
    def.fixtures = [];
    def.fractions = [];
    def.ignore = ignore || [];
    def.mode = mode == undefined ? def.NEAREST : mode;
  };

  def.rayCast = function (point1, point2, mode, ignore) {
    reset(mode, ignore);
    b2world.rayCast(b2scaleTo(point1), b2scaleTo(point2), def.callback);
  };

  def.callback = function (fixture, point, normal, fraction) {
    if (def.ignore.length > 0)
      for (var i = 0; i < def.ignore.length; i++)
        if (def.ignore[i] === fixture) return -1;
    if (def.mode == def.NEAREST && def.points.length == 1) {
      def.fixtures[0] = fixture;
      def.points[0] = b2scaleFrom(point);
      def.normals[0] = normal;
      def.fractions[0] = fraction;
    } else {
      def.fixtures.push(fixture);
      def.points.push(b2scaleFrom(point));
      def.normals.push(normal);
      def.fractions.push(fraction);
    }
    // -1 to ignore a fixture and continue
    //  0 to terminate on first hit, or for searching
    //  fraction seems to return nearest fixture as last entry in array
    // +1 returns multiple but mix of low high or high low
    return def.mode == def.NEAREST ? fraction : def.mode;
  };

  return def;
})();

var b2queryAABB = (function () {
  var def = {};
  var reset = function (search) {
    def.fixtures = [];
    def.search = search || [];
  };

  def.query = function (aabb, search) {
    reset(search);
    aabbc = new planck.AABB(
      aabb.lowerBound.mul(1 / b2scaleFactor),
      aabb.upperBound.mul(1 / b2scaleFactor)
    );
    b2world.queryAABB(aabbc, def.callback);
  };

  def.callback = function (fixture) {
    def.fixtures.push(fixture);
    return true;
  };

  return def;
})();
