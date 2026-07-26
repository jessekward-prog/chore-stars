export const haptics = {
  tap: () => navigator.vibrate?.(15),
  success: () => navigator.vibrate?.([20, 40, 30, 40, 60]),
  error: () => navigator.vibrate?.([80, 30, 80]),
}
