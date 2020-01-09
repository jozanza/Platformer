#include "duktape.h"
#include <raylib.h>
#include <stdio.h>

typedef struct Console {
  struct {
    Vector2 resolution;
    Color palette[16];
    int colors;
    int fps;
  } video;
  struct {
    Vector2 size;
  } spritesheet;
  struct {
    Vector2 size;
  } spritemap;
} Console;

Console DEFAULT_CONSOLE = {
    .video = {
        .resolution = {128, 128},
        .palette    = {
            {0, 0, 0, 0},
            BLACK,
            WHITE,
            RED,
            GREEN,
            BLUE,
        },
        .colors = 6,
        .fps    = 30,
    },
    .spritesheet = {
        .size = {128, 128},
    },
    .spritemap = {
        .size = {512, 512},
    },
};

Console ALT_CONSOLE = {
    .video = {
        .resolution = {128, 128},
        .palette    = {
            {0, 0, 0, 0},
            BLACK,
            PINK,
            RED,
            GREEN,
            BLUE,
        },
        .colors = 6,
        .fps    = 30,
    },
    .spritesheet = {
        .size = {128, 128},
    },
    .spritemap = {
        .size = {512, 512},
    },
};

typedef struct Cartridge {
  const char* name;
  int* spritesheet;
  int* spritemap;
  const char* script;
} Cartridge;

Cartridge DEFAULT_CARTRIDGE = {
    .name        = "Demo game",
    .spritesheet = (int[64]){
        // clang-format off
      2, 2, 2, 2, 2, 2, 2, 2, 
      2, 2, 2, 2, 2, 2, 2, 2, 
      2, 2, 0, 2, 2, 0, 2, 2, 
      2, 2, 2, 2, 2, 2, 2, 2, 
      2, 2, 2, 2, 2, 2, 2, 2, 
      2, 2, 0, 2, 2, 0, 2, 2, 
      2, 2, 2, 0, 0, 2, 2, 2, 
      2, 2, 2, 2, 2, 2, 2, 2,
        // clang-format on
    },
    .script = "var i = 0;"
              "function update() { i++; }"
              "function draw() { text('DEMO ' + i, 0, 0, 2); }",
};

static void* duk_get_udata(duk_context* ctx) {
  duk_memory_functions funcs;
  duk_get_memory_functions(ctx, &funcs);
  return funcs.udata;
}

static duk_ret_t fantasy_log(duk_context* ctx) {
  printf("%s\n", duk_to_string(ctx, 0));
  return 0; /* no return value (= undefined) */
}

static duk_ret_t fantasy_text(duk_context* ctx) {
  const char* text = duk_to_string(ctx, 0);
  int x            = duk_to_number(ctx, 1);
  int y            = duk_to_number(ctx, 2);
  int c            = duk_to_number(ctx, 3);
  Console* console = duk_get_udata(ctx);
  DrawText(text, x, y, 16.0, console->video.palette[c]);
  return 0;
}

void InitFantasyRuntime(duk_context* ctx) {
  // log(string): void
  duk_push_c_function(ctx, fantasy_log, 1);
  duk_put_global_string(ctx, "log");
  // text(s: string, x: number, y: number, color: number): void
  duk_push_c_function(ctx, fantasy_text, 4);
  duk_put_global_string(ctx, "text");
}

void RunFantasyCartridge(Console* console, Cartridge* cartridge) {
  // Open game window
  InitWindow(
      console->video.resolution.x,
      console->video.resolution.y,
      cartridge->name);
  SetTargetFPS(console->video.fps);

  // Load spritesheet
  Color pixels[64] = {0};
  for (int i = 0; i < 64; i++) {
    Color c   = console->video.palette[cartridge->spritesheet[i]];
    pixels[i] = c;
  }
  Image spritesheet = LoadImageEx(pixels, 8, 8);
  Texture2D tex     = LoadTextureFromImage(spritesheet);

  // Init runtime
  duk_context* ctx = duk_create_heap(NULL, NULL, NULL, console, NULL);
  InitFantasyRuntime(ctx);
  duk_idx_t top = duk_get_top(ctx);

  // Eval cartridge script
  duk_eval_string_noresult(ctx, cartridge->script);

  // Enter game loop
  while (!WindowShouldClose()) {
    // Reset stack
    duk_set_top(ctx, top);
    // Draw
    BeginDrawing();
    {
      ClearBackground(BLACK);
      duk_get_global_string(ctx, "draw");
      duk_call(ctx, 0 /*nargs*/);
      DrawTexture(tex, 0, 32, WHITE);
    };
    EndDrawing();
    // Update
    duk_get_global_string(ctx, "update");
    duk_call(ctx, 0 /*nargs*/);
  }
  // Exit game loop
  duk_destroy_heap(ctx);
  UnloadImage(spritesheet);
  UnloadTexture(tex);
  CloseWindow();
}

int main(void) {
  const char* windowTitle = "Starship";
  const int windowW       = 256;
  const int windowH       = 256;
  const int windowFPS     = 60;

  InitWindow(windowW, windowH, windowTitle);
  SetTargetFPS(windowFPS);
  SetTraceLogLevel(LOG_TRACE);

  // Image fontImage = LoadImage("baby.png");
  // printf("%dx%d\n", fontImage.width, fontImage.height);
  // Font cliFont = LoadFontFromImage(fontImage, MAGENTA, 32);
  Font cliFont = LoadFont("baby.png");
  puts("LOADED");
  const int cliPadding = 56 / 2;
  Rectangle cliRec     = (Rectangle){cliPadding, cliPadding, windowW - (cliPadding * 2), windowH - (cliPadding * 2)};
  float cliFontSize    = 16.0;
  float cliSpacing     = 1.0;
  float cliWordWrap    = false;
  Color cliFontColor   = WHITE;

  char history[4097][4097] = {0};
  int historyLen           = 0;
  int historyOffset        = 0;
  char input[4097]         = "\0";
  int inputLen             = 0;
  int inputOffset          = 0;

  Console* currentConsole     = &DEFAULT_CONSOLE;
  Cartridge* currentCartridge = &DEFAULT_CARTRIDGE;

  int frame                   = 0;
  int lastBackspacePressFrame = 0;

  while (!WindowShouldClose()) {
    // Draw UI
    BeginDrawing();
    {
      ClearBackground(BLACK);
      const char* format = frame % 32 < 16 ? "> %s_" : "> %s";
      const char* text   = TextFormat(format, input);
      DrawTextRec(
          cliFont,// GetFontDefault(),
          text,
          cliRec,
          cliFontSize,
          cliSpacing,
          cliWordWrap,
          cliFontColor);
    }
    EndDrawing();

    // Update input
    {
      // Append chars
      int key      = GetKeyPressed();
      int prevKey  = 0;
      int inputIdx = inputLen + inputOffset;
      while (key > 0 && key != prevKey) {
        if ((key >= 32) && (key <= 125) && inputLen < 4097) {
          printf("Got char '%c' (%d), at index %d\n", (char)key, key, inputLen);
          memmove(&input[inputIdx + 1], &input[inputIdx], strlen(input) - inputIdx);
          input[inputIdx] = (char)key;
          inputLen++;
        }
        prevKey = key;
        key     = GetKeyPressed();
      }

      // Delete
      if (inputIdx > 0) {
        bool isBackspacePressed = IsKeyPressed(KEY_BACKSPACE);
        bool canKeyRepeat       = frame % 2 == 0 && lastBackspacePressFrame < frame - 16;
        bool isBackspaceDown    = IsKeyDown(KEY_BACKSPACE) && canKeyRepeat;
        if (isBackspacePressed) {
          lastBackspacePressFrame = frame;
        }
        if (isBackspacePressed || isBackspaceDown) {
          inputLen--;
          inputIdx = inputLen + inputOffset;
          memmove(&input[inputIdx], &input[inputIdx + 1], strlen(input) - inputIdx);
          input[inputLen] = '\0';
        }
      }

      // Move cursor
      if (inputLen > 0) {
        bool canGoBack    = inputIdx > 0;
        bool canGoForward = inputOffset < 0;
        if (IsKeyPressed(KEY_LEFT) && canGoBack) {
          printf("%d\n", inputIdx - 1);
          inputOffset--;
        }
        if (IsKeyPressed(KEY_RIGHT) && canGoForward) {
          printf("%d\n", inputIdx + 1);
          inputOffset++;
        }
      }

      // Seek command history
      if (historyLen > 0) {
        bool canGoBack    = historyOffset + historyLen > 0;
        bool canGoForward = historyOffset < 0;
        if (IsKeyPressed(KEY_UP) && canGoBack) {
          historyOffset--;
          strncpy(input, history[historyLen + historyOffset], 4097);
          inputLen = strlen(input);
        }
        if (IsKeyPressed(KEY_DOWN) && canGoForward) {
          historyOffset++;
          strncpy(input, history[historyLen + historyOffset], 4097);
          inputLen = strlen(input);
        }
      }
    }

    // Process commands
    if (IsKeyPressed(KEY_ENTER) && inputLen > 0) {
      printf("input -> %s\n", input);

      // Run game
      if (strcmp("run demo", input) == 0) {
        // Close cli window
        CloseWindow();
        // Update current console
        currentConsole = &ALT_CONSOLE;
        // Run game
        RunFantasyCartridge(currentConsole, currentCartridge);
        // Reopen console window
        InitWindow(windowW, windowH, windowTitle);
        SetTargetFPS(windowFPS);
      }

      // Update input buffer
      strncpy(history[historyLen], input, 4097);
      historyLen++;
      historyOffset = 0;
      for (int i = 0; i < historyLen; i++) {
        printf("%d > %s\n", i, history[i]);
      }
      memset(input, 0, 4097);
      inputLen = 0;
    }

    // Increment frame
    frame++;
  }
  // Done
  CloseWindow();
  return 0;
}
