#include "quickjs/cutils.h"
#include "quickjs/quickjs.h"
#include <raylib.h>

// Utils

int JS_ToColor(JSContext* ctx, Color* color, JSValue obj) {
  {
    int r;
    JSValue val = JS_GetPropertyStr(ctx, obj, "r");
    int e       = JS_ToInt32(ctx, &r, val);
    JS_FreeValue(ctx, val);
    if (e)
      goto fail;
    color->r = (unsigned char)r;
  };
  {
    int g;
    JSValue val = JS_GetPropertyStr(ctx, obj, "g");
    int e       = JS_ToInt32(ctx, &g, val);
    JS_FreeValue(ctx, val);
    if (e)
      goto fail;
    color->g = (unsigned char)g;
  };
  {
    int b;
    JSValue val = JS_GetPropertyStr(ctx, obj, "b");
    int e       = JS_ToInt32(ctx, &b, val);
    JS_FreeValue(ctx, val);
    if (e)
      goto fail;
    color->b = (unsigned char)b;
  };
  {
    int a;
    JSValue val = JS_GetPropertyStr(ctx, obj, "a");
    int e       = JS_ToInt32(ctx, &a, val);
    JS_FreeValue(ctx, val);
    if (e)
      goto fail;
    color->a = (unsigned char)a;
  };
  return 0;
fail:
  return -1;
}

int JS_ToVector2(JSContext* ctx, Vector2* vec2, JSValue obj) {
  int x;
  {
    JSValue val = JS_GetPropertyStr(ctx, obj, "x");
    JS_ToInt32(ctx, &x, val);
    JS_FreeValue(ctx, val);
    vec2->x = x;
  }
  int y;
  {
    JSValue val = JS_GetPropertyStr(ctx, obj, "y");
    JS_ToInt32(ctx, &y, val);
    JS_FreeValue(ctx, val);
    vec2->y = y;
  }
  return 0;
}

// Exports

static JSValue initWindow(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  int width;
  if (JS_ToInt32(ctx, &width, argv[0]))
    return JS_EXCEPTION;
  int height;
  if (JS_ToInt32(ctx, &height, argv[1]))
    return JS_EXCEPTION;
  const char* title = JS_ToCString(ctx, argv[2]);
  InitWindow(width, height, title);
  JS_FreeCString(ctx, title);
  return JS_NULL;
}

static JSValue closeWindow(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  CloseWindow();
  return JS_NULL;
}

static JSValue setTargetFPS(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  int fps;
  if (JS_ToInt32(ctx, &fps, argv[0]))
    return JS_EXCEPTION;
  SetTargetFPS(fps);
  return JS_NULL;
}

static JSValue windowShouldClose(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  return JS_NewBool(ctx, WindowShouldClose());
}

static JSValue beginDrawing(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  BeginDrawing();
  return JS_NULL;
}

static JSValue endDrawing(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  EndDrawing();
  return JS_NULL;
}

static JSValue clearBackground(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  Color color = {0, 0, 0, 0};
  if (JS_ToColor(ctx, &color, argv[0]))
    return JS_EXCEPTION;
  ClearBackground(color);
  return JS_NULL;
}

static JSValue drawRectangle(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  int posX;
  if (JS_ToInt32(ctx, &posX, argv[0]))
    return JS_EXCEPTION;
  int posY;
  if (JS_ToInt32(ctx, &posY, argv[1]))
    return JS_EXCEPTION;
  int width;
  if (JS_ToInt32(ctx, &width, argv[2]))
    return JS_EXCEPTION;
  int height;
  if (JS_ToInt32(ctx, &height, argv[3]))
    return JS_EXCEPTION;
  Color color = {0, 0, 0, 0};
  if (JS_ToColor(ctx, &color, argv[4]))
    return JS_EXCEPTION;
  DrawRectangle(posX, posY, width, height, color);
  return JS_NULL;
}

Font FONTS[8];
int FONTS_LEN = 0;

static JSValue drawTextEx(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  int idx;
  if (JS_ToInt32(ctx, &idx, argv[0]))
    return JS_EXCEPTION;
  Font font        = FONTS[idx];
  const char* text = JS_ToCString(ctx, argv[1]);
  Vector2 position = {0, 0};
  if (JS_ToVector2(ctx, &position, argv[2]))
    return JS_EXCEPTION;
  int fontSize;
  if (JS_ToInt32(ctx, &fontSize, argv[3]))
    return JS_EXCEPTION;
  int spacing;
  if (JS_ToInt32(ctx, &spacing, argv[4]))
    return JS_EXCEPTION;
  Color color = {0, 0, 0, 0};
  if (JS_ToColor(ctx, &color, argv[5]))
    return JS_EXCEPTION;
  DrawTextEx(font, text, position, fontSize, spacing, color);
  JS_FreeCString(ctx, text);
  return JS_NULL;
}

static JSValue isKeyPressed(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  int key;
  if (JS_ToInt32(ctx, &key, argv[0]))
    return JS_EXCEPTION;
  return JS_NewBool(ctx, IsKeyPressed(key));
}

static JSValue loadFont(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
  const char* filename = JS_ToCString(ctx, argv[0]);
  FONTS[FONTS_LEN++]   = LoadFont(filename);
  JS_FreeCString(ctx, filename);
  return JS_NewInt32(ctx, FONTS_LEN - 1);
}

static const JSCFunctionListEntry exports[] = {
    JS_CFUNC_DEF("initWindow", 3, initWindow),
    JS_CFUNC_DEF("closeWindow", 0, closeWindow),
    JS_CFUNC_DEF("setTargetFPS", 1, setTargetFPS),
    JS_CFUNC_DEF("windowShouldClose", 0, windowShouldClose),
    JS_CFUNC_DEF("beginDrawing", 0, beginDrawing),
    JS_CFUNC_DEF("endDrawing", 0, endDrawing),
    JS_CFUNC_DEF("clearBackground", 1, clearBackground),
    JS_CFUNC_DEF("drawRectangle", 5, drawRectangle),
    JS_CFUNC_DEF("drawTextEx", 6, drawTextEx),
    JS_CFUNC_DEF("isKeyPressed", 1, isKeyPressed),
    JS_CFUNC_DEF("loadFont", 1, loadFont),
};

static int set_exports(JSContext* ctx, JSModuleDef* m) {
  return JS_SetModuleExportList(ctx, m, exports, countof(exports));
}

JSModuleDef* js_init_module(JSContext* ctx, const char* module_name) {
  JSModuleDef* m;
  m = JS_NewCModule(ctx, module_name, set_exports);
  if (!m)
    return NULL;
  JS_AddModuleExportList(ctx, m, exports, countof(exports));
  return m;
}