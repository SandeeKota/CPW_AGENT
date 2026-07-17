const PrivacyPolicy = () => {
  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto ">
      <div className="max-w-[840px] mx-auto w-full flex flex-col font-signika py-14">
        <h1 className="sm:text-[40px] text-3xl  font-bold text-black mb-6 ">
          Privacy Policy
        </h1>
        {PrivacyPolicyData.map((item: ContentInterface, index: number) => {
          return (
            <div key={index} className="flex flex-col">
              {item.type === "heading" && (
                <h2
                  className="sm:text-2xl text-xl font-bold sm:py-6 py-5 leading-10 text-black"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.type === "description" && (
                <p
                  className="sm:text-xl text-lg  sm:py-6 py-5 text-black/95 leading-8"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.type === "list" && (
                <div className="sm:text-xl text-lg sm:py-3.5 py-2.5 text-black/95 w-full flex flex-row gap-6 overflow-hidden">
                  <div className="w-2 h-2 mt-3 rounded-full bg-black"></div>
                  <p
                    className="flex-1 leading-8 "
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrivacyPolicy;

interface ContentInterface {
  type: "heading" | "description" | "list";
  content: string;
}

const PrivacyPolicyData: ContentInterface[] = [
  {
    type: "description",
    content:
      "Your privacy is of great importance to us and our website has been developed with that in mind. We recognize your right to know what information is being collected about you and how that information will be used, as well as our obligations to protect what we do collect.",
  },
  {
    type: "description",
    content:
      "Our privacy policy tells you about our information practices when you visit us online to browse, obtain information, or request services, such as making a pledge. The policy includes, among other things, what data is collected and why; ways for you to access information or submit inquiries; security features; and website analysis tools used.",
  },
  {
    type: "description",
    content:
      "Community Pure Water Foundation Inc respects your privacy while you are an online visitor to our website. At our site, we do not collect personal information unless you provide it to us voluntarily and knowingly.",
  },
  {
    type: "heading",
    content: "We acknowledge your right:",
  },
  {
    type: "list",
    content: "To know what purpose the information gathered might be used.",
  },
  {
    type: "list",
    content:
      "To know with what other entities the information gathered might be shared.",
  },
  {
    type: "list",
    content: "To a guarantee of reasonable security of any data collected.",
  },
  {
    type: "list",
    content: "To a guarantee of data accuracy and fidelity.",
  },
  {
    type: "list",
    content: "To access to data gathered to ensure accuracy and fidelity.",
  },
  {
    type: "list",
    content:
      "To choose not to be included in any use of the data unrelated to the stated purpose for which the data was collected.",
  },
  {
    type: "list",
    content:
      "To choose not to be included in any transfer of data to any third party for any use unrelated to the stated purpose for which the data was collected.",
  },
  {
    type: "heading",
    content: "Information We Collect About You",
  },
  {
    type: "description",
    content:
      "Personal Information. We may collect the following types of personal information:",
  },
  {
    type: "list",
    content:
      "Information provided by you when accessing services through the site. For example, you may be required to submit personal information such as your name, address, telephone number, and e-mail address in order to access certain services on the site.",
  },
  {
    type: "list",
    content:
      "Credit or debit card, or bank account information collected from you when requesting a service (such as an online pledge).",
  },
  {
    type: "list",
    content:
      "Information you provide us through customer service correspondence and general feedback.",
  },
  {
    type: "description",
    content:
      "Non-personal Information. When you visit the site, we may collect non-personal information, such as a catalog of the Site pages you visit. Non-personal information is generally collected through the Site from the following sources: server log files, cookies, and other technologies and information that you voluntarily provide.",
  },
  {
    type: "description",
    content: `Cookies and similar technologies. We and our service providers may use "cookies" or similar technologies on our Site. A cookie is a piece of data stored on your computer that ties your computer to a web server for recordkeeping purposes. Most browsers allow you to control the use of cookies on your computer. If you choose to limit the use of cookies on your computer, we may not be able to provide you the services you request on our Site. Cookies, when used, are not persisted.`,
  },
  {
    type: "description",
    content: `Server log files. Your Internet Protocol (IP) address is logged in our server log files along with other information about your activity on our Site. We use your IP address for purposes of calculating Site usage levels, helping diagnose problems with our servers, and generally administering the Site. Collecting IP addresses is a standard practice on the Internet.`,
  },
  {
    type: "heading",
    content: `How We Use Information We Collect`,
  },
  {
    type: "description",
    content: `Personal Information: We may use personal information we collect in the following ways:`,
  },
  {
    type: "list",
    content: `Fulfillment of requests. We may use personal information collected from you to provide you with the services you requested.`,
  },
  {
    type: "list",
    content: `Administrative communications. From time to time we may use personal information you provide us to contact you about the services you have ordered or important changes to the site. Because this information may be important to your use of the site, the fulfillment of your request, or required by Federal regulation, you may not opt-out of receiving such communications.`,
  },
  {
    type: "list",
    content: `Business Partners. We may partner with other companies to fulfill the products or services that you order. We may disclose personal information to third parties who provide services to us in connection with fulfilling your requests. For example, if you make a donation by credit card, certain personal information may be supplied to our bank partner for purposes of processing a credit card transaction. When using the online giving tools available on our Site, personal information may be disclosed to organizations maintaining the accounting of contributions and to your payroll office. Additional disclosure may be made to other parties as required by law. Community Pure Water Foundation Inc does not otherwise sell, rent, trade, or provide your personal information to outside parties.`,
  },
  {
    type: "description",
    content: `Non-personal Information: Because non-personal information does not personally identify you, we may use such information for any purpose.`,
  },
  {
    type: "heading",
    content: `How We Protect Your Information`,
  },
  {
    type: "description",
    content: `We take appropriate security measures to protect against unauthorized access to data. These measures include internal and external reviews of our data collection, storage, and processing practices and security measures, including physical security measures to guard against unauthorized access to systems where we store personal data.`,
  },
  {
    type: "description",
    content: `We restrict access to personal information to employees and contractors who need to know that information in order to operate, develop, or improve our services. These individuals are bound by confidentiality obligations and may be subject to discipline, including termination and criminal prosecution, if they fail to meet these obligations.`,
  },
  {
    type: "description",
    content: `When we provide business partners with your information in order to fulfill your request, we require that these parties agree to process such information on our instructions and with appropriate confidentiality and security measures.`,
  },
  {
    type: "description",
    content: `When visitors to our Site provide personal information, the data is encrypted and protected using Secure Socket Layer (SSL) protocol.`,
  },
  {
    type: "heading",
    content: `Changes to this Privacy Policy`,
  },
  {
    type: "description",
    content: `Please note that this Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent. We will post any Privacy Policy changes on this page and, if the changes are significant, we will provide a more prominent notice.`,
  },
  {
    type: "heading",
    content: `Inquiries`,
  },
  {
    type: "description",
    content: `Please direct any questions or concerns regarding this privacy policy or Community Pure Water Foundation Inc’s treatment of personal information by contacting us or you may write to us at Community Pure Water Foundation Inc, PO Box 183, 1130 W Chestnut Street, Union NJ 07083. We will investigate and respond to your inquiry. Your inquiry will be treated confidentially, and will not be shared with external parties, except service providers and the any boards that govern and oversee Community Pure Water Foundation Inc.`,
  },
];
