class Player {
    constructor({ x, y, radius, color = 'blue', username }) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.username = username
    }
  
    draw(camera) {
      c.font = '12px sans-serif'
      c.fillStyle = 'white'
      const textWidth = c.measureText(this.username).width;
      c.fillText(this.username, this.x - camera.x - textWidth / 2, this.y - camera.y + (this.radius * 2 + 5))
      c.save()
      c.shadowColor = this.color
      c.shadowBlur = 20
      c.beginPath()
      c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false)
      c.fillStyle = this.color
      c.fill()
      c.restore()
    }
}