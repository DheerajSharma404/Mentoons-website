import Reactions from "@/components/adda/home/addPosts/likes/reactions";
import Share from "@/components/adda/home/addPosts/share/share";
import { RewardEventType } from "@/types/rewards";
import { triggerReward } from "@/utils/rewardMiddleware";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BiArrowBack, BiComment, BiLock } from "react-icons/bi";
import {
  FaBookmark,
  FaMapMarkerAlt,
  FaRegBookmark,
  FaUserPlus,
} from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// Types
interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    picture: string;
  };
  content: string;
  createdAt: string;
}

interface PostDetails {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
    picture: string;
    bio?: string;
  };
  content?: string;
  title?: string;
  postType: "text" | "photo" | "video" | "article" | "event" | "mixed";
  media?: Array<{
    url: string;
    type: "image" | "video";
    caption?: string;
  }>;
  article?: {
    body: string;
    coverImage?: string;
  };
  event?: {
    startDate: string | Date;
    endDate?: string | Date;
    venue: string;
    description: string;
    coverImage?: string;
  };
  likes: string[];
  comments: Comment[];
  shares: string[];
  createdAt: string | Date;
  visibility: "public" | "friends" | "private";
  tags?: string[];
  location?: string;
}

// Authentication Modal Component
const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  // Handle redirect after auth
  const handleAuth = (authType: "signin" | "signup") => {
    // Store the current path to redirect back after auth
    localStorage.setItem("authRedirectUrl", currentPath);
    navigate(`/${authType === "signin" ? "sign-in" : "sign-up"}`, {
      state: { from: currentPath },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-xl">
        <button
          onClick={onClose}
          disabled={isSignedIn}
          className="absolute text-gray-500 top-4 right-4 hover:text-gray-700"
        >
          <FaXmark size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full">
            <BiLock className="text-4xl text-orange-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Sign in or register to view this post, engage with the community,
            and access all features.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleAuth("signin")}
            className="flex items-center justify-center w-full py-3 font-medium text-white transition-colors bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            <span className="mr-2">Sign In</span>
          </button>

          <button
            onClick={() => handleAuth("signup")}
            className="flex items-center justify-center w-full py-3 font-medium text-orange-500 transition-colors border-2 border-orange-500 rounded-lg hover:bg-orange-50"
          >
            <FaUserPlus className="mr-2" />
            <span>Create an Account</span>
          </button>
        </div>

        <div className="pt-6 mt-6 text-sm text-center text-gray-500 border-t border-gray-200">
          <p>
            Join our community to access exclusive content, interact with posts,
            and connect with like-minded individuals.
          </p>
        </div>
      </div>
    </div>
  );
};

const PostDetailsPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSavedPost, setIsSavedPost] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for redirect from authentication
  useEffect(() => {
    const redirectUrl = localStorage.getItem("authRedirectUrl");
    if (redirectUrl && isSignedIn) {
      localStorage.removeItem("authRedirectUrl");
    }
  }, [isSignedIn, location.pathname]);

  useEffect(() => {
    const fetchPostDetails = async () => {
      setLoading(true);
      try {
        // Check if user is signed in
        if (!isSignedIn) {
          setShowAuthModal(true);
          setLoading(false);
          return;
        }

        // Check for token without assignment
        if (!(await getToken())) {
          setShowAuthModal(true);
          setLoading(false);
          return;
        }

        // Use token directly in the request
        const response = await axios.get(
          `${import.meta.env.VITE_PROD_URL}/posts/${postId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );
        console.log(response.data);
        setPost(response.data.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching post details:", err);
        setError("Failed to load post details. Please try again later.");
        setLoading(false);
      }
    };

    // Check if the post is saved
    const checkSavedStatus = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_PROD_URL}/feeds/posts/${postId}/check-saved`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(response.data.data);
        setIsSavedPost(response.data.data);
      } catch (error) {
        console.error("Error checking saved post:", error);
      }
    };

    if (postId) {
      fetchPostDetails();
      checkSavedStatus();
    }

    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [postId, getToken, isSignedIn]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) {
      // If not signed in, show auth modal
      if (!isSignedIn) {
        setShowAuthModal(true);
        return;
      }
      return;
    }

    try {
      if (!(await getToken())) {
        setShowAuthModal(true);
        return;
      }

      const newCommentObj: Comment = {
        _id: `temp-${Date.now()}`,
        user: {
          _id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.emailAddresses[0].emailAddress,
          picture:
            user.imageUrl ||
            "/assets/adda/profilePictures/pexels-stefanstefancik-91227.jpg",
        },
        content: newComment,
        createdAt: new Date().toISOString(),
      };

      setPost((prevPost) => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          comments: [...prevPost.comments, newCommentObj],
        };
      });
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_PROD_URL}/comments`,
        {
          postId: postId,
          content: newComment,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      toast.success("Comment added successfully");
      triggerReward(RewardEventType.COMMENT_POST, postId);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleSavePost = async () => {
    // If not signed in, show auth modal
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (!(await getToken())) {
        setShowAuthModal(true);
        return;
      }
      const newSavedState = !isSavedPost;
      setIsSavedPost(newSavedState);
      const token = await getToken();
      const endpoint = newSavedState
        ? `${import.meta.env.VITE_PROD_URL}/feeds/posts/${postId}/save`
        : `${import.meta.env.VITE_PROD_URL}/feeds/posts/${postId}/unsave`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      toast.success(
        newSavedState ? "Post saved successfully" : "Post unsaved successfully"
      );
    } catch (err) {
      console.error("Error toggling save status:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <h2 className="mb-4 text-2xl font-bold text-red-500">Error</h2>
        <p className="mb-6 text-gray-700">{error || "Post not found"}</p>
        <Link
          to="/adda"
          className="px-6 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          Go Back to Feed
        </Link>
      </div>
    );
  }

  const displayedComments = showAllComments
    ? post.comments
    : post.comments.slice(0, 3);

  return (
    <>
      {showAuthModal && !isSignedIn && (
        <AuthModal
          onClose={() => {
            if (isSignedIn) {
              setShowAuthModal(false);
            }
          }}
        />
      )}

      <div className="flex flex-col w-full gap-4 sm:gap-6">
        {/* Post details */}
        <div className="p-5 bg-white border border-orange-200 rounded-lg shadow-sm">
          {/* User information */}
          <div className="flex items-start gap-4 mb-4">
            <button
              onClick={() => navigate("/adda")}
              className="p-2 text-orange-600 transition-colors bg-orange-100 rounded-full hover:bg-orange-200"
            >
              <BiArrowBack className="w-5 h-5" />
            </button>
            <div className="overflow-hidden rounded-full w-14 h-14">
              <img
                src={post.user.picture}
                alt={`${post.user.name}'s profile`}
                className="object-cover w-full h-full rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">{post.user.name}</h3>
              <p className="text-sm text-gray-600">{post.user.role}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span>{formatDate(post.createdAt)}</span>
                {post.location && (
                  <span className="flex items-center ml-2">
                    <FaMapMarkerAlt className="mr-1 text-red-400" />
                    {post.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post title */}
          {post.title && (
            <h1 className="mb-3 text-xl font-bold text-gray-800 capitalize">
              {post.title}
            </h1>
          )}

          {/* Post content */}
          {post.content && <p className="mb-4 text-gray-700">{post.content}</p>}

          {/* Media content */}
          {post.media && post.media.length > 0 && (
            <div className="border border-orange-200 rounded-t-lg ">
              {post.media.map((item, index) => (
                <div key={index} className="mb-2 overflow-hidden rounded-lg">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.caption || `Media ${index + 1}`}
                      className="w-full object-cover max-h-[500px]"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="w-full max-h-[500px]"
                    />
                  )}
                  {item.caption && (
                    <p className="mt-1 text-sm italic text-gray-600">
                      {item.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {post.article && (
            <div className="p-4 mb-4 border border-t-0 border-orange-200 rounded-b-lg bg-orange-50">
              <p className="font-medium text-gray-700">{post.article.body}</p>
              <div className="flex justify-start mt-8">
                <p className="text-sm italic text-orange-500">
                  {" "}
                  {post.user.name}
                </p>
              </div>
            </div>
          )}

          {/* Event content */}
          {post.postType === "event" && post.event && (
            <div className="p-4 mb-4 border border-orange-200 rounded-lg bg-orange-50">
              {post.media && post.media.length > 0 && (
                <img
                  src={post.media[0].url}
                  alt="Event cover"
                  className="w-full mb-4 rounded-lg max-h-[300px] object-cover"
                />
              )}
              <div className="flex flex-col gap-2">
                <p className="font-semibold">
                  <span className="mr-2">📅</span>
                  {formatDate(post.event.startDate)}
                  {post.event.endDate && ` - ${formatDate(post.event.endDate)}`}
                </p>
                <p className="font-semibold">
                  <span className="mr-2">📍</span>
                  {post.event.venue}
                </p>
                <p className="mt-2">{post.event.description}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs text-orange-600 bg-orange-100 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Interaction buttons */}
          <div className="flex items-center justify-between w-full pt-4 border-t border-organge-200">
            <div className="flex items-center gap-4">
              {/* Like button */}
              <div
                onClick={!isSignedIn ? () => setShowAuthModal(true) : undefined}
              >
                <Reactions
                  type="post"
                  id={post._id}
                  likeCount={post.likes.length}
                />
              </div>

              {/* Comment count */}
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: "0px 4px 10px rgba(255,110,0,0.30)",
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex items-center justify-center w-8 p-2 border border-orange-400 rounded-full sm:w-12 sm:h-12"
                >
                  <BiComment className="w-4 text-orange-500 sm:w-6 sm:h-6" />
                </motion.button>
                <span className="text-[#605F5F] text-sm sm:text-base figtree">
                  {post.comments.length}
                </span>
              </div>

              {/* Share button */}
              <div
                onClick={!isSignedIn ? () => setShowAuthModal(true) : undefined}
              >
                <Share
                  type="post"
                  postDetails={{
                    ...post,
                    shares: post.shares,
                    saves: 0,
                    user: {
                      ...post.user,
                      email: "",
                      picture: "",
                    },
                  }}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="flex items-center justify-center p-2 rounded-full sm:w-10 sm:h-10"
                onClick={handleSavePost}
              >
                {isSavedPost ? (
                  <FaBookmark className="w-5 text-orange-500 sm:w-6 sm:h-6" />
                ) : (
                  <FaRegBookmark className="w-5 text-orange-500 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="p-5 bg-white border border-orange-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-xl font-bold">
            Comments ({post.comments.length})
          </h3>

          {/* Comment form */}
          <div className="flex items-start gap-3 pb-6 mb-6 border-b border-gray-200">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={
                  user?.imageUrl ||
                  "/assets/adda/profilePictures/pexels-stefanstefancik-91227.jpg"
                }
                alt="Your profile"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  isSignedIn ? "Add a comment..." : "Sign in to comment..."
                }
                className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                disabled={!isSignedIn}
              ></textarea>
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || !isSignedIn}
                className="float-right px-4 py-2 mt-2 text-white bg-orange-500 rounded-lg disabled:opacity-50 hover:bg-orange-600"
              >
                {isSignedIn ? "Post Comment" : "Sign In to Comment"}
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {post.comments.length > 0 ? (
              <>
                {displayedComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="flex items-start gap-3 p-4 rounded-lg bg-orange-50"
                  >
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        src={comment.user.picture}
                        alt={`${comment.user.name}'s profile`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{comment.user.name}</h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {post.comments.length > 3 && (
                  <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="w-full py-2 font-medium text-center text-yellow-600 hover:text-yellow-700"
                  >
                    {showAllComments
                      ? "Show Less Comments"
                      : `Show All ${post.comments.length} Comments`}
                  </button>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetailsPage;
