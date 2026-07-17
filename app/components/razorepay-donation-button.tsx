import React, { useEffect, useRef } from "react";

function RazorepayDonationButton() {
  // <form>
  //       <script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_QHLzNOVNvBBaTP" async> </script>
  //     </form>

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_QHLzNOVNvBBaTP");
    script.async = true;

    if (formRef.current) {
      formRef.current.innerHTML = ""; // clear existing children
      formRef.current.appendChild(script);
    }
  }, []);

  return <form ref={formRef}></form>;
}

export default RazorepayDonationButton;
