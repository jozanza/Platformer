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

static duk_ret_t fantasy_log(duk_context* ctx) {
  printf("%s\n", duk_to_string(ctx, 0));
  return 0; /* no return value (= undefined) */
}

static duk_ret_t fantasy_text(duk_context* ctx) {
  const char* text = duk_to_string(ctx, 0);
  int x            = duk_to_number(ctx, 1);
  int y            = duk_to_number(ctx, 2);
  int c            = duk_to_number(ctx, 3);
  DrawText(text, x, y, 16.0, DEFAULT_CONSOLE.video.palette[c]);
  return 0;
}

void Fantasy_init_bindings(duk_context* ctx) {
  // log(string): void
  duk_push_c_function(ctx, fantasy_log, 1);
  duk_put_global_string(ctx, "log");
  // text(s: string, x: number, y: number, color: number): void
  duk_push_c_function(ctx, fantasy_text, 4);
  duk_put_global_string(ctx, "text");
}

int main(void) {
  char history[4097][4097] = {0};
  int idx_hist             = 0;
  char input[4097]         = "\0";
  int idx_in               = 0;
  int frame                = 0;

  duk_context* ctx = duk_create_heap_default();
  Fantasy_init_bindings(ctx);

  InitWindow(256, 256, "FantasyJS");
  SetTargetFPS(60);

  while (!WindowShouldClose()) {
    ClearBackground(BLACK);

    // Update input
    int key     = GetKeyPressed();
    int prevKey = 0;
    while (key > 0 && key != prevKey) {
      if ((key >= 32) && (key <= 125) && idx_in < 4097) {
        printf("Got char '%c' (%d), at index %d\n", (char)key, key, idx_in);
        input[idx_in++] = (char)key;
      }
      prevKey = key;
      key     = GetKeyPressed();
    }
    if (IsKeyPressed(KEY_BACKSPACE) && idx_in > 0) {
      input[--idx_in] = '\0';
    }

    // Process commands
    if (IsKeyPressed(KEY_ENTER) && idx_in > 0) {
      printf("input -> %s\n", input);
      if (strcmp("run demo", input) == 0) {
        duk_idx_t top = duk_get_top(ctx);
        duk_eval_string_noresult(ctx, DEFAULT_CARTRIDGE.script);
        duk_get_global_string(ctx, "name");
        const char* name = duk_get_string(ctx, top);
        CloseWindow();
        InitWindow(
            DEFAULT_CONSOLE.video.resolution.x,
            DEFAULT_CONSOLE.video.resolution.y,
            DEFAULT_CARTRIDGE.name);
        SetTargetFPS(DEFAULT_CONSOLE.video.fps);
        puts("------------");
        Color pixels[64] = {0};
        for (int i = 0; i < 64; i++) {
          Color c   = DEFAULT_CONSOLE.video.palette[DEFAULT_CARTRIDGE.spritesheet[i]];
          pixels[i] = c;
        }
        puts("ASDSA");
        Image spritesheet = LoadImageEx(pixels, 8, 8);
        puts("AAAAAAA");
        Texture2D tex = LoadTextureFromImage(spritesheet);
        puts("BBBBBB");
        while (!WindowShouldClose()) {
          duk_set_top(ctx, top);
          BeginDrawing();
          {
            ClearBackground(BLACK);
            duk_get_global_string(ctx, "draw");
            duk_call(ctx, 0 /*nargs*/);
            DrawTexture(tex, 0, 32, WHITE);
          };
          EndDrawing();
          duk_get_global_string(ctx, "update");
          duk_call(ctx, 0 /*nargs*/);
        }
        InitWindow(256, 256, "FantasyJS");
        SetTargetFPS(60);
      }
      strncpy(history[idx_hist], input, 4097);
      idx_hist++;
      for (int i = 0; i < idx_hist; i++) {
        printf("%d > %s\n", i, history[i]);
      }
      memset(input, 0, 4097);
      idx_in = 0;
    }
    BeginDrawing();
    {
      ClearBackground(BLACK);
      const char* format = frame % 32 < 16 ? "> %s_" : "> %s";
      DrawTextRec(
          GetFontDefault(),
          TextFormat(format, input),
          (Rectangle){28, 28, 200, 200},
          16.0,
          1.0,
          true,
          WHITE);
    }
    EndDrawing();
    frame++;
  }
  CloseWindow();
  return 0;
}
