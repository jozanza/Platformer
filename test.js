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
import Maps from './maps.js'

/*::

// -----------------------------------------------------------------------------
// Form
// -----------------------------------------------------------------------------

type FormField = {
  type: 'number',
  tabIndex: number,
  key: string | number,
  disabled: boolean,
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
  key: string | number,
  disabled: boolean,
  label: string,
  labelWidth: number,
  value: string,
  placeholder: string,
  targetLength: number,
  padString: string,
} | {
  type: 'select',
  tabIndex: number,
  key: string | number,
  disabled: boolean,
  label: string,
  labelWidth: number,
  value: number,
  placeholder: string,
  targetLength: number,
  padString: string,
  options: Array<{
    label: string,
    value: any
  }>
} | {
  type: 'submit',
  tabIndex: number,
  key: string | number,
  disabled: boolean,
  label: string,
}

type FormContext = {
  tabIndex: number;
  fields: FormField[],
}

// -----------------------------------------------------------------------------
// Scene
// -----------------------------------------------------------------------------

type SceneName = 'Title' | 'FreePlayOptions' | 'PlayerSetup' | 'Overworld'

type SceneParams = { [string]: any }

type SceneContext = {
  current: SceneName,
  next: { name: SceneName, params: SceneParams } | null,
  duration: number,
  enteredAt: number,
  exitDelay: number,
  params: SceneParams,
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
  game: GameData,
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

type Command =
  | { kind: 'FrameEnd',
      data: null }
  | { kind: 'PrevTabIndex',
      data: null }
  | { kind: 'NextTabIndex',
      data: null }
  | { kind: 'SwitchScene',
      data: { to: SceneName, params?: SceneParams, delay?: number }}
  | { kind: 'UpdateFreePlaySettings',
      data: $Shape<FreePlayModeSettings> }

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
      params: {},
    },
    game: null,
  }
}

function destroy(_ctx /*: GameContext */) {
  // noop
}

function subscribe(ctx /*: GameContext */, cmd /*: Command */) {
  if (!/^(FrameEnd|PrevTabIndex|NextTabIndex)$/.test(cmd.kind)) {
    console.log('CMND:\n', cmd.kind, JSON.stringify(cmd.data, null, 2))
  }
  switch (cmd.kind) {
    case 'FrameEnd': {
      const { form, scene } = ctx
      scene.exitDelay = Math.max(0, scene.exitDelay - 1)
      if (scene.next && !scene.exitDelay) {
        // New Scene
        scene.duration = 0
        scene.enteredAt = Window.frame
        scene.current = scene.next.name
        scene.params = scene.next.params
        scene.next = null
        form.tabIndex = 0
        switch (scene.current) {
          case 'Title': {
            ctx.game = null
            break
          }
          case 'FreePlayOptions': {
            ctx.game =
              !ctx.game || ctx.game.mode !== 'FreePlay'
                ? {
                    mode: 'FreePlay',
                    settings: {
                      numberOfRounds: 10,
                      startingLevel: 1,
                      numberOfPlayers: 1,
                    },
                  }
                : ctx.game

            const labelWidth = Canvas.width - 56
            ctx.form.fields = [
              {
                type: 'number',
                tabIndex: 0,
                key: 'numberOfRounds',
                disabled: false,
                labelWidth,
                label: 'Number of Rounds',
                value: ctx.game.settings.numberOfRounds,
                min: 1,
                max: 100,
                step: 1,
                targetLength: 3,
                padString: ' ',
              },
              {
                type: 'number',
                tabIndex: 1,
                key: 'startingLevel',
                disabled: false,
                label: 'Starting Level',
                labelWidth,
                value: ctx.game.settings.startingLevel,
                min: 1,
                max: 100,
                step: 1,
                targetLength: 3,
                padString: ' ',
              },
              {
                type: 'number',
                tabIndex: 2,
                key: 'numberOfPlayers',
                disabled: false,
                labelWidth,
                label: 'Number of Players',
                value: ctx.game.settings.numberOfPlayers,
                min: 1,
                max: 8,
                step: 1,
                targetLength: 3,
                padString: ' ',
              },
              {
                type: 'submit',
                key: '',
                disabled: false,
                tabIndex: 3,
                label: 'next',
              },
            ]
            break
          }
          case 'PlayerSetup': {
            if (!ctx.game) throw new Error('No game mode selected')
            const labelWidth = Canvas.width - 76
            const targetLength = 7
            const { numberOfPlayers } = ctx.game.settings
            const params /*: { player: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 } */ =
              scene.params
            if (!params.player) throw new Error('Player param not specified')
            const { player } = params
            const key = player - 1
            ctx.form.fields = [
              {
                type: 'text',
                key,
                disabled: false,
                tabIndex: 0,
                label: 'Name',
                labelWidth,
                targetLength,
                padString: '_',
                value: `P${player}`,
                placeholder: '',
              },
              {
                type: 'select',
                key,
                disabled: false,
                tabIndex: 1,
                label: 'Type',
                labelWidth,
                value: 0,
                placeholder: '',
                targetLength,
                padString: ' ',
                options: [
                  {
                    label: 'Human',
                    value: ('Human' /*: PlayerType*/),
                  },
                  {
                    label: 'CPU',
                    value: ('CPU' /*: PlayerType*/),
                  },
                ],
              },
              {
                type: 'number',
                tabIndex: 2,
                key,
                disabled: false,
                labelWidth,
                label: 'AI Strength',
                value: 1,
                min: 1,
                max: 10,
                step: 1,
                targetLength,
                padString: ' ',
              },
              {
                type: 'select',
                key,
                tabIndex: 3,
                disabled: false,
                label: 'Egg',
                labelWidth,
                value: 0,
                placeholder: '',
                targetLength,
                padString: ' ',
                options: [
                  {
                    label: 'A',
                    value: 0,
                  },
                  {
                    label: 'B',
                    value: 1,
                  },
                  {
                    label: 'C',
                    value: 2,
                  },
                ],
              },
              {
                type: 'select',
                key,
                tabIndex: 4,
                disabled: false,
                label: 'Favorite Food',
                labelWidth,
                value: 0,
                placeholder: '',
                targetLength,
                padString: ' ',
                options: [
                  {
                    label: 'Fruits',
                    value: 0,
                  },
                  {
                    label: 'Veggies',
                    value: 0,
                  },
                  {
                    label: 'Meat',
                    value: 1,
                  },
                  {
                    label: 'Seafood',
                    value: 2,
                  },
                ],
              },
              {
                type: 'submit',
                key,
                disabled: false,
                tabIndex: 5,
                label: player === numberOfPlayers ? 'done' : 'next',
              },
            ]
            break
          }
        }
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
    case 'UpdateFreePlaySettings': {
      if (!ctx.game) throw new Error('No game mode selected')
      if (ctx.game.mode !== 'FreePlay')
        throw new Error('FreePlay mode not selected')
      ctx.game.settings = {
        ...ctx.game.settings,
        ...cmd.data,
      }
      break
    }
    case 'SwitchScene': {
      const { scene } = ctx
      if (scene.next) break
      const { to: name, params = {}, delay } = cmd.data
      scene.next = { name, params }
      scene.exitDelay = delay ?? 0
      break
    }
  }
}

function update(
  ctx /*: GameContext */,
  dispatch /*: (CommandKind, ?CommandData) => void */,
) {
  const { tabIndex, fields } = ctx.form
  const { current, duration, exitDelay, params } = ctx.scene
  const { game } = ctx
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
        dispatch('SwitchScene', { to: 'FreePlayOptions', delay: 64 })
      }
      break
    }
    case 'FreePlayOptions': {
      // -----------------------------------------------------------------------
      // Draw FreePlayOptions
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
      Gfx.print(
        Font.medium,
        'OPTIONS!',
        x + indent,
        y + indent,
        Color.white,
        0,
        true,
      )
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
            const y =
              Utils.clamp(
                Canvas.height + marginBottom,
                Canvas.height - marginBottom,
                Canvas.height - marginBottom - time,
              ) - 8
            if (Gfx.formField(x, y, isFocused, field, font)) {
              const settings /*: FreePlayModeSettings */ = {
                numberOfRounds: 10,
                startingLevel: 1,
                numberOfPlayers: 1,
              }
              for (const field of fields) {
                if (field.type === 'number') {
                  settings[field.key] = field.value
                }
              }
              dispatch('UpdateFreePlaySettings', settings)
              dispatch('SwitchScene', {
                to: 'PlayerSetup',
                params: { player: 1 },
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
      // Update FreePlayOptions
      // -----------------------------------------------------------------------
      if (Input.isButtonPressed(Button.B)) {
        // Cancel (Go back to Title)
        dispatch('SwitchScene', {
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
    case 'PlayerSetup': {
      // -----------------------------------------------------------------------
      // Draw PlayerSetup
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
      Gfx.print(
        Font.medium,
        `PLAYER ${params.player} SETUP`,
        x + indent,
        y + indent,
        Color.white,
        0,
        true,
      )
      y += verticalSpacing * 2
      ///

      for (const field of fields) {
        const i = field.tabIndex
        const isFocused = i == tabIndex
        const n = i * fieldDelay
        switch (field.type) {
          case 'text':
          case 'select':
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
            const y =
              Utils.clamp(
                Canvas.height + marginBottom,
                Canvas.height - marginBottom,
                Canvas.height - marginBottom - time,
              ) - 8
            if (Gfx.formField(x, y, isFocused, field, font)) {
              // Go to next step
              if (!game) throw new Error('No game mode selected')
              // TODO: update player -> dispatch('UpdatePlayer', playerData)
              const isLastPlayer =
                params.player === game.settings.numberOfPlayers
              const delay = fieldDelay * (fields.length - 1) - marginLeft
              if (isLastPlayer) {
                dispatch('SwitchScene', {
                  to: 'Overworld',
                  delay,
                })
              } else {
                dispatch('SwitchScene', {
                  to: 'PlayerSetup',
                  delay,
                  params: { player: params.player + 1 },
                })
              }
            }
            break
          }
        }
        y += verticalSpacing
      }

      ///
      if (exitDelay) {
        const progress = exitDelay / maxExitDelay
        const { width, height } = Canvas
        const halfWidth = width / 2
        const offset = halfWidth * progress
        Gfx.rectfill(-offset, 0, halfWidth, height, Color.black)
        Gfx.rectfill(halfWidth + offset, 0, halfWidth, height, Color.black)
      } else if (duration < 64) {
        const progress = duration / 64
        const { width, height } = Canvas
        const halfWidth = width / 2
        const offset = halfWidth * progress
        Gfx.rectfill(-offset, 0, halfWidth, height, Color.black)
        Gfx.rectfill(halfWidth + offset, 0, halfWidth, height, Color.black)
      }
      // -----------------------------------------------------------------------
      // Update PlayerSetup
      // -----------------------------------------------------------------------
      if (Input.isButtonPressed(Button.B)) {
        // Cancel (Go back)
        if (!game) throw new Error('No game mode selected')
        const isFirstPlayer = params.player === 1
        const delay = fieldDelay * (fields.length - 1) - marginLeft
        if (isFirstPlayer) {
          // Go back to FreePlayOptions
          dispatch('SwitchScene', {
            to: 'FreePlayOptions',
            delay,
          })
        } else {
          // Go back to previous PlayerSetup
          dispatch('SwitchScene', {
            to: 'PlayerSetup',
            delay,
            params: { player: params.player - 1 },
          })
        }
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
    case 'Overworld': {
      // -----------------------------------------------------------------------
      // Draw Overworld
      // -----------------------------------------------------------------------
      // Gfx.print(Font.medium, 'Overworld!', 1, 1, Color.white)
      Gfx.print(Font.tiles, Maps[0], 0, 0, Color.white)
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
