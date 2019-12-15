#include <raylib.h>
#include <stdio.h>

typedef struct Player {
  Rectangle rect;
  Color color;
  int accelX;
  int accelY;
  int speedX;
  int speedY;
  int speedCapX;
  int speedCapY;
} Player;

typedef struct Platform {
  Rectangle rect;
  Color color;
} Platform;

// DEFINITIONS AND TERMS TO HELP //
// && -= += ==
// a <infix> b
// a || b <- a or b
// a && b <- a and b
// a -= b <- subtract b from a
// a += b <- add b to a
// a == b <- a is equal to b
// a != b <- a does not equal b
// -- minus 1
// ++ add 1

void DrawPlayer(Player* p) {
  DrawRectangle(p->rect.x, p->rect.y, p->rect.width, p->rect.height, p->color);
}

void UpdatePlayer(Player* p, Platform* platforms, int numPlatforms) {
  // handle friction
  bool isPlayerWalking = p->speedX != 0;
  if (isPlayerWalking) {
    // moving right
    if (p->speedX > 0) {
      p->speedX--;
    }
    // moving left
    if (p->speedX < 0) {
      p->speedX++;
    }
  }
   
  // handle gravity
  bool isPlayerInTheAir = false;
  if (isPlayerInTheAir) {
    // apply gravity
  }

  // Moving right
  bool isMaxRightSpeed = p->speedX >= p->speedCapX;
  bool isWallToRight = false; // TODO
  bool canPlayerMoveRight = !isMaxRightSpeed && !isWallToRight;
  bool doesPlayerWantToMoveRight = IsKeyDown(KEY_D);
  bool shouldPlayerMoveRight = doesPlayerWantToMoveRight && canPlayerMoveRight;

  if (shouldPlayerMoveRight) {
    // puts("HIIIIIIT!!!!");
    // printf("%s: (%d, %d)\n", "position", p->x, p->y); <- how to debug code
    
    // apply acceleration
    p->speedX += p->accelX;
    // If going too fast
    if (p->speedX > p->speedCapX) {
      // Reset to speed cap
      p->speedX = p->speedCapX;
    }
  }
  
  // Moving left
  bool isMaxLeftSpeed = p->speedX <= -p->speedCapX;
  if (IsKeyDown(KEY_A) && !isMaxLeftSpeed) {
    // apply acceleration
    p->speedX -= p->accelX;
    // If going too fast
    if (p->speedX < -p->speedCapX) {
      // Reset to speed cap
      p->speedX = -p->speedCapX;
    }
  }

  // Project player's next position
  Rectangle nextRect = {
    .x = p->rect.x + p->speedX,
    .y = p->rect.y + p->speedY,
    .width = p->rect.width,
    .height = p->rect.height,
  };
  // Loops over platforms and find collisions
  for (int i = 0; i < numPlatforms; i++) {
    Platform platform = platforms[i];
    bool willHitPlatform = CheckCollisionRecs(nextRect, platform.rect);
    // If collided, then stop the player
    if (willHitPlatform) {
      bool isMovingLeft = p->speedX < 0;
      if (isMovingLeft) {
        // stop at right side of platform
        nextRect.x = platform.rect.x + platform.rect.width;
      }
      bool isMovingRight = p->speedX > 0;
      if (isMovingRight) {
        // stop at the left side of the platform
        nextRect.x = platform.rect.x - p->rect.width;
      }
      // stop player
      p->speedX = 0;
      break;
    }
  }

  // Actually move the player
  p->rect = nextRect;

  if (IsKeyDown(KEY_SPACE)) {
    // make player jump
  }
}

char* GAME_TITLE = "Project S.H.E.L.L.";
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
  int floorY       = y;
  int speed        = 0;
  int speedCap     = 10;
  int accel        = 4;
  int gravity      = 0;
  int fall         = 1;
  int jump         = 5;
  int jumpCap      = 10;
  int gravCap      = 2;
  float size       = 10;
  Color color      = RED;
  
  Player shell = {
    .rect = (Rectangle){x, y, 8, 8},
    .accelX = 4,
    .accelY = 5,
    .speedX = 0,
    .speedY = 0,
    .speedCapX = 10,
    .speedCapY = 2,
    .color = RED,
  };
  
  Platform platforms[3] = {
    {.rect={x + 64, y + 8, 16, 32}, .color=GREEN},
    {.rect={x - 64, y + 8, 16, 32}, .color=RED},
    {.rect={x + 200, y + 8, 16, 32}, .color=BLUE},
  };

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

      // Apply jump
      // if (IsKeyDown(KEY_SPACE)) {
      //   y -= jump;
      //   jump++; 
      //   if (jump > jumpCap) {
      //     // Reset to jump cap
      //     jump = gravity;
      //   }
      // }

      // Move ball left/right
      // x += speed;
      // Make ball fall 
      // y += gravity;

      UpdatePlayer(&shell, &platforms[0], 3);

      //* Draw Level scene
      BeginDrawing();
      // clear screen
      ClearBackground(WHITE);

      // draw player
      DrawPlayer(&shell);

      // Draw all platforms
      DrawRectangle(0, floorY + 8, SCREEN_W, 8, BLACK);
      for (int i = 0; i < 3; i++) {
        Platform p = platforms[i];
        DrawRectangle(p.rect.x, p.rect.y - p.rect.height, p.rect.width, p.rect.height, p.color);
      }

      EndDrawing();
    }
  }

  //* Done with this game. Program is closing
  CloseWindow();
  return 0;
}
