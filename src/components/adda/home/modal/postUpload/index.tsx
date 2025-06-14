import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Field, Form, Formik, FormikProps } from "formik";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Edit, FileText, Image, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import ArticleForm from "./components/ArticleForm";
import EventForm from "./components/EventForm";
import PreviewContent from "./components/PreviewContent";
import TabNavigation from "./components/TabNavigation";
import TextPostForm from "./components/TextPostForm";
import UploadContent from "./components/UploadContent";
import { getInitialValues, getValidationSchema } from "./formConfig";
import { FormValues, PostUploadProps } from "./types";

const PostUpload = ({
  isOpen,
  onClose,
  postType,
  onPostCreated,
}: PostUploadProps) => {
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setActiveTab(1);
    setMediaPreview([]);
  }, [postType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose(false);
        formikRef.current?.resetForm();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Define handleTabChange function to fix the error
  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const uploadMediaFile = async (file: File) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_PROD_URL}/upload/file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.fileDetails.url;
    } catch (error) {
      console.error("Failed to upload media:", error);
      toast.error("Failed to upload media file");
      return null;
    }
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: unknown) => void,
    index: number = 0
  ) => {
    const file = e.target.files?.[0];
    console.log("File being uploaded:", file);

    if (file) {
      console.log("File found");
      const values = formikRef.current?.values;
      console.log("Current form values:", values);
      if (!values) return;

      // Show preview immediately
      const newPreviews = [...mediaPreview];
      newPreviews[index] = URL.createObjectURL(file);
      setMediaPreview(newPreviews);

      // Determine file type correctly
      const isImage = file.type.startsWith("image/");
      const fileType = isImage ? "image" : "video";
      console.log(`Detected file type: ${fileType} for file: ${file.name}`);

      // Set basic file info first and store the file for later upload
      const newMedia = [...values.media];
      newMedia[index] = {
        ...newMedia[index],
        file: file,
        type: fileType,
      };
      setFieldValue("media", newMedia);
    }
  };

  const addMediaField = (
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const values = formikRef.current?.values;
    if (!values) return;
    const newMedia = [...values.media, { file: null, type: "image" }];
    setFieldValue("media", newMedia);
  };

  const removeMediaField = (
    index: number,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const values = formikRef.current?.values;
    if (!values) return;
    const newMedia = [...values.media];
    newMedia.splice(index, 1);
    setFieldValue("media", newMedia);

    const newPreviews = [...mediaPreview];
    newPreviews.splice(index, 1);
    setMediaPreview(newPreviews);
  };

  const uploadAllMedia = async (values: FormValues) => {
    if (!values.media || values.media.length === 0) {
      return values;
    }

    setIsUploading(true);
    toast.info("Uploading media files...");

    try {
      const updatedValues = { ...values };
      const updatedMedia = [...updatedValues.media];

      const uploadPromises = updatedMedia.map(async (media, index) => {
        if (media.file && !media.url) {
          const url = await uploadMediaFile(media.file);
          if (url) {
            updatedMedia[index] = {
              ...media,
              url: url,
            };
          }
          return url;
        }
        return media.url;
      });

      await Promise.all(uploadPromises);
      updatedValues.media = updatedMedia;

      return updatedValues;
    } catch (error) {
      console.error("Failed to upload media files:", error);
      toast.error("Error uploading media files");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    console.log("🚨 ARTICLE SUBMISSION FUNCTION TRIGGERED 🚨");
    console.log("Post type:", postType);

    if (isSubmitting) {
      console.log("Already submitting, skipping duplicate request");
      return;
    }

    try {
      setIsSubmitting(true);

      const valuesWithUploadedMedia = await uploadAllMedia(values);

      toast.info("Processing your post...");

      const token = await getToken();
      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      console.log("=== ARTICLE POST SUBMISSION DEBUG INFO ===");
      console.log("Form values:", valuesWithUploadedMedia);
      console.log("Post type:", postType);
      console.log("Media objects:", valuesWithUploadedMedia.media);

      const postData: {
        title: string;
        content: string;
        postType: string;
        location: string;
        tags: string[];
        visibility: string;
        media?: Array<{
          type: string;
          caption: string;
          url: string;
        }>;
        article?: {
          body: string;
          coverImage: string;
        };
        event?: {
          startDate: string | undefined;
          endDate: string | undefined;
          venue: string;
          description: string;
        };
      } = {
        title: valuesWithUploadedMedia.title || "",
        content: valuesWithUploadedMedia.content || "",
        postType: postType,
        location: valuesWithUploadedMedia.location || "",
        tags: valuesWithUploadedMedia.tags || [],
        visibility: valuesWithUploadedMedia.visibility || "public",
      };

      if (postType === "article") {
        console.log("Processing ARTICLE post type");
        postData.article = {
          body: valuesWithUploadedMedia.articleBody || "",
          coverImage: valuesWithUploadedMedia.media[0]?.url || "",
        };

        if (
          valuesWithUploadedMedia.media &&
          valuesWithUploadedMedia.media.length > 0 &&
          valuesWithUploadedMedia.media[0]?.url
        ) {
          postData.media = [
            {
              type: "image",
              caption: valuesWithUploadedMedia.media[0]?.caption || "",
              url: valuesWithUploadedMedia.media[0]?.url || "",
            },
          ];
        } else {
          postData.media = [];
        }
      } else if (postType === "event") {
        postData.event = {
          startDate: valuesWithUploadedMedia.eventStartDate,
          endDate:
            valuesWithUploadedMedia.eventEndDate ||
            valuesWithUploadedMedia.eventStartDate,
          venue: valuesWithUploadedMedia.venue || "",
          description: valuesWithUploadedMedia.description || "",
        };

        postData.media = valuesWithUploadedMedia.media
          .filter((m) => m.file && m.url)
          .map((m) => ({
            type: m.type,
            caption: m.caption || "",
            url: m.url || "",
          }));
      } else {
        console.log("media =====> ", valuesWithUploadedMedia.media);
        postData.media = valuesWithUploadedMedia.media
          .filter((m) => m.file && m.url)
          .map((m) => ({
            type: m.type,
            caption: m.caption || "",
            url: m.url || "",
          }));
      }

      console.log(
        "Final post data to be submitted:",
        JSON.stringify(postData, null, 2)
      );

      const apiUrl = `${import.meta.env.VITE_PROD_URL}/posts`;

      console.log("Sending request to:", apiUrl);
      console.log("With authorization token:", token.substring(0, 10) + "...");

      const response = await axios.post(apiUrl, postData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Post creation response:", response);

      if (response.data.success) {
        toast.success("Post created successfully!");
        onClose(false);
        formikRef.current?.resetForm();
        setMediaPreview([]);
        setActiveTab(1);

        if (onPostCreated) {
          console.log("Post creation response data:", response.data);

          // Check if the post data exists in the response
          if (response.data.data && response.data.data.post) {
            console.log(
              "Calling onPostCreated with post:",
              response.data.data.post
            );
            onPostCreated(response.data.data.post);
          } else if (response.data.data) {
            // If post is not in data.post, try using data directly
            console.log(
              "Post not found in data.post, using data directly:",
              response.data.data
            );
            onPostCreated(response.data.data);
          } else {
            // Create a fallback post if no valid data is found
            console.warn(
              "No valid post data found in response, creating fallback post"
            );
            const fallbackPost = {
              _id: `temp-${Date.now()}`,
              postType: postType,
              title: valuesWithUploadedMedia.title || "",
              content: valuesWithUploadedMedia.content || "",
              user: {
                _id: "unknown",
                name: "User",
                role: "User",
                profilePicture: "",
              },
              likes: [],
              comments: [],
              shares: [],
              createdAt: new Date().toISOString(),
              visibility: valuesWithUploadedMedia.visibility || "public",
              media: postData.media,
              article: postType === "article" ? postData.article : undefined,
              event: postType === "event" ? postData.event : undefined,
            };
            console.log("Using fallback post:", fallbackPost);
            onPostCreated(fallbackPost);
          }
        }
      } else {
        toast.error("Failed to create post: " + response.data.message);
      }
    } catch (error) {
      console.error("Post creation failed:", error);
      let errorMessage = "Unknown error";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(`Failed to create post: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitArticleDirectly = async () => {
    try {
      setIsSubmitting(true);

      if (!formikRef.current) {
        toast.error("Form reference not available");
        return;
      }

      const values = formikRef.current.values;
      const valuesWithUploadedMedia = await uploadAllMedia(values);

      toast.info("Submitting your article...");

      const token = await getToken();
      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      const articleData = {
        title: valuesWithUploadedMedia.title || "",
        content: valuesWithUploadedMedia.content || "",
        postType: "article",
        location: valuesWithUploadedMedia.location || "",
        tags: valuesWithUploadedMedia.tags || [],
        visibility: valuesWithUploadedMedia.visibility || "public",
        article: {
          body: valuesWithUploadedMedia.articleBody || "",
          coverImage: valuesWithUploadedMedia.media[0]?.url || "",
        },
        media: valuesWithUploadedMedia.media[0]?.url
          ? [
              {
                type: "image",
                caption: valuesWithUploadedMedia.media[0]?.caption || "",
                url: valuesWithUploadedMedia.media[0]?.url,
              },
            ]
          : [],
      };

      const apiUrl = `${import.meta.env.VITE_PROD_URL}/posts`;

      const response = await axios.post(apiUrl, articleData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Article posted successfully!");
        onClose(false);
        formikRef.current?.resetForm();

        // Call onPostCreated with the post data
        if (onPostCreated) {
          console.log("Article creation response data:", response.data);

          // Check if the post data exists in the response
          if (response.data.data && response.data.data.post) {
            console.log(
              "Calling onPostCreated with article:",
              response.data.data.post
            );
            onPostCreated(response.data.data.post);
          } else if (response.data.data) {
            // If post is not in data.post, try using data directly
            console.log(
              "Article not found in data.post, using data directly:",
              response.data.data
            );
            onPostCreated(response.data.data);
          } else {
            // Create a fallback post if no valid data is found
            console.warn(
              "No valid article data found in response, creating fallback post"
            );
            const fallbackPost = {
              _id: `temp-${Date.now()}`,
              postType: "article",
              title: valuesWithUploadedMedia.title || "",
              content: valuesWithUploadedMedia.content || "",
              user: {
                _id: "unknown",
                name: "User",
                role: "User",
                profilePicture: "",
              },
              likes: [],
              comments: [],
              shares: [],
              createdAt: new Date().toISOString(),
              visibility: valuesWithUploadedMedia.visibility || "public",
              media: articleData.media,
              article: articleData.article,
            };
            console.log("Using fallback article post:", fallbackPost);
            onPostCreated(fallbackPost);
          }
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          `Submission failed: ${error.response?.data?.message || error.message}`
        );
      } else {
        toast.error("Failed to submit article. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextTab = (isValid: boolean, values: FormValues) => {
    console.log("Next button clicked", { isValid, activeTab, postType });

    if (postType === "article") {
      if (activeTab === 1 && (!values.title || !values.articleBody)) {
        toast.error("Please fill in the article title and body");
        return;
      }

      const maxTab = 3;
      if (activeTab < maxTab) {
        setActiveTab(activeTab + 1);
      }
      return;
    }

    if (postType === "text") {
      setActiveTab(3);
      return;
    }

    if (postType === "photo" || postType === "video") {
      if (activeTab === 1) {
        // For photo/video posts, we go from tab 1 straight to tab 2 (preview)
        const hasMedia = values.media.some((m) => m.file);
        if (!hasMedia) {
          toast.error(`Please upload a ${postType} first`);
          return;
        }
        setActiveTab(2);
      }
      return;
    }

    const maxTab = 3;
    if (activeTab < maxTab) {
      setActiveTab(activeTab + 1);
      if (!isValid) {
        toast.warning("Some fields may need your attention");
      }
    }
  };

  const handlePrevTab = () => {
    if (activeTab > 1) {
      setActiveTab(activeTab - 1);
    }

    if (postType === "text") {
      setActiveTab(1);
      return;
    }
  };

  const getPostTypeIcon = () => {
    switch (postType) {
      case "photo":
        return <Image className="text-blue-500" size={24} />;
      case "video":
        return <Video className="text-purple-500" size={24} />;
      case "event":
        return <Calendar className="text-green-500" size={24} />;
      case "article":
        return <FileText className="text-orange-500" size={24} />;
      case "mixed":
        return <Edit className="text-indigo-500" size={24} />;
      default:
        return <Edit className="text-gray-500" size={24} />;
    }
  };

  const handleManualSubmit = () => {
    console.log("Manual submit triggered");
    if (formikRef.current) {
      console.log("Formik instance found, submitting form");
      formikRef.current.submitForm();
    } else {
      console.error("Formik instance not found");
      toast.error("Error: Form system not initialized");
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-2 sm:p-3 md:p-5 bg-gray-800 bg-opacity-50 backdrop-blur-sm overflow-y-auto pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            isolation: "isolate",
            contain: "layout paint size",
            transformStyle: "preserve-3d",
            position: "fixed",
            zIndex: 2147483647,
          }}
        >
          <Formik
            innerRef={formikRef}
            initialValues={getInitialValues(postType)}
            validationSchema={getValidationSchema(postType, activeTab)}
            onSubmit={handleSubmit}
            validateOnMount={false}
          >
            {({ values, isValid, setFieldValue }) => (
              <motion.div
                ref={modalRef}
                className="relative flex flex-col items-center w-full max-w-lg p-6 overflow-hidden bg-white shadow-xl dark:bg-gray-800 rounded-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-2">
                    {getPostTypeIcon()}
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {`Create ${postType} Post`}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose(false)}
                    className="p-1 text-gray-600 transition bg-gray-100 rounded-full dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:bg-gray-700"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <TabNavigation
                  postType={postType}
                  activeTab={activeTab}
                  setActiveTab={handleTabChange} // Use handleTabChange
                />

                <Form className="w-full">
                  <div
                    className="flex flex-col items-center w-full py-4 mb-4"
                    style={{ minHeight: "300px" }}
                  >
                    <AnimatePresence mode="wait">
                      {activeTab === 1 && (
                        <motion.div
                          key="tab1"
                          className="w-full h-full"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {postType === "article" && <ArticleForm />}

                          {postType === "event" && <EventForm />}

                          {(postType === "photo" || postType === "video") && (
                            <div className="flex flex-col w-full gap-6">
                              <UploadContent
                                postType={postType}
                                values={values}
                                mediaPreview={mediaPreview}
                                handleMediaUpload={handleMediaUpload}
                                addMediaField={addMediaField}
                                removeMediaField={removeMediaField}
                                setFieldValue={setFieldValue}
                              />

                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full"
                              >
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Write about your {postType}
                                </label>
                                <Field
                                  as="textarea"
                                  name="content"
                                  className="w-full h-24 p-4 text-gray-900 bg-white border border-gray-300 rounded-lg resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                  placeholder={`Write about your ${postType.toLowerCase()}...`}
                                />
                              </motion.div>

                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.45 }}
                                className="w-full"
                              >
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Visibility
                                </label>
                                <Field
                                  as="select"
                                  name="visibility"
                                  className="w-full p-3 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="public">Public</option>
                                  <option value="friends">Friends Only</option>
                                  <option value="private">Private</option>
                                </Field>
                              </motion.div>
                            </div>
                          )}

                          {postType !== "event" &&
                            postType !== "article" &&
                            postType !== "photo" &&
                            postType !== "video" && (
                              <TextPostForm postType={postType} />
                            )}
                        </motion.div>
                      )}

                      {activeTab === 2 && (
                        <motion.div
                          key="tab2"
                          className="w-full h-full"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {postType === "photo" || postType === "video" ? (
                            <div className="flex flex-col items-center w-full gap-6">
                              <div className="w-full p-6 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
                                <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                  <span className="mr-2">📋</span> Preview Your{" "}
                                  {postType}
                                </h3>

                                {mediaPreview &&
                                  mediaPreview.length > 0 &&
                                  values.media[0]?.type && (
                                    <div className="flex justify-center mb-4">
                                      {values.media[0].type === "image" ? (
                                        <img
                                          src={mediaPreview[0]}
                                          alt="Preview"
                                          className="object-contain rounded-lg shadow-md max-h-64"
                                        />
                                      ) : (
                                        <video
                                          src={mediaPreview[0]}
                                          controls
                                          className="object-contain rounded-lg shadow-md max-h-64"
                                        />
                                      )}
                                    </div>
                                  )}

                                {values.content && (
                                  <div className="p-4 mb-4 bg-white rounded-md shadow-sm dark:bg-gray-700">
                                    <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                                      {values.content}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center">
                                    <span className="px-2 py-1 mr-2 text-xs text-orange-800 bg-orange-100 rounded dark:bg-orange-900 dark:text-orange-200">
                                      {postType}
                                    </span>
                                    <span className="px-2 py-1 mr-2 text-xs text-blue-800 bg-blue-100 rounded dark:bg-blue-900 dark:text-blue-200">
                                      {values.visibility || "Public"}
                                    </span>
                                  </div>
                                  <span>Ready to post</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <UploadContent
                              postType={postType}
                              values={values}
                              mediaPreview={mediaPreview}
                              handleMediaUpload={handleMediaUpload}
                              addMediaField={addMediaField}
                              removeMediaField={removeMediaField}
                              setFieldValue={setFieldValue}
                            />
                          )}
                        </motion.div>
                      )}

                      {activeTab === 3 &&
                        postType !== "photo" &&
                        postType !== "video" && (
                          <motion.div
                            key="tab3"
                            className="w-full h-full"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <PreviewContent
                              postType={postType}
                              values={values}
                              mediaPreview={mediaPreview}
                            />
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-4 mt-auto">
                    {activeTab > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrevTab}
                        className="flex items-center gap-2 px-5 py-2 text-white transition duration-200 bg-gray-500 rounded-md dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700"
                      >
                        <motion.div
                          initial={{ x: 0 }}
                          animate={{ x: [-5, 0] }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 0.6,
                          }}
                        >
                          ←
                        </motion.div>
                        Previous
                      </motion.button>
                    )}

                    {activeTab < 3 &&
                      (postType === "photo" || postType === "video" ? (
                        // For photo/video: Show "Next" on tab 1, "Submit" on tab 2
                        activeTab === 1 ? (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              handleNextTab(isValid, values);
                            }}
                            className="flex items-center gap-2 px-5 py-2 text-white transition duration-200 bg-orange-500 rounded-md dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700"
                            disabled={!values.media.some((m) => m.file)}
                          >
                            Next to Preview
                            <motion.div
                              initial={{ x: 0 }}
                              animate={{ x: [0, 5] }}
                              transition={{
                                repeat: Infinity,
                                repeatType: "reverse",
                                duration: 0.6,
                              }}
                            >
                              →
                            </motion.div>
                          </motion.button>
                        ) : (
                          <motion.button
                            type="button"
                            onClick={handleManualSubmit}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 text-white transition duration-200 bg-green-500 rounded-md dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            disabled={isSubmitting || isUploading}
                          >
                            {isUploading
                              ? "Uploading Media..."
                              : isSubmitting
                              ? "Submitting..."
                              : "Submit Post"}
                          </motion.button>
                        )
                      ) : (
                        // For other post types: Show Next button
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            handleNextTab(isValid, values);
                          }}
                          className="flex items-center gap-2 px-5 py-2 text-white transition duration-200 bg-orange-500 rounded-md dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700"
                        >
                          Next
                          <motion.div
                            initial={{ x: 0 }}
                            animate={{ x: [0, 5] }}
                            transition={{
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: 0.6,
                            }}
                          >
                            →
                          </motion.div>
                        </motion.button>
                      ))}

                    {activeTab === 3 &&
                      postType !== "photo" &&
                      postType !== "video" && (
                        <motion.button
                          type="button"
                          onClick={
                            postType === "article"
                              ? submitArticleDirectly
                              : handleManualSubmit
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 text-white transition duration-200 bg-green-500 rounded-md dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          disabled={isSubmitting || isUploading}
                        >
                          {isUploading
                            ? "Uploading Media..."
                            : isSubmitting
                            ? "Submitting..."
                            : "Submit Post"}
                        </motion.button>
                      )}
                  </div>
                </Form>
              </motion.div>
            )}
          </Formik>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PostUpload;
