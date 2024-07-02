class Projectile {
  constructor({ x, y, radius, color = 'white', velocity }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.trail = [];
    this.trailLength = 10;
  }

  pushTrail() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }
  }

  drawTrail() {
    this.trail.forEach((trail, index) => {
      const alpha = index / this.trailLength;
      c.save();
      c.shadowColor = this.color;
      c.shadowBlur = alpha * 20;
      c.beginPath();
      c.arc(trail.x, trail.y, this.radius * (0.5 + alpha), 0, Math.PI * 2, false);
      c.fillStyle = `rgba(255, 255, 255, ${alpha / 2})`;
      c.fill();
      c.restore();
    });
  }

  draw() {
    this.pushTrail();
    this.drawTrail();
    c.save();
    c.shadowColor = this.color;
    c.shadowBlur = 20;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}