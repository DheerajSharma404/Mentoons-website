import BookingCalender from "@/components/session/calender";
import { Hiring } from "@/types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import BookedSession from "./bookedSession";
import SessionBookingForm from "@/components/forms/sessionBooking";
import { fetchSessions, SessionDetails } from "@/redux/sessionSlice";
import { useAuth, useUser } from "@clerk/clerk-react";

import { HIRING } from "@/constant/constants";
import WeAreHiring from "@/components/assessment/weAreHiring";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AppDispatch, RootState } from "@/redux/store";
import SelectedDateBookings from "@/components/session/selectedBookings";
import PostPone from "@/components/common/modal/postPone";

const SessionBooking: React.FC = () => {
  const [bookedCalls, setBookedCalls] = useState<SessionDetails[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState<
    SessionDetails[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingToPostpone, setBookingToPostpone] =
    useState<SessionDetails | null>(null);
  const [hiring, setHiring] = useState<Hiring[] | []>([]);

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { error, loading, sessions } = useSelector(
    (root: RootState) => root.session
  );

  const { user } = useUser();

  useEffect(() => {
    setHiring(HIRING);

    const fetchData = async () => {
      const token = await getToken();
      if (token) {
        dispatch(fetchSessions(token));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setBookedCalls(sessions);
      setBookedDates(sessions.map((session) => session.date));
    }
  }, [sessions]);

  const { getToken } = useAuth();

  const handlePostponeBooking = (data: SessionDetails): void => {
    setBookingToPostpone(data);
    setIsModalOpen(true);
  };

  // const confirmCancelBooking = () => {
  //   if (bookingToCancel) {
  //     const updatedBookings = bookedCalls.filter(
  //       (booking) => booking._id !== bookingToCancel
  //     );
  //     setBookedCalls(updatedBookings);
  //     setBookedDates(updatedBookings.map((booking) => booking.date));
  //     toast.success("Booking canceled successfully");
  //   }
  //   setIsModalOpen(false);
  //   setBookingToCancel(null);
  // };

  const showErrorModal = (message: string) => {
    setErrorMessage(message);
    setErrorModalOpen(true);
  };

  const handleSubmit = async (values: {
    name: string;
    email: string;
    phone: string;
    selectedDate: string;
    state: string;
    selectedTime: string;
    description?: string;
  }) => {
    try {
      const {
        name,
        email,
        phone,
        selectedDate,
        selectedTime,
        description,
        state,
      } = values;

      const token = await getToken();
      if (!token) {
        showErrorModal("Please login to continue");
        return;
      }

      const paymentData = {
        orderId: `#ASM-${Date.now()}`,
        totalAmount: 1, //change to 499
        amount: 1,
        currency: "INR",
        productInfo: "Mentoons One-On-One Session",
        customerName: name,
        email: email,
        phone: phone,
        status: "PENDING",
        user: user?.id,
        order_type: "consultancy_purchase",
        items: [
          {
            productName: "One-On-One Session",
            price: 1,
            quantity: 1,
            date: selectedDate,
            time: selectedTime,
            description: description || "No additional details provided",
            state,
          },
        ],
        orderStatus: "pending",
        paymentDetails: {
          paymentMethod: "credit_card",
          paymentStatus: "initiated",
        },
        bookingDetails: {
          name,
          email,
          phone,
          date: selectedDate,
          time: selectedTime,
          description: description || "No additional details provided",
          state,
        },
        sameAsShipping: true,
      };

      const response = await axios.post(
        "https://mentoons-backend-zlx3.onrender.com/api/v1/payment/initiate",
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("response data :", response.data);

      if (!response.data) {
        showErrorModal(response.data.message || "Failed to initiate payment");
        return;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = response.data;

      const form = tempDiv.querySelector("form");
      if (form) {
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error("Payment form not found in response");
      }
    } catch (error) {
      console.error("Payment error:", error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          error.response.data.message || "Failed to process payment";

        if (
          error.response.status === 400 &&
          error.response.data.message?.includes(
            "psychologists are fully booked"
          )
        ) {
          showErrorModal(
            "All psychologists are fully booked at the selected date and time. Please choose another slot."
          );
        } else {
          showErrorModal(errorMessage);
        }
      } else {
        showErrorModal(
          error instanceof Error
            ? error.message
            : "Failed to process payment. Please try again later."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:hidden sticky top-0 z-20 bg-white p-4 shadow-md">
        <button
          onClick={() =>
            document
              .getElementById("bookedSessions")
              ?.classList.toggle("hidden")
          }
          className="flex items-center justify-between w-full p-2 bg-orange-50 rounded-lg"
        >
          <span className="font-semibold text-orange-500">
            View Booked Sessions
          </span>
          <span>↓</span>
        </button>

        <div id="bookedSessions" className="hidden mt-4">
          <BookedSession
            error={error}
            loading={loading}
            bookedCalls={bookedCalls}
            postponeBooking={handlePostponeBooking}
            selectedDateBookings={selectedDateBookings}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="hidden lg:block lg:w-1/4 sticky top-20 h-screen">
          <BookedSession
            error={error}
            loading={loading}
            bookedCalls={bookedCalls}
            postponeBooking={handlePostponeBooking}
            selectedDateBookings={selectedDateBookings}
          />
        </div>

        <div className="flex flex-col md:flex-row w-full lg:w-3/4">
          <div className="w-full md:w-2/3 p-4 md:p-8 space-y-8">
            <div className="bg-white shadow-lg rounded-lg p-4 md:p-8 max-w-xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-extrabold text-center text-orange-600 mb-4 font-akshar">
                Schedule Your Personalized One-on-One Call
              </h1>

              <p className="text-gray-700 text-base md:text-lg text-center mb-6 font-inter leading-relaxed">
                Curious about your assessment results? Get a personalized,
                in-depth analysis and expert guidance tailored just for you.
                Book a one-on-one session now!
              </p>

              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-xl md:text-2xl">
                <span>₹</span>
                <span>Rs 499/hr</span>
              </div>

              <SessionBookingForm handleSubmit={handleSubmit} />
            </div>

            <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-blue-600">
                Booked Dates Calendar
              </h2>
              <BookingCalender
                bookedCalls={bookedCalls}
                bookedDates={bookedDates}
                setSelectedDateBookings={setSelectedDateBookings}
                setSelectedDate={setSelectedDate}
              />
            </div>
          </div>
          <div className="w-full md:w-1/3 p-3 flex flex-col-reverse md:flex-col justify-start items-center gap-6 md:gap-10">
            <WeAreHiring hiring={hiring} />
            {selectedDate && (
              <div className="w-full md:sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <SelectedDateBookings
                  date={selectedDate}
                  bookings={selectedDateBookings}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PostPone
        isModalOpen={isModalOpen}
        setIsPostponeModal={setIsModalOpen}
        postponeBooking={bookingToPostpone}
      />

      <AnimatePresence>
        {errorModalOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setErrorModalOpen(false)}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4"
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 150,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center mb-5">
                <motion.div
                  className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center"
                  initial={{ rotate: 0, scale: 0.5 }}
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.8,
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    type: "spring",
                  }}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-amber-600"
                    viewBox="0 0 24 24"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      stroke="currentColor"
                      fill="none"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </motion.svg>
                </motion.div>
              </div>
              <motion.h2
                className="text-2xl font-bold mb-3 text-center text-amber-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Oops!
              </motion.h2>
              <motion.p
                className="text-gray-700 text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {errorMessage}
              </motion.p>
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => setErrorModalOpen(false)}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <span>Dismiss</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionBooking;
