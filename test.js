import * as raylib from './raylib.so'

//------------------------------------------------------------------------------
// Library
//------------------------------------------------------------------------------

class Button {
  static A = 90 // Z
  static B = 88 // X
  static up = 265
  static down = 264
  static left = 263
  static right = 262
}

class Color {
  static black = { r: 0, g: 0, b: 0, a: 255 }
  static white = { r: 255, g: 255, b: 255, a: 255 }
  static pink = { r: 255, g: 109, b: 194, a: 255 }
}

class Window {
  static title = 'My Game'
  static width = 512
  static height = 512
  static fps = 60
}

class Canvas {
  static width = 256
  static height = 256
}

class Font {
  static small = null
  static medium = null
  static large = null
  static jumbo = null
}

class Game {
  static render(root) {
    raylib.initWindow(Canvas.width, Canvas.height, Window.title)
    raylib.setTargetFPS(Window.fps)
    Font.small = raylib.loadFont('baby.png')
    root.init()
    while (!raylib.windowShouldClose()) {
      // draw
      raylib.beginDrawing()
      root.draw()
      raylib.endDrawing()
      // update
      root.update()
    }
    root.destroy()
    raylib.closeWindow()
  }
}

class Input {
  /**
   * Checks whether a button was pressed this frame
   *
   * @param   {Number}  button  button to check
   *
   * @return  {Boolean}         was the button pressed
   */
  static isButtonPressed(button) {
    return raylib.isKeyPressed(button)
  }
}

class Gfx {
  /**
   * Clears the canvas with the given color
   *
   * @param   {Color}  color  the clear color
   */
  static clear(color = Color.black) {
    raylib.clearBackground(color)
  }

  /**
   * Draws a filled rectangle
   *
   * @param   {Number}  x       x position
   * @param   {Number}  y       y position
   * @param   {Number}  width   rectangle width
   * @param   {Number}  height  rectangle height
   * @param   {Color}   color   rectangle color
   */
  static rectfill(x = 0, y = 0, width = 1, height = 1, color = Color.white) {
    raylib.drawRectangle(x, y, width, height, color)
  }

  /**
   * Prints text
   *
   * @param   {Font}    font   font to use
   * @param   {String}  text   text to draw
   * @param   {Number}  x      x position
   * @param   {Number}  y      y position
   * @param   {Color}   color  font color
   */
  static print(
    font = Font.small,
    text = '',
    x = 0,
    y = 0,
    color = Color.white,
  ) {
    switch (font) {
      case Font.small:
      default:
        raylib.drawTextEx(Font.small, text, { x, y }, 4, 1, color)
    }
  }
}

class Component {
  ctx = null
  children = new Set()
  setContext(ctx) {
    this.ctx = ctx
  }
  addChild(child) {
    this.children.add(child)
    child.ctx = this.ctx
    child.init()
  }
  removeChild(child) {
    child.destroy()
    child.ctx = null
    this.children.delete(child)
  }
  init() {}
  destroy() {
    for (const child of this.children) {
      child.destroy?.()
    }
  }
  draw() {
    for (const child of this.children) {
      child.draw?.()
    }
  }
  update() {
    for (const child of this.children) {
      child.update?.()
    }
  }
}

//------------------------------------------------------------------------------
// Game
//------------------------------------------------------------------------------

class Root extends Component {
  ctx = {
    scene: null,
    nextScene: null,
    tileSize: 16,
  }
  init() {
    console.log('Game init!')
    const scene = new TitleScene()
    this.ctx.scene = scene
    this.addChild(scene)
  }
  destroy() {
    console.log('Game destroy!')
  }
  draw() {
    super.draw()
  }
  update() {
    for (const child of this.children) {
      if (child !== this.ctx.scene) {
        this.removeChild(child)
      }
    }
    this.ctx.scene = this.ctx.nextScene ?? this.ctx.scene
    this.ctx.nextScene = null
    if (!this.children.size) {
      this.addChild(this.ctx.scene)
    }
    super.update()
  }
}

class TitleScene extends Component {
  frame = 0
  draw() {
    Gfx.clear(Color.black)
    if (this.frame % 32 < 16) {
      const charWidth = 4
      const charHeight = 4
      const charSpacing = 1
      const msg = 'Press A to Start'
      const msgWidth = msg.length * (charWidth + charSpacing) - 1
      Gfx.print(
        Font.small,
        msg,
        Canvas.width / 2 - msgWidth / 2,
        Canvas.height / 2 - charHeight / 2,
        Color.white,
      )
    }
    super.draw()
  }
  update() {
    if (Input.isButtonPressed(Button.A)) {
      this.ctx.nextScene = new OverworldScene()
    }
    this.frame++
    super.update()
  }
}

class OverworldScene extends Component {
  players = []
  init() {
    this.players.push(new Player())
    for (const player of this.players) {
      this.addChild(player)
    }
  }
  draw() {
    Gfx.clear(Color.pink)
    super.draw()
  }
  update() {
    if (Input.isButtonPressed(Button.B)) {
      this.ctx.nextScene = new TitleScene()
    }
    super.update()
  }
}

class Player extends Component {
  x = 0
  y = 0
  draw() {
    const { x, y } = this
    const { tileSize } = this.ctx
    Gfx.rectfill(x * tileSize, y * tileSize, tileSize, tileSize, Color.black)
    super.draw()
  }
  update() {
    if (Input.isButtonPressed(Button.up)) {
      this.y--
    }
    if (Input.isButtonPressed(Button.down)) {
      this.y++
    }
    if (Input.isButtonPressed(Button.left)) {
      this.x--
    }
    if (Input.isButtonPressed(Button.right)) {
      this.x++
    }
    super.update()
  }
}

// Start the game
Game.render(new Root())
