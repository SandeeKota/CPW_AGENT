"use client";
import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto ">
      <div className="max-w-[840px] mx-auto w-full flex flex-col font-signika py-14">
        <h1 className="sm:text-[40px] text-3xl  font-bold text-black mb-6 ">
          Terms and Conditions
        </h1>
        {TermsAndConditionsData.map((item: ContentInterface, index: number) => {
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

export default TermsAndConditions;

interface ContentInterface {
  type: "heading" | "description" | "list";
  content: string;
}

const TermsAndConditionsData: ContentInterface[] = [
  {
    type: "heading",
    content:
      "Community Pure Water, an initiative of Community Development Foundation",
  },
  {
    type: "heading",
    content: "PERSONALLY IDENTIFYING INFORMATION",
  },
  {
    type: "description",
    content:
      "At Community Pure Water, we respect the privacy of the users of our website. This Privacy Statement is intended to lay down the practices we follow for honouring the privacy preferences of the people visiting our website www.communitypurewater.org. The Privacy Policy document also elaborates on our information collection and sharing practices. Irrespective of the mode in which we receive your personal information (whether via this website or over the phone or through any other means), we make all earnest attempts to honour your privacy. This document contains the requisite information about community pure water responsibilities, your rights, information which is collected by us and how it is used.",
  },
  {
    type: "heading",
    content:
      "BY ACCESSING AND/OR USING THIS WEBSITE, YOU agree to abide by the practices described in this Privacy Statement which may be changed from time to time.",
  },
  {
    type: "heading",
    content: "INFORMATION WE COLLECT FROM YOU",
  },
  {
    type: "description",
    content:
      "We collect information from you to extend services like processing of your donations, providing receipts and tax exemption certificates, sending regular updates about the work we do for rural communities, respond to your queries and apprising you of the new opportunities to help deprived and marginalized communities of India in a better way. Depending on the type of communication or transaction, the personal information we collect may include, but is not limited to, your name, postal address, date of birth, PIN code, telephone numbers, mobile phone numbers, your organization’s name, email addresses, credit/debit card information, bank information or billing information.",
  },
  {
    type: "heading",
    content: "WHERE AND WHEN WE COLLECT PERSONAL INFORMATION",
  },
  {
    type: "description",
    content:
      "We seek your personal information when you make a donation, request a communication from us, register for an on-ground event, pledge support to our work and campaigns and apply for working or volunteering with Community Pure Water. This information may be sought over the phone, through the website, via email or by the means of face-to-face interaction.",
  },
  {
    type: "heading",
    content: "INFORMATION SECURITY",
  },
  {
    type: "description",
    content:
      "Community Pure Water has in place the necessary security mechanisms and only designated employees have access to your personal information. All online transactions are done on a secure server. The information you provide on the donation transaction page is encrypted using SSL – Secure Sockets Layer (you will see a green padlock icon in the left-hand side of the address bar in your browser). At the same time, the website address in the address bar at the top of the browser screen starts with an ‘https’ instead of an ‘http’. Donation pages are verified by VeriSign and transactions are processed using a VeriSign merchant account.",
  },
  {
    type: "heading",
    content: "DND POLICY",
  },
  {
    type: "description",
    content:
      "I agree and consent to receive all communications at the mobile number provided, even if this mobile number is registered under DND/NCPR list under TRAI regulations. And for that purpose, I further authorise Company to share/disclose the information to any third-party service provider or any affiliates, group companies, their authorised agents or third-party service providers. Community Pure Water or their third-party service provider or any affiliates will be making calls and sending SMS/Email through a third-party platform.",
  },
  {
    type: "heading",
    content: "Community Pure Water MAY SHARE YOUR PERSONAL INFORMATION",
  },
  {
    type: "description",
    content:
      "Except in the limited circumstances elicited below,Community Pure Water will never intentionally share your email addresses, phone numbers or financial information.",
  },
  {
    type: "heading",
    content:
      "Credit/Debit Card Transactions, Electronic Fund Transfers and Payments by Cheque:",
  },
  {
    type: "description",
    content:
      "We avail the services of third parties to provide donation facilities by the means of cheque, credit/debit card payments or electronic fund transfers. While your information may be shared with these third parties, we make stringent efforts to require all third party service-providers to hold personal information in strict confidence. However, since we do not have complete control over these third parties, we cannot guarantee your privacy.",
  },
  {
    type: "heading",
    content: "Necessity:",
  },
  {
    type: "description",
    content:
      "If Community Pure Water is convinced that there has been some inappropriate activity with or on our website/webpages, communications, charitable services or personal or real property or if we have reasons to believe that any using one of the Community Pure Water website, our donors, employees, partners, vendors, etc. have been inflicted with any harm, we will disclose (we may or may not notify you) personal information as we deem appropriate.",
  },
  {
    type: "heading",
    content: "Required by Law:",
  },
  {
    type: "description",
    content:
      "If any government or legal bodies require any information from us under the purview of a law or a legal compliance, we may go ahead and disclose the same.",
  },
  {
    type: "heading",
    content: "Merger, Acquisition or other Corporate Restructure:",
  },
  {
    type: "description",
    content:
      "We also may transfer your personal information to a third-party successor in interest if we are involved in an acquisition, merger or other transfer of control or sale of assets.",
  },
  {
    type: "heading",
    content: "Requesting Communication:",
  },
  {
    type: "description",
    content:
      "We have on board certain vendors who execute several donors (existing or potential)-related activities for us like send direct mails, emailers, greeting cards, making phone calls, and others. We may share your information like phone numbers, email address, etc. with these agencies so that they can perform these activities on behalf of Community Pure Water.",
  },
  {
    type: "heading",
    content: "Cookie Policy",
  },
  {
    type: "description",
    content:
      "Cookies are pieces of electronic information which will be sent by Community Pure Water when you log onto our website. These will be placed in your computer’s hard disk and enable us to recognise you as a user when you next visit.You can configure your browser so that it responds to cookies the way you deem fit. For example, you make want to accept all cookies, reject them all or get notified when a cookie is sent. Please check your browser’s settings to modify cookie behaviour as per your individual behaviour.Please note that if you disable the use of cookies on your web browser or remove or reject specific cookies from our website or linked sites then you may not be able to use the website as it is intended.",
  },
  {
    type: "heading",
    content: "CHANGES TO PRIVACY PRACTICES",
  },
  {
    type: "description",
    content:
      "As and when the need arises, Community Pure Water may alter its privacy practices in accordance with the latest technology and trends. We strive to provide you with timely notice of these changes. You may reach out to us if you have any queries about any changes made to our practices.",
  },
  {
    type: "description",
    content: `
        Please call: <strong>040-27206555</strong> or <strong>send an email to:</strong> jupally.rao@cpwf.org <br/>
        or Send a letter to: <br/>
        Community Pure Water an initiative  <br/>
        of Community Development Foundation  <br/>
        H.N. 1-3-29/3, Street No. 4/3,  <br/>
        Nandanavanam Colony,  <br/>
        Habsiguda, Hyderabad, Telangana-500007
        `,
  },
  {
    type: "heading",
    content:
      "All donations are final, and we are unable to offer refunds or cancelations.",
  },
  {
    type: "description",
    content:
      "The website communitypurewater.org (“SERVICE”) is an Online Presence of Community Pure Water, 1-3-29/3, street no 4/3, Nandanavanam colony, Habsiguda, Hyderabad, 5000 07, Telanagana, India.) The SERVICE is provided ON AN “AS IS” and “AS AVAILABLE” BASIS, without warranty of any kind. COMMUNITY PURE WATER (Community Development Foundation) EXPRESSLY DISCLAIMS ANY AND ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO:<br/> (A) ANY WARRANTIES AS TO THE AVAILABILITY, ACCURACY, COMPLETENESS, CORRECTNESS, TIMELINESS OR RELIABILITY OF THE CONTENT, SERVICES, PRODUCTS, TEXT, GRAPHICS, LINKS, OR OTHER ITEMS CONTAINED WITHIN THIS SERVICE, OR THE RESULTS OBTAINED FROM ACCESSING AND USING THIS SERVICE AND/OR THE CONTENT CONTAINED HEREIN, OR THE SERVICE ITSELF;<br/> (B) ANY WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR FREE, OR THAT SOFTWARE DEFECTS WILL BE CORRECTED; AND<br/> (C) WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-INFRINGEMENT. YOU ACKNOWLEDGE AND AGREE THAT ANY MATERIAL AND/OR DATA DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF THE SERVICE IS DONE AT YOUR OWN DISCRETION AND RISK AND THAT YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGES TO YOUR COMPUTER SYSTEM OR LOSS OF DATA THAT RESULTS FROM THE DOWNLOAD OF SUCH MATERIAL AND/OR DATA. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM COMMUNITY PURE WATER (Community Development Foundation) OR THROUGH THE SERVICE SHALL CREATE ANY WARRANTY NOT EXPRESSLY MADE HEREIN.COMMUNITY PURE WATER (Community Development Foundation) ITS TRUSTEES, OFFICERS, DIRECTORS, OWNERS, AGENTS, EMPLOYEES, AND ITS ASSOCIATES SHALL NOT BE LIABLE TO YOU OR ANYONE ELSE FOR ANY LOSS OR INJURY RESULTING FROM USE OF THE SERVICE, CAUSED IN WHOLE OR IN PART BY ITS NEGLIGENCE OR CONTINGENCIES BEYOND ITS CONTROL IN PROCURING, COMPILING, INTERPRETING, REPORTING OR DELIVERING THE SERVICE AND ANY CONTENT THROUGH THE SERVICE. IN NO EVENT WILL COMMUNITY PURE WATER (Community Development Foundation) ITS TRUSTEES, OFFICERS, DIRECTORS, OWNERS, AGENTS, EMPLOYEES AND ITS ASSOCIATES BE LIABLE TO YOU OR ANYONE ELSE FOR ANY DECISION MADE OR ACTION TAKEN BY YOU IN RELIANCE ON SUCH CONTENT. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES, SO SOME OF THE ABOVE EXCLUSIONS MAY NOT APPLY TO YOU.",
  },
];
