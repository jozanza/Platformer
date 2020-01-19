// @flow

import {
  Button,
  Color,
  Canvas,
  Font,
  Game,
  Input,
  Gfx,
  Utils,
  Window,
} from './lib.js'

/*::

// -----------------------------------------------------------------------------
// Form
// -----------------------------------------------------------------------------

type FormField = {
  type: 'number',
  tabIndex: number,
  key: string,
  label: string,
  labelWidth: number,
  value: number,
  min: number,
  max: number,
  step: number,
  targetLength: number,
  padString: string,
} | {
  type: 'text',
  tabIndex: number,
  label: string,
  value: string,
  placeholder: string,
} | {
  type: 'submit',
  tabIndex: number,
  label: string,
}

type FormContext = {
  tabIndex: number;
  fields: FormField[],
}

// -----------------------------------------------------------------------------
// Scene
// -----------------------------------------------------------------------------

type SceneName = 'Title' | 'FreePlaySetup' | 'PlayerCreation' | 'Overworld'

type SceneContext = {
  current: SceneName,
  next: SceneName | null,
  duration: number,
  enteredAt: number,
  exitDelay: number,
}

// -----------------------------------------------------------------------------
// Entities
// -----------------------------------------------------------------------------

type PlayerType = 'Human' | 'CPU'

type Player = {
  type: PlayerType,
  name: string,
  level: number,
  xp: number,
}

// -----------------------------------------------------------------------------
// GameMode
// -----------------------------------------------------------------------------

type GameMode = null | 'FreePlay' | 'Story'

type FreePlayModeSettings = {
  numberOfRounds: number,
  startingLevel: number,
  numberOfPlayers: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
}

type StoryModeSettings = {
  numberOfPlayers: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
}

type GameData = 
| null
| {
  mode: 'FreePlay',
  settings: FreePlayModeSettings,
}
| {
  mode: 'Story',
  settings: StoryModeSettings,
}

// -----------------------------------------------------------------------------
// Game
// -----------------------------------------------------------------------------

type GameContext = {
  form: FormContext,
  scene: SceneContext,
  data: GameData,
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

type Command =
  | { kind: 'FrameEnd', data: null }
  | { kind: 'PrevTabIndex', data: null }
  | { kind: 'NextTabIndex', data: null }
  | { kind: 'NextScene', data: {
      to: SceneName,
      delay?: number,
    }}

type CommandKind = $PropertyType<Command, 'kind'>

type CommandData = $PropertyType<Command, 'data'>

type CommandDispatcher = (CommandKind, CommandData) => void

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------

type GameContextInitializer = () => GameContext

type GameUpdater = (GameContext, CommandDispatcher) => void

type GameCommandSubscriber = (GameContext, Command) => void

type GameContextDestroyer = (GameContext) => void

*/

function init() /*: GameContext */ {
  return {
    form: {
      tabIndex: 0,
      fields: [],
    },
    scene: {
      current: 'Title',
      next: null,
      duration: 0,
      enteredAt: 0,
      exitDelay: 0,
    },
    data: null,
  }
}

function destroy(_ctx /*: GameContext */) {
  // noop
}

function subscribe(ctx /*: GameContext */, cmd /*: Command */) {
  switch (cmd.kind) {
    case 'FrameEnd': {
      const { form, scene } = ctx
      scene.exitDelay = Math.max(0, scene.exitDelay - 1)
      if (scene.next && !scene.exitDelay) {
        // New Scene
        scene.duration = 0
        scene.enteredAt = Window.frame
        scene.current = scene.next
        scene.next = null
        form.tabIndex = 0
      } else {
        scene.duration++
      }
      break
    }
    case 'PrevTabIndex': {
      const { form } = ctx
      const tabIndex = Math.max(0, form.tabIndex - 1)
      ctx.form.tabIndex = tabIndex
      break
    }
    case 'NextTabIndex': {
      const { form } = ctx
      const tabIndex = Math.min(form.fields.length - 1, form.tabIndex + 1)
      ctx.form.tabIndex = tabIndex
      break
    }
    case 'NextScene': {
      const { scene } = ctx
      if (scene.next) break
      const { to, delay } = cmd.data
      scene.next = to
      scene.exitDelay = delay ?? 0
      switch (scene.next) {
        case 'FreePlaySetup': {
          const labelWidth = Canvas.width - 56
          ctx.form.fields = [
            {
              type: 'number',
              tabIndex: 0,
              key: '',
              labelWidth,
              label: 'Number of Rounds',
              value: 10,
              min: 1,
              max: 100,
              step: 1,
              targetLength: 3,
              padString: ' ',
            },
            {
              type: 'number',
              tabIndex: 1,
              key: '',
              label: 'Starting Level',
              labelWidth,
              value: 1,
              min: 1,
              max: 100,
              step: 1,
              targetLength: 3,
              padString: ' ',
            },
            {
              type: 'number',
              tabIndex: 2,
              key: '',
              labelWidth,
              label: 'Number of Players',
              value: 1,
              min: 1,
              max: 8,
              step: 1,
              targetLength: 3,
              padString: ' ',
            },
            {
              type: 'submit',
              tabIndex: 3,
              label: 'next',
            },
          ]
          break
        }
      }
      break
    }
  }
}

function update(
  ctx /*: GameContext */,
  dispatch /*: (CommandKind, ?CommandData) => void */,
) {
  const { tabIndex, fields } = ctx.form
  const { current, duration, exitDelay } = ctx.scene
  Gfx.clear(Color.black)
  switch (current) {
    case 'Title': {
      // -----------------------------------------------------------------------
      // Draw Title
      // -----------------------------------------------------------------------
      const msg = 'PRESS A TO START'
      const font = Font.medium
      const { width, height } = Gfx.measureText(font, msg)
      Gfx.print(
        font,
        msg,
        Canvas.width / 2 - width / 2,
        Canvas.height / 2 - height / 2,
        Color.white,
        exitDelay ? 16 : 64,
      )
      // -----------------------------------------------------------------------
      // Update Title
      // -----------------------------------------------------------------------
      if (Input.isButtonPressed(Button.A)) {
        // Go to the next scene
        dispatch('NextScene', { to: 'FreePlaySetup', delay: 64 })
      }
      break
    }
    case 'FreePlaySetup': {
      // -----------------------------------------------------------------------
      // Draw FreePlaySetup
      // -----------------------------------------------------------------------
      const verticalSpacing = 16
      const indent = 8
      const marginLeft = -32
      const marginBottom = -16
      const fieldDelay = 8
      const maxExitDelay = fieldDelay * (fields.length - 1) - marginLeft
      let time = exitDelay || duration
      let x = Utils.clamp(marginLeft, 0, marginLeft + time)
      let y = 0
      Gfx.print(Font.medium, 'SETUP!', x + indent, y + indent, Color.white)
      y += verticalSpacing * 2
      for (const field of fields) {
        const i = field.tabIndex
        const isFocused = i == tabIndex
        const n = i * fieldDelay
        switch (field.type) {
          case 'number': {
            const x_ = Utils.clamp(marginLeft, x, marginLeft - n + time)
            if (Gfx.formField(x_ + indent, y + indent, isFocused, field)) {
              // input updated
            }
            break
          }
          case 'submit': {
            const font = Font.medium
            const { width, height } = Gfx.measureText(font, field.label)
            const x = Canvas.width / 2 - width / 2
            const y = Utils.clamp(
              Canvas.height + marginBottom,
              Canvas.height - marginBottom,
              Canvas.height - marginBottom - time,
            ) - 8
            if (Gfx.formField(x, y, isFocused, field, font)) {
              dispatch('NextScene', {
                to: 'Title',
                delay: fieldDelay * (fields.length - 1) - marginLeft,
              })
            }
            break
          }
        }
        y += verticalSpacing
      }
      if (exitDelay) {
        const progress = exitDelay / maxExitDelay
        const { width, height } = Canvas
        const halfWidth = width / 2
        const offset = halfWidth * progress
        Gfx.rectfill(-offset, 0, halfWidth, height, Color.black)
        Gfx.rectfill(halfWidth + offset, 0, halfWidth, height, Color.black)
      }
      // -----------------------------------------------------------------------
      // Update FreePlaySetup
      // -----------------------------------------------------------------------
      if (Input.isButtonPressed(Button.B)) {
        // Cancel (Go back to Title)
        dispatch('NextScene', {
          to: 'Title',
          delay: fieldDelay * (fields.length - 1) - marginLeft,
        })
      }
      if (Input.isButtonPressed(Button.up)) {
        // Prev tabIndex
        dispatch('PrevTabIndex')
      }
      if (Input.isButtonPressed(Button.down)) {
        // Next tabIndex
        dispatch('NextTabIndex')
      }
      break
    }
    case 'PlayerCreation': {
      // -----------------------------------------------------------------------
      // Draw PlayerCreation
      // -----------------------------------------------------------------------
      Gfx.print(Font.medium, 'Player Creation!', 1, 1, Color.white)
      // -----------------------------------------------------------------------
      // Update PlayerCreation
      // -----------------------------------------------------------------------
      // ...
      break
    }
    case 'Overworld': {
      // -----------------------------------------------------------------------
      // Draw Overworld
      // -----------------------------------------------------------------------
      Gfx.print(Font.medium, 'Overworld!', 1, 1, Color.white)
      // -----------------------------------------------------------------------
      // Update Overworld
      // -----------------------------------------------------------------------
      // ...
      break
    }
  }
  dispatch('FrameEnd')
}

Game.run(init, destroy, update, subscribe)
