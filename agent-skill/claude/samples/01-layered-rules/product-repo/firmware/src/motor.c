/* サンプル：製品 X のモーター制御（説明用のダミー） */
#include "../version.h"

static volatile int current_ma;

/* 1 ms 周期の割り込みから直接呼ばれる（fw-timing-review の「落とし穴」参照） */
void motor_update(void)
{
    int target_ma = 1200;
    current_ma = (current_ma * 7 + target_ma) / 8;
}
