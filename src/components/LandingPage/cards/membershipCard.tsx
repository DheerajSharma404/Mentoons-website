import PaymentProcessFlow from "@/components/common/modal/paymentModal";
import { Membership } from "@/types/home/membership";
import { ORDER_TYPE } from "@/utils/enum";
import { errorToast } from "@/utils/toastResposnse";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { FaCheck, FaStar, FaTimes } from "react-icons/fa";
import LoginModal from "@/components/common/modal/loginModal";

const MembershipCard = ({ membership }: { membership: Membership }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  const { getToken, userId } = useAuth();
  const { user } = useUser();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [gatewayTimeout, setGatewayTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const minLoadingDuration = 1500;

  const [loadingDuration, setLoadingDuration] = useState(minLoadingDuration);

  const startGatewayTimeoutCheck = () => {
    if (gatewayTimeout) {
      clearTimeout(gatewayTimeout);
    }

    const timeoutId = setTimeout(() => {
      setPaymentError(
        "Payment gateway is taking longer than expected. Please try again."
      );
    }, 15000);

    setGatewayTimeout(timeoutId);
  };

  const clearGatewayTimeoutCheck = () => {
    if (gatewayTimeout) {
      clearTimeout(gatewayTimeout);
      setGatewayTimeout(null);
    }
  };

  console.log(user?.fullName);

  const handleMembership = async (membership: Membership) => {
    console.log("Membership handling initiated");
    try {
      setPaymentError(null);

      const token = await getToken();
      if (!token) {
        setLoginModalOpen(true);
        return;
      }
      setIsProcessingPayment(true);

      startGatewayTimeoutCheck();

      const requestStartTime = Date.now();

      const subscriptionData = {
        orderId: `#ORD-${Date.now()}`,
        totalAmount: 1,
        amount: 1,
        currency: "INR",
        productInfo: `Mentoons ${membership.type} Membership`,
        customerName:
          user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.fullName || "Unknown",
        email: user?.emailAddresses[0].emailAddress,
        phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
        status: "PENDING",
        user: userId,
        order_type: ORDER_TYPE.SUBSCRIPTION_PURCHASE,
        items: [
          {
            name: membership.type,
            price: 1, // change t0 499
            quantity: 1,
          },
        ],
        orderStatus: "pending",
        paymentDetails: {
          paymentMethod: "credit_card",
          paymentStatus: "initiated",
        },
        sameAsShipping: true,
      };

      console.log("subscriptionData", subscriptionData);

      try {
        const response = await axios.post(
          "https://mentoons-backend-zlx3.onrender.com/api/v1/payment/initiate?type=subscription",
          subscriptionData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const requestDuration = Date.now() - requestStartTime;

        const calculatedDuration = Math.max(
          minLoadingDuration,
          requestDuration * 1.5
        );
        setLoadingDuration(calculatedDuration);

        clearGatewayTimeoutCheck();

        console.log("response", response);
        console.log("response.data", response.data);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = response.data;

        const form = tempDiv.querySelector("form");
        if (form) {
          document.body.appendChild(form);
          form.submit();
        } else {
          setPaymentError(
            "Unable to initialize payment gateway. Please try again."
          );
        }
      } catch (error) {
        const requestDuration = Date.now() - requestStartTime;
        const calculatedDuration = Math.max(
          minLoadingDuration,
          requestDuration * 1.2
        );
        setLoadingDuration(calculatedDuration);

        clearGatewayTimeoutCheck();
        if (axios.isAxiosError(error) && error.response) {
          setPaymentError(
            `Gateway error: ${error.response.status}. Please try again.`
          );
        } else {
          setPaymentError(
            "Failed to connect to payment gateway. Please try again."
          );
        }
      }
    } catch (error: unknown) {
      clearGatewayTimeoutCheck();

      if (error instanceof Error) {
        setPaymentError(error.message);
      } else {
        setPaymentError(
          "Failed to process membership payment. Please try again later."
        );
      }

      console.error("Membership payment error:", error);
      errorToast(
        error instanceof Error
          ? error.message
          : "Failed to process membership payment. Please try again later."
      );
    }
  };

  const handlePaymentRetry = () => {
    setPaymentError(null);
    handleMembership(membership);
  };

  const handlePaymentCancel = () => {
    clearGatewayTimeoutCheck();

    setIsProcessingPayment(false);
    setPaymentError(null);
  };

  return (
    <>
      <motion.div
        ref={sectionRef}
        id={`membership-${membership.type}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="border-transparent border shadow-xl rounded-lg relative bg-yellow-200 w-full max-w-md p-4 sm:p-5 font-akshar"
      >
        {membership.type === "Platinum" && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute -top-5 left-1/3 -translate-x-1/2 bg-gradient-to-r from-blue-400 to-blue-500 px-3 py-1.5 rounded-md shadow-lg border border-blue-800 z-20"
          >
            <h1 className="text-xs font-medium flex items-center gap-2 text-white">
              Recommended Plan <FaStar className="text-yellow-400" />
            </h1>
          </motion.div>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center w-full bg-gray-100 p-3 rounded-lg">
            <div>
              <h2
                className={`text-lg font-semibold ${
                  membership.type === "Platinum"
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 text-transparent bg-clip-text"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text"
                }`}
              >
                Mentoons {membership.type}
              </h2>

              <strong className="text-lg md:text-xl text-gray-800">
                ₹{membership.price}
                <span className="text-sm text-gray-500"> / annum</span>
              </strong>
              <p className="text-xs md:text-sm font-medium text-green-500">
                (~₹{(membership.price / 12).toFixed(0)} per month)
              </p>
            </div>
            <img
              src={membership.character}
              alt={membership.type}
              className="w-10 sm:w-12 object-contain"
            />
          </div>

          <ul className="w-full">
            {membership.benefits.map((data, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`flex justify-between items-center gap-2 p-2 rounded-md text-xs md:text-sm transition-all
                ${
                  membership.type === "Platinum"
                    ? data.important
                      ? "bg-gradient-to-l from-purple-500 to-indigo-600 text-white font-bold shadow-lg border-l-4 border-purple-700"
                      : "bg-indigo-50 border-l-4 border-indigo-500 font-semibold"
                    : data.important
                    ? "bg-yellow-200 text-black font-medium shadow border-l-4 border-yellow-500"
                    : "bg-gray-100 border-l-4 border-gray-300 text-gray-600"
                }`}
              >
                <span>{data.feature}</span>
                <div className="flex items-center gap-2">
                  <span>{data.details}</span>
                  {data.details === "Not available" ? (
                    <FaTimes className="text-red-500" />
                  ) : (
                    <FaCheck className="text-green-500" />
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
          <div className="flex justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-1.5 text-white text-sm rounded-md transition-all duration-300 shadow-md 
            ${
              membership.type === "Platinum"
                ? "bg-orange-500 hover:from-orange-300 hover:to-orange-800"
                : "bg-orange-500 hover:bg-orange-900"
            }`}
              onClick={() => handleMembership(membership)}
            >
              Buy Now
            </motion.button>
          </div>
        </div>
      </motion.div>
      <PaymentProcessFlow
        isActive={isProcessingPayment}
        onComplete={() => {
          clearGatewayTimeoutCheck();
          setIsProcessingPayment(false);
        }}
        error={paymentError}
        onRetry={handlePaymentRetry}
        onCancel={handlePaymentCancel}
        loadingDuration={loadingDuration}
      />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
};

export default MembershipCard;
