#include <raylib.h>
#include <stdio.h>

char* GAME_TITLE = "Platformer!";
int SCREEN_W     = 500;
int SCREEN_H     = 500;
int TITLE_SCENE  = 1;
int LEVEL_SCENE  = 2;

int main(void) {
  //* Open a window
  InitWindow(SCREEN_W, SCREEN_H, GAME_TITLE);
  SetTargetFPS(60); //! set this or else!

  //* Initalize the game state
  int currentScene = TITLE_SCENE;
  int x            = SCREEN_W / 2;
  int y            = SCREEN_H / 2;
  int speed        = 0;
  int speedCap     = 10;
  int accel        = 4;
  float size       = 10;
  Color color      = RED;

  //* Enter the game loop
  //- NOTE: Will run as long as window is not closed (or ESC is pressed)
  while (!WindowShouldClose()) {
    //! TITLE SCENE
    if (currentScene == TITLE_SCENE) {
      //* Update Title scene
      if (IsKeyPressed(KEY_ENTER)) {
        currentScene = LEVEL_SCENE;
      }
      //* Draw Title scene
      BeginDrawing();
      ClearBackground(WHITE);
      float fontSize = 24;
      int fontWidth  = MeasureText(GAME_TITLE, fontSize);
      DrawText(
          GAME_TITLE,
          (SCREEN_W / 2) - (fontWidth / 2),
          (SCREEN_H / 2) - (fontSize / 2),
          fontSize,
          BLACK);
      EndDrawing();
    }

    //! LEVEL SCENE
    else if (currentScene == LEVEL_SCENE) {
      //* Update Level scene
      if (IsKeyPressed(KEY_BACKSPACE)) {
        currentScene = TITLE_SCENE;
      }
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

      //* Draw Level scene
      BeginDrawing();
      ClearBackground(WHITE);
      DrawCircle(x, y, size, color);
      EndDrawing();
    }
  }

  //* Done with this game. Program is closing
  CloseWindow();
  return 0;
}
