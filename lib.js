import * as raylib from './raylib.so'

//------------------------------------------------------------------------------
// Library
//------------------------------------------------------------------------------

export class Button {
  static A = 90 // Z
  static B = 88 // X
  static up = 265
  static down = 264
  static left = 263
  static right = 262
}

export class Color {
  static black = { r: 0, g: 0, b: 0, a: 255 }
  static white = { r: 255, g: 255, b: 255, a: 255 }
  static pink = { r: 255, g: 109, b: 194, a: 255 }
}

export class Window {
  static title = 'My Game'
  static width = 512
  static height = 512
  static fps = 60
}

export class Canvas {
  static width = 256
  static height = 256
}

export class Font {
  static small = null
  static medium = null
  static large = null
  static jumbo = null
}

export class Component {
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

export class Game {
  static run(init, destroy, draw, update) {
    raylib.initWindow(Canvas.width, Canvas.height, Window.title)
    raylib.setTargetFPS(Window.fps)
    Font.small = raylib.loadFont('baby.png')
    let events = []
    const dispatch = (a, b) => events.push([a, b])
    // init
    const ctx = init()
    while (!raylib.windowShouldClose()) {
      // draw
      raylib.beginDrawing()
      draw(ctx, dispatch)
      raylib.endDrawing()
      // update
      for (const event of events) {
        update(ctx, event)
      }
      events = []
    }
    destroy(ctx)
    raylib.closeWindow()
  }
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

export class Input {
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

export class Gfx {
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
  static measureText(font = Font.small, text = '', box = null) {
    let width = 0
    let height = 0
    if (font == Font.small) {
      const charWidth = 4
      const charHeight = 4
      const charSpacing = 1
      width = text.length * (charWidth + charSpacing) - 1
      height = charHeight
    }
    return { width, height }
  }
  static numberInput(x0, y0, active, options) {
    let pad = 8
    let x = x0 + pad
    let y = y0 + pad
    const { width, height } = Gfx.measureText(Font.small, options.label)
    // Gfx.rectfill(x0, y0, width + 4 * pad, height + 2 * pad, Color.pink)
    Gfx.print(Font.small, options.label, x, y, Color.white)
    const value = options.value ?? options.defaultValue
    Gfx.print(
      Font.small,
      `< ${value} >`,
      width + 2 * pad,
      y,
      active ? Color.pink : Color.white,
    )
    if (!active) return 0
    if (Input.isButtonPressed(Button.left)) {
      return -1
    }
    if (Input.isButtonPressed(Button.right)) {
      return 1
    }
    return 0
  }
}
