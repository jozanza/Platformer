import { Button, Color, Canvas, Font, Game, Input, Gfx } from './lib.js'

const SPACING = 16

const EVENT_NEXT_FRAME = Symbol('NextFrameEvent')
const EVENT_NEW_SCENE = Symbol('NewSceneEvent')
const EVENT_SET_TAB_INDEX = Symbol('SetTabIndexEvent')

const SCENE_TITLE = Symbol('TitleScene')
const SCENE_OPTIONS = Symbol('OptionsScene')
const SCENE_PLAYER_CREATION = Symbol('PlayerCreationScene')
const SCENE_OVERWORLD = Symbol('OverworldScene')

const INPUT_TYPE_NUMBER = Symbol('NumberInput')

function init() {
  return {
    frame: 0,
    scene: SCENE_TITLE,
    enteredAt: 0,
    tabIndex: 0,
    options: {
      numberOfRounds: 1,
      startingLevel: 1,
      numberOfPlayers: 1,
    },
    [SCENE_TITLE]: {
      blinkRate: 32,
    },
    [SCENE_OPTIONS]: {
      inputs: [
        [
          INPUT_TYPE_NUMBER,
          {
            tabIndex: 0,
            label: 'Number of Rounds  ',
            defaultValue: 10,
            value: null,
            min: 1,
            max: 100,
            step: 1,
          },
        ],
        [
          INPUT_TYPE_NUMBER,
          {
            tabIndex: 1,
            label: 'Starting Level    ',
            defaultValue: 1,
            value: null,
            min: 1,
            max: 100,
            step: 1,
          },
        ],
        [
          INPUT_TYPE_NUMBER,
          {
            tabIndex: 2,
            label: 'Number of Players ',
            defaultValue: 1,
            value: null,
            targetLength: 3,
            padString: ' ',
            min: 1,
            max: 8,
            step: 1,
          },
        ],
      ],
    },
    [SCENE_OVERWORLD]: {
      players: [],
    },
  }
}

function destroy() {}

function update(ctx, dispatch) {
  const { scene, frame } = ctx
  Gfx.clear(Color.black)
  if (scene === SCENE_TITLE) {
    const { blinkRate } = ctx[SCENE_TITLE]
    if (frame % blinkRate < blinkRate / 2) {
      const font = Font.medium;
      const msg = 'PRESS A TO START'
      const { width, height } = Gfx.measureText(font, msg)
      Gfx.print(
        font,
        msg,
        Canvas.width / 2 - width / 2,
        Canvas.height / 2 - height / 2,
        Color.white,
      )
    }
    if (Input.isButtonPressed(Button.A)) {
      dispatch(EVENT_NEW_SCENE, SCENE_OPTIONS)
    }
  } else if (scene === SCENE_OPTIONS) {
    const { inputs } = ctx[SCENE_OPTIONS]
    // Draw
    {
      const offset = 16
      const duration = ctx.frame - ctx.enteredAt
      let x = -offset + Math.min(duration, offset)
      let y = 0
      Gfx.print(Font.medium, 'SETUP!', x + 1, 1, Color.white)
      y += SPACING
      for (const [type, options] of inputs) {
        const i = options.tabIndex
        const isFocused = i == ctx.tabIndex
        if (type == INPUT_TYPE_NUMBER) {
          const n = i * 4;
          const x_ = -offset + Math.min(duration - n, offset)
          if (Gfx.numberInput(x_, y, isFocused, options)) {
            // input updated
          }
          y += SPACING
        }
      }
    }
    // Update
    {
      // Cancel
      if (Input.isButtonPressed(Button.B)) {
        dispatch(EVENT_NEW_SCENE, SCENE_TITLE)
      }
      // Prev tabindex
      if (Input.isButtonPressed(Button.up)) {
        const nextTabIndex = Math.max(0, ctx.tabIndex - 1)
        dispatch(EVENT_SET_TAB_INDEX, nextTabIndex)
      }
      // Next tabindex
      if (Input.isButtonPressed(Button.down)) {
        const nextTabIndex = Math.min(inputs.length - 1, ctx.tabIndex + 1)
        dispatch(EVENT_SET_TAB_INDEX, nextTabIndex)
      }
    }
  } else if (scene === SCENE_PLAYER_CREATION) {
    Gfx.print(Font.small, 'Player Creation!', 0, 0, Color.white)
  } else if (scene === SCENE_OVERWORLD) {
    Gfx.print(Font.small, 'Overworld!', 0, 0, Color.white)
  }
  dispatch(EVENT_NEXT_FRAME, null)
}

function subscribe(ctx, [type, data]) {
  switch (type) {
    case EVENT_NEXT_FRAME:
      {
        ctx.frame++
      }
      break
    case EVENT_NEW_SCENE:
      {
        const nextScene = data
        ctx.scene = nextScene
        ctx.tabIndex = 0
        ctx.enteredAt = ctx.frame + 1
      }
      break
    case EVENT_SET_TAB_INDEX:
      {
        const nextTabIndex = data
        ctx.tabIndex = nextTabIndex
      }
      break
  }
}

Game.run(init, destroy, update, subscribe)

// class Root extends Component {
//   ctx = {
//     scene: null,
//     nextScene: null,
//     tileSize: 16,
//     settings = {
//       numberOfRounds: 1,
//       startingLevel: 1,
//       players: [null, null, null, null],
//     }
//   }
//   init() {
//     console.log('Game init!')
//     const scene = new TitleScene()
//     this.ctx.scene = scene
//     this.addChild(scene)
//   }
//   destroy() {
//     console.log('Game destroy!')
//   }
//   draw() {
//     super.draw()
//   }
//   update() {
//     for (const child of this.children) {
//       if (child !== this.ctx.scene) {
//         this.removeChild(child)
//       }
//     }
//     this.ctx.scene = this.ctx.nextScene ?? this.ctx.scene
//     this.ctx.nextScene = null
//     if (!this.children.size) {
//       this.addChild(this.ctx.scene)
//     }
//     super.update()
//   }
// }

// class TitleScene extends Component {
//   frame = 0
//   draw() {
//     Gfx.clear(Color.black)
//     if (this.frame % 32 < 16) {
//       const charWidth = 4
//       const charHeight = 4
//       const charSpacing = 1
//       const msg = 'Press A to Start'
//       const msgWidth = msg.length * (charWidth + charSpacing) - 1
//       Gfx.print(
//         Font.small,
//         msg,
//         Canvas.width / 2 - msgWidth / 2,
//         Canvas.height / 2 - charHeight / 2,
//         Color.white,
//       )
//     }
//     super.draw()
//   }
//   update() {
//     if (Input.isButtonPressed(Button.A)) {
//       this.ctx.nextScene = new OverworldScene()
//     }
//     this.frame++
//     super.update()
//   }
// }

// class GameSetupScene extends Component {
//   static NUMBER_OF_ROUNDS = 'numberOfRounds'
//   static STARTING_LEVEL = 'startingLevel'
//   static PLAYERS = 'players'
//   step = 'numberOfRounds'
//   draw() {
//     switch(this.step) {
//       case GameSetupScene.NUMBER_OF_ROUNDS: {
//         // ...
//       }; break;
//       case GameSetupScene.STARTING_LEVEL: {
//         // ...
//       }; break;
//       case GameSetupScene.PLAYERS: {
//         // ...
//       }; break;
//     }
//     super.draw()
//   }
//   update() {
//     switch(this.step) {
//       case GameSetupScene.NUMBER_OF_ROUNDS: {
//         // ...
//       }; break;
//       case GameSetupScene.STARTING_LEVEL: {
//         // ...
//       }; break;
//       case GameSetupScene.PLAYERS: {
//         // ...
//       }; break;
//     }
//     super.update()
//   }
// }

// class OverworldScene extends Component {
//   players = []
//   init() {
//     this.players.push(new Player())
//     for (const player of this.players) {
//       this.addChild(player)
//     }
//   }
//   draw() {
//     Gfx.clear(Color.pink)
//     super.draw()
//   }
//   update() {
//     if (Input.isButtonPressed(Button.B)) {
//       this.ctx.nextScene = new TitleScene()
//     }
//     super.update()
//   }
// }

// class Player extends Component {
//   x = 0
//   y = 0
//   draw() {
//     const { x, y } = this
//     const { tileSize } = this.ctx
//     Gfx.rectfill(x * tileSize, y * tileSize, tileSize, tileSize, Color.black)
//     super.draw()
//   }
//   update() {
//     if (Input.isButtonPressed(Button.up)) {
//       this.y--
//     }
//     if (Input.isButtonPressed(Button.down)) {
//       this.y++
//     }
//     if (Input.isButtonPressed(Button.left)) {
//       this.x--
//     }
//     if (Input.isButtonPressed(Button.right)) {
//       this.x++
//     }
//     super.update()
//   }
// }

// // Start the game
// Game.render(new Root())
