import confetti from 'canvas-confetti';

let myConfetti: confetti.CreateTypes | null = null;

export const triggerConfetti = (options?: confetti.Options) => {
  if (!myConfetti) {
    const canvas = document.createElement('canvas');
    canvas.id = 'custom-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    // This transform is CRUCIAL for preventing blink/flicker on Android WebViews!
    canvas.style.transform = 'translateZ(0)';
    canvas.style.willChange = 'transform';
    canvas.style.backgroundColor = 'transparent';
    
    document.body.appendChild(canvas);

    myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false, // Disabling worker to prevent Capacitor origin crashes
    });
  }

  myConfetti(options);
};

export const resetConfetti = () => {
  if (myConfetti) {
    myConfetti.reset();
  }
};
