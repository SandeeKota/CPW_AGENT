import IndiaFlag from "@/assets/india.svg";
import UsFlag from "@/assets/us.svg";
import EuropeFlag from "@/assets/urope.svg";
import { CURRENCY_VALID } from "@/app/lib/redox/slices/geolocationSlice";
import { CONVERSTION_RATES } from "@/lib/constants";

export const IMAGE_LINKS = {
  BOYS_WITH_WATER_BOTTLE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_5971_11zon_1749484492489-1756098216361.jpg",
  GIRLS_STUDING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6183_11zon_1749484911500-1756098262245.jpg",
  VILLAGE_WOMENS:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6022_11zon_1749485058476-1756098300864.jpg",
  CHILDREN_AT_SCHOOL:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6165_11zon_11zon_1749485241870-1756098359951.jpg",
  DRINKING_GRILS_POTRAITE_MODE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6083_1749491357596-1756098400752.jpg",
  STANDING_GIRL_CHILDREN:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6310_11zon_1749491704750-1756098446853.jpg",
  DRINIKING_TEEN_GIRL_AT_BOX:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6354_11zon_1749491857225-1756098526558.jpg",
  CHILDRENS_WITH_FILTER_BOX:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6301_11zon_1749492096280-1756098580420.jpg",
  CHILDREN_GROUP_SMILE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6141_11zon_1749616540859-1756098631755.jpg",
  VILLAGE_WOMAN_SMILING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_5974_11zon_1749617317749-1756098667067.jpg",
  CHILDREN_LOOKING_UP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_5979_11zon_1749617493206-1756098706553.jpg",
  GIRLS_WITH_WATER_CONTAINER_1:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6001_11zon__1__1749617675318-1756098767438.jpg",
  GIRLS_WITH_WATER_CONTAINER_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6001_11zon_1749617676804-1756098833268.jpg",
  WOMEN_SMILING_TOGETHER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6005_11zon_1749617677496-1756098873202.jpg",
  WOMAN_HOLDING_CONTAINER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6029_11zon_1749617678396-1756098903167.jpg",
  CHILDREN_AROUND_WATER_SOURCE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_anonymous_DSC_6015_11zon_1749617677952_1756098938374__1_-1756099000317.jpg",
  VILLAGE_CHILDREN_PLAYING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6038_11zon_1749617914027-1756099040119.jpg",
  GIRL_DRINKING_WATER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6045_11zon_1749617915068-1756099076151.jpg",
  CHILDREN_GATHERED_AROUND:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6050_11zon_1749617915464-1756099109922.jpg",
  WOMEN_IN_VILLAGE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6066_11zon_1749617915960-1756099143091.jpg",
  GIRL_WITH_WATER_BOTTLE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6080_11zon_1749617916417-1756099180062.jpg",
  CHILDREN_SMILING_AT_CAMERA:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6089_11zon_1749617916940-1756099209310.jpg",
  GROUP_OF_CHILDREN:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6094_11zon_1749617917390-1756099252902.jpg",
  CHILDREN_WITH_WATER_CONTAINERS:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6098_11zon_1749617917749-1756099284192.jpg",
  CHILDREN_LOOKING_CURIOUS:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6101_11zon_1749617918120-1756099323114.jpg",
  CHILDREN_IN_VILLAGE_SETTING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6104_11zon_1749617918485-1756099356293.jpg",
  CHILDREN_GATHERED_TOGETHER_1:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6203_11zon_1749618154079-1756099399480.jpg",
  GIRL_HOLDING_OBJECT:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6118_11zon_1749618146325-1756099452474.jpg",
  CHILDREN_STANDING_IN_LINE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6124_11zon_1749618146973-1756099479712.jpg",
  CHILDREN_SMILING_WIDE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6130_11zon_1749618147883-1756099512582.jpg",
  CHILDREN_LOOKING_AT_SOMETHING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6101_11zon_1749617918120-1756099559123.jpg",
  CHILDREN_WITH_SUPPLIES:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6135_11zon_1749618150027-1756099594817.jpg",
  CHILDREN_IN_CLASSROOM:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6137_11zon_1749618150709-1756099638341.jpg",
  CHILDREN_INTERACTING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6146_11zon_1749618151487-1756099668748.jpg",
  CHILDREN_IN_SCHOOL_UNIFORM:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6160_11zon_1749618152223-1756099715237.jpg",
  CHILDREN_PLAYING_OUTSIDE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6181_11zon_1749618152908-1756099769255.jpg",
  CHILDREN_LOOKING_AT_CAMERA:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6190_11zon_1749618153589-1756099807119.jpg",
  CHILDREN_GATHERED_TOGETHER_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6203_11zon_1749618154079-1756099832776.jpg",
  CHILDREN_IN_GROUP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6223_11zon_1749618154473-1756099865012.jpg",
  CHILDREN_SMILING_IN_GROUP_1:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6234_11zon__1__1749618154885-1756099899674.jpg",
  CHILDREN_SMILING_IN_GROUP_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6234_11zon_1749618155450-1756099967184.jpg",
  CHILDREN_TOGETHER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6280_11zon_1749618412326-1756099994505.jpg",
  CHILDREN_HAPPY:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6239_11zon_1749618411745-1756100021471.jpg",
  CHILDREN_PLAYING:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6277_11zon_1749618412588-1756100054855.jpg",
  CHILDREN_SMILING_AT_CAMERA_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6273_11zon_1749618412828-1756100087936.jpg",
  CHILDREN_LOOKING_AT_CAMERA_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6255_11zon_1749618413062-1756100124885.jpg",
  GIRL_DRINKING_WATER_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6288_11zon_1749618505775-1756100153344.jpg",
  CHILDREN_WITH_WATER_FILTER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6306_11zon_1749618506749-1756100187223.jpg",
  GIRL_HOLDING_WATER_BOTTLE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6312_11zon_1749618507358-1756100695514.jpg",
  CHILD_DRINKING_FROM_TAP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6315_11zon_1749618507751-1756100665364.jpg",
  CHILDREN_AROUND_WATER_TAP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6318_11zon_1749618508313-1756100634904.jpg",
  CHILD_WASHING_HANDS:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6321_11zon_1749618508872-1756100602841.jpg",
  CHILDREN_WAITING_FOR_WATER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6334_11zon_1749618509273-1756100576921.jpg",
  CHILD_FILLING_WATER_BOTTLE:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6339_11zon_1749618509746-1756100551733.jpg",
  CHILD_WITH_CUP_OF_WATER:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6351_11zon_1749618510384-1756100515571.jpg",
  CHILD_DRINKING_WATER_FROM_TAP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6351_11zon_1749618510384-1756100474991.jpg",
  CHILDREN_USING_WATER_PUMP:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6366_11zon_1749618510724-1756100446520.jpg",
  CHILDREN_IN_VILLAGE_1:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC03642_11zon_1749618511050-1756100338406.jpg",
  CHILDREN_IN_VILLAGE_2:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC03662_11zon_1749618511248-1756100292862.jpg",
  CHILDREN_IN_VILLAGE_3:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC03672_11zon_1749618511573-1756100260842.jpg",
  CHILDREN_IN_VILLAGE_4:
    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC03681_11zon_1749618511915-1756100220171.jpg",
};

interface CurrencyTab {
  label: string;
  value: string;
  image: string;
}

export const CURRENCY_TABS: CURRENCY_VALID[] = ["INR", "USD", "EUR", "GBP"];
export const currencyAmounts = {
  INR: [500, 1000, 2500, 3000],
  USD: [10, 25, 50, 100],
  EUR: [8, 20, 40, 80],
  GBP: [8, 20, 40, 80],
};

export type CurrencyCode = keyof typeof currencyAmounts; // "INR" | "USD" | "EUR" | "GBP"
export type CurrencyAmounts = (typeof currencyAmounts)[CurrencyCode][number]; // individual number like 500
export const currencyTabs: CurrencyTab[] = [
  { label: "INR - Indian Rupee", value: "INR", image: IndiaFlag.src },
  { label: "USD - US Dollar", value: "USD", image: UsFlag.src },
  { label: "EUR", value: "EUR", image: EuropeFlag.src },
  { label: "GBP - British Pound", value: "GBP", image: EuropeFlag.src },
];

/**
 * Converts Indian Rupees (INR) amount to USD, EUR and GBP.
 * Note: Exchange rates are based on June 11, 2025; replace them with live rates as needed.
 *
 * @param {number} amountInINR - The amount in Indian Rupees to convert.
 * @returns {{usd: number, eur: number, gbp: number}} - The converted amounts in USD, EUR and GBP.
 */
export const convertINRtoOthers = (amountInINR: number) => {
  if (
    typeof amountInINR !== "number" ||
    isNaN(amountInINR) ||
    amountInINR < 0
  ) {
    throw new Error("Invalid amount. Please provide a non-negative number.");
  }

  // Updated exchange rates as of June 11, 2025
  const exchangeRates = {
    usd: CONVERSTION_RATES.USD, // 1 INR = 0.0117 USD
    eur: CONVERSTION_RATES.EUR, // 1 INR = 0.0102 EUR
    gbp: CONVERSTION_RATES.GBP, // 1 INR = 0.008651 GBP
  };

  const usd = Number((amountInINR * exchangeRates.usd).toFixed(2));
  const eur = Number((amountInINR * exchangeRates.eur).toFixed(2));
  const gbp = Number((amountInINR * exchangeRates.gbp).toFixed(2));

  return { usd, eur, gbp };
};

// Export the function for usage in other modules if using module system
// module.exports = convertINRtoOthers;
// or
// export default convertINRtoOthers;

// Example usage:
const amountInINR = 1000; // Example amount
const convertedAmounts = convertINRtoOthers(amountInINR);
console.log(
  `INR ${amountInINR} is approximately USD ${convertedAmounts.usd}, EUR ${convertedAmounts.eur} and GBP ${convertedAmounts.gbp}.`,
);

export const PROJECT_AMOUNTS: any = {
  ISD: 500000,
  USD: 6000,
  EUR: 5500,
  GBP: 5000,
};
