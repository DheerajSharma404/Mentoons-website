import axiosInstance from "@/api/axios";
import AboutSection from "@/components/adda/userProfile/aboutSection";
import FriendsSection from "@/components/adda/userProfile/freindSections";
import ErrorDisplay from "@/components/adda/userProfile/loader/errorDisplay";
import LoadingSpinner from "@/components/adda/userProfile/loader/spinner";
import PostsList from "@/components/adda/userProfile/postList";
import ProfileHeader from "@/components/adda/userProfile/profilesHeader";
import ProfileTabs from "@/components/adda/userProfile/profileTabs";
import { TabType, User, UserSummary } from "@/types";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Post, PostType } from "./userProfile";

const ProfileDetails = () => {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [numberOfPosts, setNumberOfPosts] = useState<number>(0);
  const [isFriend, setIsFriend] = useState(false);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setUser(null);
    setUserPosts([]);
    console.log(userId);
    if (!userId) {
      setError("User ID is required");
      setIsLoading(false);
      return;
    }

    console.log("reached");

    const fetchUserData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No token found");
        }
        const response = await axiosInstance.get(`/user/friend/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response.data.data.isFriend);
        setUser(response.data.data.user);
        setFollowers(response.data.data.user.followers);
        setFollowing(response.data.data.user.following);
        setIsFriend(response.data.data.isFriend);

        fetchUserPosts(userId);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user data"
        );
        setIsLoading(false);
      }
    };

    const fetchUserFriends = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No token found");
        }
        const response = await axiosInstance("/adda/getFriends/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response.data.data);
        setFriends(response.data.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user posts"
        );
        setIsLoading(false);
      }
    };

    const fetchUserPosts = async (uid: string) => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No token found");
        }
        const response = await axiosInstance(`/posts/friends-post/${uid}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response.data.data);

        const formattedPosts = response.data.data.map(
          (post: Partial<Post>) => ({
            ...post,
            postType: (post.postType as PostType) || "text",
            user: post.user || {
              _id: user?._id || "",
              name: user?.name || "",
              picture: user?.picture || "",
              email: user?.email || "",
            },
            shares: post.shares || [],
            saves: post.saves || 0,
            visibility: post.visibility || "public",
          })
        );

        console.log(
          "posts ======================================>",
          formattedPosts
        );
        setNumberOfPosts(formattedPosts.length ?? 0);
        setUserPosts(formattedPosts as unknown as Post[]);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user posts"
        );
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchUserFriends();
  }, [userId]);

  if (isLoading) {
    return <LoadingSpinner message="Loading user profile..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!user) {
    return (
      <ErrorDisplay
        message="User not found"
        description="The requested user profile could not be loaded or doesn't exist."
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return <PostsList posts={userPosts} user={user} />;

      case "about":
        return <AboutSection user={user} />;
      case "friends":
        return <FriendsSection friends={friends} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-full px-2 pt-4 mx-auto sm:max-w-3xl md:max-w-4xl lg:max-w-5xl sm:pt-6 md:pt-8">
        <ProfileHeader
          user={user}
          totalPosts={numberOfPosts}
          totalFollowing={following}
          totalFollowers={followers}
          isCurrentUser={user.clerkId === currentUser?.id || isFriend}
        />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-4 sm:mt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ProfileDetails;
