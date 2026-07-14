import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Production unit IDs (found in your AdMob dashboard)
const PROD_BANNER_ID = 'ca-app-pub-7554968857567124/2957621503';
const PROD_REWARDED_ID = 'ca-app-pub-7554968857567124/4079131486';
const PROD_INTERSTITIAL_ID = 'ca-app-pub-7554968857567124/3390737906';

// Official Google AdMob Test IDs
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

// Check if we are in development mode
const isDev = import.meta.env.DEV;

class AdService {
  private isInitialized = false;

  async initialize() {
    if (!Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      await AdMob.initialize({
        // requestTrackingAuthorization is removed as it's not in AdMobInitializationOptions
      });
      this.isInitialized = true;
      console.log('AdMob Initialized');
    } catch (error) {
      console.error('AdMob initialization failed', error);
    }
  }

  async showBanner() {
    if (!Capacitor.isNativePlatform()) return;

    await this.initialize();

    const options: BannerAdOptions = {
      adId: isDev ? TEST_BANNER_ID : PROD_BANNER_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: isDev,
    };

    try {
      await AdMob.showBanner(options);
      console.log('Banner Ad showing');
    } catch (error) {
      console.error('Failed to show banner ad', error);
    }
  }

  async hideBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
    } catch (error) {
      console.error('Failed to hide banner ad', error);
    }
  }

  async showInterstitial() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Simulating Interstitial Ad on Web');
      return;
    }

    await this.initialize();

    const options = {
      adId: isDev ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID,
      isTesting: isDev,
    };

    try {
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('Interstitial Ad showing');
    } catch (error) {
      console.error('Failed to show interstitial ad', error);
    }
  }

  async showRewardedAd(): Promise<AdMobRewardItem | null> {
    if (!Capacitor.isNativePlatform()) {
      // Return a fake reward for web development
      return { type: 'credits', amount: 5 };
    }

    await this.initialize();

    const options: RewardAdOptions = {
      adId: isDev ? TEST_REWARDED_ID : PROD_REWARDED_ID,
      isTesting: isDev,
    };

    try {
      await AdMob.prepareRewardVideoAd(options);
      const reward = await AdMob.showRewardVideoAd();
      console.log('Rewarded Ad watched', reward);
      return reward;
    } catch (error) {
      console.error('Failed to show rewarded ad', error);
      return null;
    }
  }
}

export const adService = new AdService();
