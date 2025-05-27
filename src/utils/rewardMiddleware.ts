import { RewardEventType } from "@/types/rewards";

// Define rewards action type at runtime for initialization
type RewardActions = {
  likePost: (id: string) => void;
  lovePost: (id: string) => void;
  commentPost: (id: string) => void;
  sharePost: (id: string) => void;
  createStatus: (id: string) => void;
  joinGroup: (id: string) => void;
  followUser: (id: string) => void;
  purchaseProduct: (id: string) => void;
  shareProduct: (id: string) => void;
  redeemPoints: (points: number, id: string) => void;
  bookSession: (id: string) => void;
  applyJob: (id: string) => void;
  listenAudioComic: (id: string) => void;
  listenPodcast: (id: string) => void;
  readComic: (id: string) => void;
  dailyLogin: () => void;
  registration: () => void;
  profileCompletion: () => void;
};

// Use type assertion to tell TypeScript about the window property
declare global {
  interface Window {
    rewardActions?: RewardActions;
  }
}

// Initialize an empty rewardActions object if it doesn't exist yet
if (typeof window !== "undefined" && !window.rewardActions) {
  // Create a temporary placeholder that logs actions until the real implementation is ready
  window.rewardActions = {
    likePost: (id: string) =>
      console.log("Reward action not fully initialized yet: likePost", id),
    lovePost: (id: string) =>
      console.log("Reward action not fully initialized yet: lovePost", id),
    commentPost: (id: string) =>
      console.log("Reward action not fully initialized yet: commentPost", id),
    sharePost: (id: string) =>
      console.log("Reward action not fully initialized yet: sharePost", id),
    createStatus: (id: string) =>
      console.log("Reward action not fully initialized yet: createStatus", id),
    joinGroup: (id: string) =>
      console.log("Reward action not fully initialized yet: joinGroup", id),
    followUser: (id: string) =>
      console.log("Reward action not fully initialized yet: followUser", id),
    purchaseProduct: (id: string) =>
      console.log(
        "Reward action not fully initialized yet: purchaseProduct",
        id
      ),
    shareProduct: (id: string) =>
      console.log("Reward action not fully initialized yet: shareProduct", id),
    redeemPoints: (points: number, id: string) =>
      console.log(
        "Reward action not fully initialized yet: redeemPoints",
        points,
        id
      ),
    bookSession: (id: string) =>
      console.log("Reward action not fully initialized yet: bookSession", id),
    applyJob: (id: string) =>
      console.log("Reward action not fully initialized yet: applyJob", id),
    listenAudioComic: (id: string) =>
      console.log(
        "Reward action not fully initialized yet: listenAudioComic",
        id
      ),
    listenPodcast: (id: string) =>
      console.log("Reward action not fully initialized yet: listenPodcast", id),
    readComic: (id: string) =>
      console.log("Reward action not fully initialized yet: readComic", id),
    dailyLogin: () =>
      console.log("Reward action not fully initialized yet: dailyLogin"),
    registration: () =>
      console.log("Reward action not fully initialized yet: registration"),
    profileCompletion: () =>
      console.log("Reward action not fully initialized yet: profileCompletion"),
  } as RewardActions;
}

/**
 * Trigger a reward action using the global reward actions utility
 */
export const triggerReward = (
  eventType: RewardEventType,
  referenceId?: string,
  points?: number
) => {
  if (window.rewardActions) {
    switch (eventType) {
      case RewardEventType.LIKE_POST:
        window.rewardActions.likePost(referenceId || "");
        break;
      case RewardEventType.LOVE_POST:
        window.rewardActions.lovePost(referenceId || "");
        break;
      case RewardEventType.COMMENT_POST:
        window.rewardActions.commentPost(referenceId || "");
        break;
      case RewardEventType.SHARE_POST:
        window.rewardActions.sharePost(referenceId || "");
        break;
      case RewardEventType.CREATE_STATUS:
        window.rewardActions.createStatus(referenceId || "");
        break;
      case RewardEventType.JOIN_GROUP:
        window.rewardActions.joinGroup(referenceId || "");
        break;
      case RewardEventType.FOLLOW_USER:
        window.rewardActions.followUser(referenceId || "");
        break;
      case RewardEventType.PURCHASE_PRODUCT:
        window.rewardActions.purchaseProduct(referenceId || "");
        break;
      case RewardEventType.SHARE_PRODUCT:
        window.rewardActions.shareProduct(referenceId || "");
        break;
      case RewardEventType.REDEEM_POINTS:
        window.rewardActions.redeemPoints(points || 0, referenceId || "");
        break;
      case RewardEventType.BOOK_SESSION:
        window.rewardActions.bookSession(referenceId || "");
        break;
      case RewardEventType.APPLY_JOB:
        window.rewardActions.applyJob(referenceId || "");
        break;
      case RewardEventType.LISTEN_AUDIO_COMIC:
        window.rewardActions.listenAudioComic(referenceId || "");
        break;
      case RewardEventType.LISTEN_PODCAST:
        window.rewardActions.listenPodcast(referenceId || "");
        break;
      case RewardEventType.READ_COMIC:
        window.rewardActions.readComic(referenceId || "");
        break;
      case RewardEventType.DAILY_LOGIN:
        window.rewardActions.dailyLogin();
        break;
      case RewardEventType.REGISTRATION:
        window.rewardActions.registration();
        break;
      case RewardEventType.PROFILE_COMPLETION:
        window.rewardActions.profileCompletion();
        break;
      default:
        console.warn(`No handler for reward event type: ${eventType}`);
    }
  } else {
    console.warn("Reward actions not initialized yet");
  }
};
