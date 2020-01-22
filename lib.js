import * as raylib from './raylib.so'

//------------------------------------------------------------------------------
// Library
//------------------------------------------------------------------------------

export class Utils {
  static clamp = (min, max, n) => Math.min(max, Math.max(min, n))
}

export class Button {
  static A = 90 // Z
  static B = 88 // X
  static up = 265
  static down = 264
  static left = 263
  static right = 262
  static start = 257 // Enter
  static select = 32 // Spacebar
  static L = 340 // Left Shift
  static R = 344 // Right Shift
}

export class Color {
  static black = { r: 0, g: 0, b: 0, a: 255 }
  static white = { r: 255, g: 255, b: 255, a: 255 }
  static pink = { r: 255, g: 109, b: 194, a: 255 }
  static green = { r: 0, g: 255, b: 194, a: 255 }
}

export class Window {
  static title = 'My Game'
  static width = 512
  static height = 512
  static fps = 60
  static frame = 0
}

export class Canvas {
  static width = 256
  static height = 144
}

export class Font {
  static small = null
  static medium = null
  static large = null
  static jumbo = null
  static tiles = null
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
    raylib.initWindow(Window.width, Window.height, Window.title)
    raylib.initCanvas(Canvas.width, Canvas.height)
    raylib.setTargetFPS(Window.fps)
    Font.small = raylib.loadFont('baby.png')
    Font.medium = raylib.loadFont('thicc.png')
    Font.tiles = raylib.loadFont('tiles.png')
    let events = []
    const dispatch = (kind, data = null) => events.push({ kind, data })
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
      Window.frame++
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
      Window.frame++
    }
    root.destroy()
    raylib.closeWindow()
  }
}

export class Input {
  static buttonDownFrame = {}
  /**
   * Checks if a button is pressed this frame
   * @param   {Number}  button  Button ID
   * @return  {Boolean}         The button pressed state
   */
  static isButtonPressed(button) {
    return raylib.isKeyPressed(button)
  }
  /**
   * Checks if a button is being held down this frame
   * @param   {Number}  button    Button ID
   * @param   {Number}  throttle  Number of frames to throttle input for. Default = 0
   * @return  {Boolean}           The button down state
   */
  static isButtonDown(button, throttle = 0) {
    if (!raylib.isKeyDown(button)) {
      Input.buttonDownFrame[button] = 0
      return false
    }
    const prev = Input.buttonDownFrame[button] ?? 0
    if (!prev) {
      Input.buttonDownFrame[button] = Window.frame
    }
    const frame = Input.buttonDownFrame[button]
    if (throttle && frame !== Window.frame) {
      return (Window.frame - frame) % throttle === 0
    }
    return true
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
    blinkRate = 0,
    wiggle = false,
  ) {
    if (Window.frame % blinkRate < blinkRate / 2) return
    switch (font) {
      case Font.tiles: {
        const lines = text.split('\n')
        for (let i = 0; i < lines.length; i++) {
          raylib.drawTextEx(font, lines[i], { x, y: y + (16 * i) }, 15, 1, color)
        }
        break
      }
      case Font.medium: {
        const charWidth = 7
        if (!wiggle) {
          raylib.drawTextEx(font, text, { x, y }, 7, 1, color)
        } else {
          const rate = 8
          const n = Math.PI / text.length
          let i = 0
          for (const char of text) {
            const nn = Math.floor((Window.frame / rate) % (text.length - 1))
            const oy = Math.sin(nn + i * n)
            raylib.drawTextEx(
              font,
              char,
              { x: x + i * (charWidth + 1), y: y + oy },
              7,
              1,
              color,
            )
            i++
          }
        }
        break
      }
      case Font.small:
      default: {
        raylib.drawTextEx(Font.small, text, { x, y }, 4, 1, color)
      }
    }
  }
  static measureText(font = Font.small, text = '', box = null) {
    let width = 0
    let height = 0
    if (font == Font.medium) {
      const charWidth = 7
      const charHeight = 7
      const charSpacing = 1
      width = text.length * (charWidth + charSpacing) - 1
      height = charHeight
    }
    if (font == Font.small) {
      const charWidth = 4
      const charHeight = 4
      const charSpacing = 1
      width = text.length * (charWidth + charSpacing) - 1
      height = charHeight
    }
    return { width, height }
  }
  static formField(x, y, isFocused, field, font = Font.small) {
    switch (field.type) {
      case 'text': {
        Gfx.print(font, field.label, x, y, Color.white)
        x = x + (field.labelWidth || width)
        Gfx.print(
          font,
          `   ${field.value.padEnd(field.targetLength, field.padString)}  `,
          x,
          y,
          isFocused ? Color.pink : Color.white,
        )
        break
      }
      case 'submit': {
        const color = isFocused ? Color.pink : Color.white
        const { width, height } = Gfx.measureText(font, field.label)
        const pad = 2
        Gfx.rectfill(x, y, width + pad * 2, height + pad * 2, color)
        Gfx.print(font, field.label, x + pad, y + pad, Color.black)
        return isFocused && Input.isButtonPressed(Button.A)
      }
      case 'select': {
        const { width, height } = Gfx.measureText(font, field.label)
        Gfx.print(font, field.label, x, y, Color.white)
        const displayValue = `${field.options[field.value].label}`.padStart(
          field.targetLength,
          field.padString,
        )
        x = x + (field.labelWidth || width)
        Gfx.print(
          font,
          !isFocused
            ? `   ${displayValue}  `
            : field.value === field.min
            ? ` - ${displayValue} >`
            : field.value === field.max
            ? ` < ${displayValue} -`
            : ` < ${displayValue} >`,
          x,
          y,
          isFocused ? Color.pink : Color.white,
        )
        if (!isFocused) return false
        let delta = 0
        if (Input.isButtonDown(Button.left, 7)) {
          delta = -1
        }
        if (Input.isButtonDown(Button.right, 7)) {
          delta = 1
        }
        if (delta) {
          field.value = Utils.clamp(
            0,
            field.options.length - 1,
            field.value + delta,
          )
        }
        return true
        break
      }
      case 'number': {
        const { width, height } = Gfx.measureText(font, field.label)
        Gfx.print(font, field.label, x, y, Color.white)
        const displayValue = `${field.value}`.padStart(
          field.targetLength,
          field.padString,
        )
        x = x + (field.labelWidth || width)
        Gfx.print(
          font,
          !isFocused
            ? `   ${displayValue}  `
            : field.value === field.min
            ? ` - ${displayValue} >`
            : field.value === field.max
            ? ` < ${displayValue} -`
            : ` < ${displayValue} >`,
          x,
          y,
          isFocused ? Color.pink : Color.white,
        )
        if (!isFocused) return false
        let delta = 0
        if (Input.isButtonDown(Button.left, 7)) {
          delta = -1
        }
        if (Input.isButtonDown(Button.right, 7)) {
          delta = 1
        }
        if (delta) {
          field.value = Utils.clamp(
            field.min,
            field.max,
            field.value + delta * field.step,
          )
        }
        return true
      }
    }
  }
}
