/* File generated automatically by the QuickJS compiler. */

#include "quickjs-libc.h"

const uint32_t qjsc_hello_size = 87;

const uint8_t qjsc_hello[87] = {
 0x02, 0x04, 0x0e, 0x63, 0x6f, 0x6e, 0x73, 0x6f,
 0x6c, 0x65, 0x06, 0x6c, 0x6f, 0x67, 0x16, 0x48,
 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72,
 0x6c, 0x64, 0x22, 0x65, 0x78, 0x61, 0x6d, 0x70,
 0x6c, 0x65, 0x73, 0x2f, 0x68, 0x65, 0x6c, 0x6c,
 0x6f, 0x2e, 0x6a, 0x73, 0x0e, 0x00, 0x06, 0x00,
 0x9e, 0x01, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00,
 0x14, 0x01, 0xa0, 0x01, 0x00, 0x00, 0x00, 0x39,
 0xf1, 0x00, 0x00, 0x00, 0x43, 0xf2, 0x00, 0x00,
 0x00, 0x04, 0xf3, 0x00, 0x00, 0x00, 0x24, 0x01,
 0x00, 0xd1, 0x28, 0xe8, 0x03, 0x01, 0x00,
};

int main(int argc, char **argv)
{
  JSRuntime *rt;
  JSContext *ctx;
  rt = JS_NewRuntime();
  ctx = JS_NewContextRaw(rt);
  JS_AddIntrinsicBaseObjects(ctx);
  js_std_add_helpers(ctx, argc, argv);
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  js_std_loop(ctx);
  JS_FreeContext(ctx);
  JS_FreeRuntime(rt);
  return 0;
}
