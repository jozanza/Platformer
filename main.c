#include <raylib.h>
#include <stdio.h>

char* GAME_TITLE = "Platformer!";
int SCREEN_W     = 500;
int SCREEN_H     = 500;

int main(void) {
  //* Open a window
  InitWindow(SCREEN_W, SCREEN_H, GAME_TITLE);
  SetTargetFPS(60); //! set this or else!

  //* Initalize the game state
  int x        = SCREEN_W / 2;
  int y        = SCREEN_H / 2;
  int speed    = 0;
  int speedCap = 10;
  int accel    = 4;
  float size   = 10;
  Color color  = RED;

  //* Enter the game loop
  //- NOTE: Will run as long as window is not closed (or ESC is pressed)
  while (!WindowShouldClose()) {
    //* Update the game state
    // Adjust speed or momentum
    bool isMoving = speed != 0;
    if (isMoving) {
      if (speed < 0) {
        speed++;
      }
      if (speed > 0) {
        speed--;
      }
    }

    // increase left velocity
    if (IsKeyDown(KEY_A) && speed > -speedCap) {
      // apply acceleration
      speed -= accel;
      // If going too fast
      if (speed < -speedCap) {
        // Reset to speed cap
        speed = -speedCap;
      }
    }

    // increase right velocity
    if (IsKeyDown(KEY_D) && speed < speedCap) {
      // apply acceleration
      speed += accel;
      // If going too fast
      if (speed < speedCap) {
        // Reset to speed cap
        speed = speedCap;
      }
    }

    // Move ball left/right
    x += speed;

    //* Draw the game state
    BeginDrawing();
    ClearBackground(WHITE);
    // x: 252
    DrawCircle(x, y, size, color);
    EndDrawing();
  }

  //* Done with this game. Program is closing
  CloseWindow();
  return 0;
}
