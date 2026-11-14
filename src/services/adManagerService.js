// src/services/adManagerService.js

// ⚠️ YAHAN APNI DETAILS DAALO
const NETWORK_CODE = "23301294554"; // Step 1 wala number
const AD_UNIT_PATH = "/23301294554/file"; // Step 2 wala path

let rewardedSlot = null;
let isAdReady = false;

// Ad ko load karo (page khulte hi background mein)
export function loadRewardedAd() {
  return new Promise((resolve) => {
    window.googletag.cmd.push(() => {
      // Pehle se koi slot hai toh hatao
      if (rewardedSlot) {
        window.googletag.destroySlots([rewardedSlot]);
      }

      // Naya rewarded ad slot banao
      rewardedSlot = window.googletag.defineOutOfPageSlot(
        AD_UNIT_PATH,
        window.googletag.enums.OutOfPageFormat.REWARDED
      );

      if (!rewardedSlot) {
        console.error("Rewarded ad slot could not be created. Check if viewport meta tag exists.");
        resolve(false);
        return;
      }

      rewardedSlot.addService(window.googletag.pubads());
      window.googletag.enableServices();
      window.googletag.display(rewardedSlot);

      // Jab ad ready ho jaye
      window.googletag.pubads().addEventListener("rewardedSlotReady", (event) => {
        isAdReady = true;
        console.log("✅ Ad is ready to be shown");
        resolve(true);
      });

      // Jab ad fail ho
      window.googletag.pubads().addEventListener("rewardedSlotClosed", () => {
        isAdReady = false;
        // Naya ad load karo next time ke liye
        loadRewardedAd();
      });

    });
  });
}

// Ad ko show karo (jab user file kholna chahe)
export function showRewardedAd(onRewardEarned, onAdFailed) {
  if (!isAdReady || !rewardedSlot) {
    console.log("Ad not ready yet, trying to load...");
    loadRewardedAd().then((ready) => {
      if (ready) {
        showRewardedAd(onRewardEarned, onAdFailed);
      } else {
        onAdFailed();
      }
    });
    return;
  }

  // Reward milne ka event
  const rewardListener = window.googletag.pubads().addEventListener("rewardedSlotGranted", (event) => {
    console.log("🎉 Reward granted!");
    // Reward mil gaya
    onRewardEarned();
  });

  // Ad band hone ka event
  const closeListener = window.googletag.pubads().addEventListener("rewardedSlotClosed", () => {
    // Listeners hatao
    window.googletag.pubads().removeEventListener("rewardedSlotGranted", rewardListener);
    window.googletag.pubads().removeEventListener("rewardedSlotClosed", closeListener);
    isAdReady = false;
  });

  // Ad dikhao
  const success = rewardedSlot.makeRewardedVisible();
  if (!success) {
    onAdFailed();
  }
}