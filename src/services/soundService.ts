const CLICK_SOUND_URL = 'sounds/click.wav';
const WHEEL_SPIN_SOUND_URL = 'sounds/wheel_spin.wav';
const BOTTLE_SPIN_SOUND_URL = 'sounds/bottle_spin.wav';
const BOTTLE_RESULT_SOUND_URL = 'sounds/bottle_result.wav';
const COIN_FLIP_SOUND_URL = 'sounds/coin_flip.wav';
const COOKIE_BREAK_SOUND_URL = 'sounds/cookie_break.wav';
const MUSIC_SOUND_URL = 'sounds/bgm.wav';
const RPS_ROUND_SOUND_URL = 'sounds/rps_round.wav';

const WIN_SOUND_URL = 'sounds/win.wav';
const LOSE_SOUND_URL = 'sounds/lose.wav';
const JACKPOT_SOUND_URL = 'sounds/jackpot.wav';

class SoundService {
  private clickAudio: HTMLAudioElement | null = null;
  private wheelSpinAudio: HTMLAudioElement | null = null;
  private bottleSpinAudio: HTMLAudioElement | null = null;
  private bottleResultAudio: HTMLAudioElement | null = null;
  private coinFlipAudio: HTMLAudioElement | null = null;
  private cookieBreakAudio: HTMLAudioElement | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private winAudio: HTMLAudioElement | null = null;
  private loseAudio: HTMLAudioElement | null = null;
  private jackpotAudio: HTMLAudioElement | null = null;
  private rpsRoundAudio: HTMLAudioElement | null = null;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private soundVolume: number = 0.5;
  private musicVolume: number = 0.25;

  constructor() {
    if (typeof window !== 'undefined') {
      this.clickAudio = new Audio(CLICK_SOUND_URL);
      this.wheelSpinAudio = new Audio(WHEEL_SPIN_SOUND_URL);
      this.wheelSpinAudio.loop = true;
      this.bottleSpinAudio = new Audio(BOTTLE_SPIN_SOUND_URL);
      this.bottleSpinAudio.loop = true;
      this.bottleResultAudio = new Audio(BOTTLE_RESULT_SOUND_URL);
      this.coinFlipAudio = new Audio(COIN_FLIP_SOUND_URL);
      this.cookieBreakAudio = new Audio(COOKIE_BREAK_SOUND_URL);
      this.musicAudio = new Audio(MUSIC_SOUND_URL);
      this.musicAudio.loop = true;

      this.winAudio = new Audio(WIN_SOUND_URL);
      this.loseAudio = new Audio(LOSE_SOUND_URL);
      this.jackpotAudio = new Audio(JACKPOT_SOUND_URL);
      this.rpsRoundAudio = new Audio(RPS_ROUND_SOUND_URL);
      this.rpsRoundAudio.loop = true;
    }
  }

  setPreferences(sound: boolean, music: boolean, soundVol: number, musicVol: number) {
    this.soundEnabled = sound;
    this.musicEnabled = music;
    this.soundVolume = soundVol;
    this.musicVolume = musicVol;

    if (this.clickAudio) this.clickAudio.volume = soundVol;
    if (this.wheelSpinAudio) this.wheelSpinAudio.volume = soundVol;
    if (this.bottleSpinAudio) this.bottleSpinAudio.volume = soundVol;
    if (this.bottleResultAudio) this.bottleResultAudio.volume = soundVol;
    if (this.coinFlipAudio) this.coinFlipAudio.volume = soundVol;
    if (this.cookieBreakAudio) this.cookieBreakAudio.volume = soundVol;
    if (this.winAudio) this.winAudio.volume = soundVol;
    if (this.loseAudio) this.loseAudio.volume = soundVol;
    if (this.jackpotAudio) this.jackpotAudio.volume = soundVol;
    if (this.rpsRoundAudio) this.rpsRoundAudio.volume = Math.min(1, soundVol * 2.5);

    if (this.musicAudio) {
      this.musicAudio.volume = musicVol;
      this.updateMusicState();
    }
  }

  playClick() {
    if (this.soundEnabled && this.clickAudio && this.soundVolume > 0) {
      this.clickAudio.currentTime = 0;
      this.clickAudio.play().catch(() => { });
    }
  }

  playWheelSpin() {
    if (this.soundEnabled && this.wheelSpinAudio && this.soundVolume > 0) {
      this.wheelSpinAudio.currentTime = 0;
      this.wheelSpinAudio.play().catch(() => { });
    }
  }

  stopWheelSpin() {
    if (this.wheelSpinAudio) {
      this.wheelSpinAudio.pause();
      this.wheelSpinAudio.currentTime = 0;
    }
  }

  playBottleSpin() {
    if (this.soundEnabled && this.bottleSpinAudio && this.soundVolume > 0) {
      this.bottleSpinAudio.currentTime = 0;
      this.bottleSpinAudio.play().catch(() => { });
    }
  }

  stopBottleSpin() {
    if (this.bottleSpinAudio) {
      this.bottleSpinAudio.pause();
      this.bottleSpinAudio.currentTime = 0;
    }
  }

  playBottleResult() {
    if (this.soundEnabled && this.bottleResultAudio && this.soundVolume > 0) {
      this.bottleResultAudio.currentTime = 0;
      this.bottleResultAudio.play().catch(() => { });
    }
  }

  playCoinFlip() {
    if (this.soundEnabled && this.coinFlipAudio && this.soundVolume > 0) {
      this.coinFlipAudio.currentTime = 0;
      this.coinFlipAudio.play().catch(() => { });
    }
  }

  stopCoinFlip() {
    if (this.coinFlipAudio) {
      this.coinFlipAudio.pause();
      this.coinFlipAudio.currentTime = 0;
    }
  }

  playCookieBreak() {
    if (this.soundEnabled && this.cookieBreakAudio && this.soundVolume > 0) {
      this.cookieBreakAudio.currentTime = 0;
      this.cookieBreakAudio.play().catch(() => { });
    }
  }

  playWin() {
    if (this.soundEnabled && this.winAudio && this.soundVolume > 0) {
      this.winAudio.currentTime = 0;
      this.winAudio.play().catch(() => { });
    }
  }

  playLose() {
    if (this.soundEnabled && this.loseAudio && this.soundVolume > 0) {
      this.loseAudio.currentTime = 0;
      this.loseAudio.play().catch(() => { });
    }
  }

  playRpsRound() {
    if (this.soundEnabled && this.rpsRoundAudio && this.soundVolume > 0) {
      this.rpsRoundAudio.currentTime = 0;
      this.rpsRoundAudio.play().catch(() => { });
    }
  }

  stopRpsRound() {
    if (this.rpsRoundAudio) {
      this.rpsRoundAudio.pause();
      this.rpsRoundAudio.currentTime = 0;
    }
  }

  playJackpot() {
    if (this.soundEnabled && this.jackpotAudio && this.soundVolume > 0) {
      this.jackpotAudio.currentTime = 0;
      this.jackpotAudio.play().catch(() => { });
    }
  }

  private updateMusicState() {
    if (!this.musicAudio) return;

    if (this.musicEnabled && this.musicVolume > 0) {
      this.musicAudio.play().catch(() => { });
    } else {
      this.musicAudio.pause();
    }
  }

  playMusic() {
    this.updateMusicState();
  }

  pauseMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
    }
  }

  stopAllGameSounds() {
    this.stopWheelSpin();
    this.stopBottleSpin();
    this.stopCoinFlip();
    this.stopRpsRound();
    if (this.bottleResultAudio) {
      this.bottleResultAudio.pause();
      this.bottleResultAudio.currentTime = 0;
    }
    if (this.winAudio) {
      this.winAudio.pause();
      this.winAudio.currentTime = 0;
    }
    if (this.loseAudio) {
      this.loseAudio.pause();
      this.loseAudio.currentTime = 0;
    }
    if (this.jackpotAudio) {
      this.jackpotAudio.pause();
      this.jackpotAudio.currentTime = 0;
    }
  }
}

export const soundService = new SoundService();

