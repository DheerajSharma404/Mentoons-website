export interface UserStatusInterface {
  id: string;
  userId: string;
  userProfilePicture: string;
  viewCount: number;
  username: string;
  type: "video" | "image";
  status: "watched" | "unwatched";
  url: string;
  createdAt: string;
}

export interface RequestInterface {
  userName: string;
  accepted: boolean;
  profilePic: string;
}
