import BigNumber from "bignumber.js";

import {
  tokenContractAddress_Astar,
  ddexContractAddress_Astar,
  dNFTContractAddress_Astar,
  dataNFTFTTicker_Astar,
  tokenContractAddress_Matic,
  ddexContractAddress_Matic,
  dNFTContractAddress_Matic,
  tokenContractAddress_Goerli,
  ddexContractAddress_Goerli,
  dNFTContractAddress_Goerli,
  claimsContractAddress_Goerli,
  tokenContractAddress_testnetBSC,
  ddexContractAddress_testnetBSC,
  dNFTContractAddress_testnetBSC,
  tokenContractAddress_testnetHarmony,
  ddexContractAddress_testnetHarmony,
  dNFTContractAddress_testnetHarmony,
  tokenContractAddress_testnetAvalanche,
  ddexContractAddress_testnetAvalanche,
  dNFTContractAddress_testnetAvalanche,
  tokenContractAddress_Local,
  ddexContractAddress_Local,
  dNFTContractAddress_Local,
  claimsContractAddress_Matic,
  claimsContractAddress_testnetBSC,
  tokenContractAddress_Mx_Devnet,
  dataNFTFTTicker_Mx_Devnet,
  claimsContractAddress_Mx_Devnet,
  faucetContractAddress_Mx_Devnet,
  dataNftMintContractAddress_Mx_Devnet,
  dataNftMarketContractAddress_Mx_Devnet,
  tokenContractAddress_Mx_Mainnet,
  claimsContractAddress_Mx_Mainnet,
  faucetContractAddress_Mx_Mainnet,
} from "./contractAddresses";

type NetworkIdType = string | number;

export const contractsForChain = (networkId: NetworkIdType) => {
  const contracts: Record<string, string | null> = {
    itheumToken: null,
    ddex: null,
    dnft: null,
    faucet: null,
    claims: null,
    market: null,
    dataNftMint: null,
  };

  // eslint-disable-next-line default-case
  switch (networkId) {
    case 31337:
      contracts.itheumToken = tokenContractAddress_Local;
      contracts.ddex = ddexContractAddress_Local;
      contracts.dnft = dNFTContractAddress_Local;
      break;
    case 5:
      contracts.itheumToken = tokenContractAddress_Goerli;
      contracts.ddex = ddexContractAddress_Goerli;
      contracts.dnft = dNFTContractAddress_Goerli;
      contracts.claims = claimsContractAddress_Goerli;
      break;
    case 80001:
      contracts.itheumToken = tokenContractAddress_Matic;
      contracts.ddex = ddexContractAddress_Matic;
      contracts.dnft = dNFTContractAddress_Matic;
      contracts.claims = claimsContractAddress_Matic;
      break;
    case 97:
      contracts.itheumToken = tokenContractAddress_testnetBSC;
      contracts.ddex = ddexContractAddress_testnetBSC;
      contracts.dnft = dNFTContractAddress_testnetBSC;
      contracts.claims = claimsContractAddress_testnetBSC;
      break;
    case 1666700000:
      contracts.itheumToken = tokenContractAddress_testnetHarmony;
      contracts.ddex = ddexContractAddress_testnetHarmony;
      contracts.dnft = dNFTContractAddress_testnetHarmony;
      break;
    case 43113:
      contracts.itheumToken = tokenContractAddress_testnetAvalanche;
      contracts.ddex = ddexContractAddress_testnetAvalanche;
      contracts.dnft = dNFTContractAddress_testnetAvalanche;
      break;
    case "ED":
      contracts.itheumToken = tokenContractAddress_Mx_Devnet;
      contracts.dataNFTFTTicker = dataNFTFTTicker_Mx_Devnet;
      contracts.claims = claimsContractAddress_Mx_Devnet;
      contracts.faucet = faucetContractAddress_Mx_Devnet;
      contracts.dataNftMint = dataNftMintContractAddress_Mx_Devnet;
      contracts.market = dataNftMarketContractAddress_Mx_Devnet;
      break;
    case "E1":
      contracts.itheumToken = tokenContractAddress_Mx_Mainnet;
      contracts.claims = claimsContractAddress_Mx_Mainnet;
      contracts.faucet = faucetContractAddress_Mx_Mainnet;
      break;
    case "0x51":
      contracts.itheumToken = tokenContractAddress_Astar;
      contracts.ddex = ddexContractAddress_Astar;
      contracts.dnft = dNFTContractAddress_Astar;
      contracts.dnftTicker = dataNFTFTTicker_Astar;
      break;
  }

  return contracts;
};

export const uxConfig = {
  txConfirmationsNeededSml: 1,
  txConfirmationsNeededLrg: 2,
  dateStr: "MMM Do YYYY",
  dateStrTm: "MMM Do YYYY LT",
  mxAPITimeoutMs: 10000,
};

export const progInfoMeta = {
  rhc: {
    name: "Red Heart Challenge",
    desc: "Take this 3-week program and get unique insights into the health of your heart. This app uses a first of its kind technology to coach you through every step and to puts you in the center of the entire process.",
    medium: "Telegram App",
    outcome: "Data produced from this program can be used to assess the impact blood pressure, stress, diet and activity has on overall cardiovascular health.",
    targetBuyer: 'Research Institutes, Drug Manufacturers, Health "Care Teams", Private Health Insurance',
    data: "Blood Pressure (single arm and both arms), Stress Levels, Activity Levels, Diet Assessment",
    url: "https://itheum.com/redheartchallenge",
    dc: "Cardiovascular Health Data",
    id: "70dc6bd0-59b0-11e8-8d54-2d562f6cba54",
    canJoin: 1,
  },
  gdc: {
    name: "Web3 Gamer Passport",
    desc: "Calling all web3 gamers! The Gamer Passport app will empower you to claim and control your web3 gaming data as you move between games and guilds. You will then be able to attach it to your NFMe ID Avatar and trade your data with participants in the gaming industry.",
    medium: "Data Adaptors",
    outcome: 'Data produced from this app can be used to power "proof-of-play" and "proof-of-community-reputation"',
    targetBuyer: "Games, Game Platforms, Guilds, Guild Hubs, GameFi Platforms",
    data: "Discord community score, on-chain gaming performance, on-chain game earnings, game earnings and spending patterns, HOLDing ability, game assets composition to earning patterns",
    url: "https://itheum.medium.com/do-you-want-to-be-part-of-the-gamer-passport-alpha-release-4ae98b93e7ae",
    dc: "Gamer Passport Data",
    id: "foo",
    canJoin: 0,
  },
  gpes: {
    name: "Gamer Passport - ESSports",
    desc: "The Gamer Passport app will empower you to claim and control your web2 and web3 gaming data. You can then attach it to your NFMe ID Avatar, serving as your ESports 'resume.'",
    medium: "Data Adaptors",
    outcome: 'Data produced from this app can be used to power "proof-of-play" and "proof-of-skill"',
    targetBuyer: "Games, Game Platforms, ESSport Scouts",
    data: "web2 and web3 on-chain gaming performance",
    url: "https://itheum.com/program",
    dc: "Gamer Passport Data",
    id: "foo",
    canJoin: 0,
  },
  wfa: {
    name: "Strava Fitness",
    desc: "This ongoing program will automatically connect to your Strava account and download your latest activity from wearables like FitBit, Garmin, etc. Strava has an extensive global user base (76 million), so the dataset will be significant, uniform, and highly valued.",
    medium: "Telegram App + Strava API",
    outcome: "Data produced from this program is fully normalised and will be very valuable",
    targetBuyer: "Researchers",
    data: "Activity, Workouts",
    url: "https://itheum.com/program",
    dc: "Strava Fitness Data",
    id: "foo",
    canJoin: 0,
  },
};

export const tmpProgIdMapping = {
  "70dc6bd0-59b0-11e8-8d54-2d562f6cba54": "Red Heart Challenge",
  "bc9ce3e0-8f00-11e7-b1ff-9fef83fc8a42": "Hypertension Insights Intense",
  "476ab840-1cb7-11e9-84fe-e935b365220a": "Blood Pressure OnDemand",
  "183f0290-f726-11e7-9186-3bcb5c5d22db": "Chronic Wounds Healing Progress Tracker",
  "ef62c220-50e1-11e7-9bd2-2f33680a66b6": "Blood Pressure Tracker",
  "48d7b020-eab0-11ea-a466-0334ff0e8bf2": "OkPulse",
  "custom-gamer-activity": "Gamer Passport Activity",
  "playstation-gamer-passport": "Sony PlayStation Web3 Gamer Passport",
};

export const qsParams = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  return params;
};

export const itheumTokenRoundUtil = (balance: BigNumber.Value, decimals: number) => {
  const balanceWeiString = balance.toString();
  const balanceWeiBN = new BigNumber(balanceWeiString);
  const decimalsBN = new BigNumber(decimals);
  const divisor = new BigNumber(10).pow(decimalsBN);
  const beforeDecimal = balanceWeiBN.div(divisor);

  return beforeDecimal.toString();
};

export const CLAIM_TYPES = {
  REWARDS: 1,
  AIRDROPS: 2,
  ALLOCATIONS: 3,
  ROYALTIES: 4,
};

export const MENU = {
  HOME: 0,
  BUY: 1,
  SELL: 2,
  PURCHASED: 3,
  TX: 4,
  VAULT: 5,
  NFT: 6,
  COALITION: 7,
  STREAM: 8,
  ADVERTISED: 9,
  NFTMINE: 10,
  NFTALL: 11,
  COALITIONALL: 12,
  DATAPROOFS: 13,
  TRUSTEDCOMP: 14,
  FAUCET: 14,
  CLAIMS: 15,
  LANDING: 16,
  NFTDETAILS: 17,
  GETWHITELISTED: 18,
  DATACAT: 19,
};

export const PATHS = {
  home: [0, [-1]],
  buydata: [1, [0]],
  tradedata: [2, [-1]],
  purchaseddata: [3, [0]],
  chaintransactions: [4, [3]],
  datavault: [5, [4]],
  datanfts: [6, [1]],
  viewcoalitions: [7, [2]],
  datastreams: [8, [4]],
  advertiseddata: [9, [0]],
  wallet: [10, [1]],
  marketplace: [11, [1]],
  datacoalitions: [12, [2]],
  personaldataproof: [13, [0]],
  trustedcomputation: [14, [4]],
  nftdetails: [17, [4]],
  offer: [17, [4]],
};

export const CHAINS: any = {
  31337: "Localhost",
  1: "Eth - Mainnet",
  5: "Eth - Görli",
  137: "Matic - Mainnet",
  80001: "Matic - Mumbai",
  97: "BSC - Chapel",
  56: "BSC - Mainnet",
  1666700000: "Harmony - Testnet",
  43113: "Avalanche - Testnet",
  "0x250": "Astar Network",
  "0x51": "Astar - Shibuya",
  E1: "MultiversX - Mainnet",
  ED: "MultiversX - Devnet",
};

// these are used by moralis SDK to identify the chain (e.g. Web3Api.account.getNFTs)
export const CHAIN_NAMES = {
  31337: "localhost",
  1: "eth",
  5: "goerli",
  137: "matic",
  80001: "mumbai",
  97: "bsc testnet",
  56: "bsc",
  1666700000: "harmony testnet",
  43113: "avalanche testnet",
};

export const OPENSEA_CHAIN_NAMES: Record<NetworkIdType, string> = {
  1: "eth",
  5: "goerli",
  137: "matic",
  80001: "mumbai",
};

export const SUPPORTED_CHAINS = ["E1", "ED", 5, 80001, 97, 1666700000, 43113, "0x51"];

export const WALLETS = {
  METAMASK: "evm_metamask",
  WC: "evm_wc",
  MX_XPORTALAPP: "el_maiar",
  MX_DEFI: "el_defi",
  MX_WEBWALLET: "el_webwallet",
  MX_LEDGER: "el_ledger",
};

export const consoleNotice = `DATA DEX NOTES --------------------------\n
1) Nothing to report for now...\n
-----------------------------------------`;

export function notSupportedOnChain(menuItem: any, networkId: NetworkIdType) {
  const UNSUPPORTED_CHAIN_FEATURES: Record<NetworkIdType, number[]> = {
    5: [MENU.TX],
    31337: [MENU.CLAIMS, MENU.NFTALL, MENU.NFTMINE, MENU.TX],
    97: [MENU.TX, MENU.COALITION],
    1666700000: [MENU.CLAIMS, MENU.NFTALL, MENU.NFTMINE, MENU.TX],
    43113: [MENU.CLAIMS, MENU.TX],
    ED: [MENU.TX, MENU.COALITION, MENU.BUY, MENU.PURCHASED, MENU.ADVERTISED, MENU.DATAPROOFS],
    E1: [MENU.FAUCET, MENU.TX, MENU.COALITION, MENU.NFTALL, MENU.NFTMINE, MENU.BUY, MENU.PURCHASED, MENU.ADVERTISED, MENU.DATAPROOFS, MENU.SELL],
    "0x250": [
      MENU.FAUCET,
      MENU.CLAIMS,
      MENU.TX,
      MENU.COALITION,
      MENU.NFTALL,
      MENU.NFTMINE,
      MENU.BUY,
      MENU.PURCHASED,
      MENU.ADVERTISED,
      MENU.DATAPROOFS,
      MENU.SELL,
    ],
    "0x51": [MENU.CLAIMS, MENU.TX, MENU.COALITION, MENU.NFTALL, MENU.NFTMINE, MENU.BUY, MENU.PURCHASED, MENU.ADVERTISED, MENU.DATAPROOFS],
  };

  if (UNSUPPORTED_CHAIN_FEATURES[networkId]) {
    return UNSUPPORTED_CHAIN_FEATURES[networkId].includes(menuItem);
  } else {
    return false;
  }
}

export const CHAIN_TX_VIEWER = {
  5: "https://goerli.etherscan.io/tx/",
  80001: "https://explorer-mumbai.maticvigil.com/tx/",
  97: "https://testnet.bscscan.com/tx/",
  1666700000: "https://explorer.pops.one/#/",
  43113: "https://testnet.snowtrace.io/tx/",
  E1: "https://explorer.multiversx.com",
  ED: "https://devnet-explorer.multiversx.com",
  "0x250": "https://astar.subscan.io",
  "0x51": "https://shibuya.subscan.io",
};

export const CHAIN_TX_LIST = {
  80001: {
    advertiseEvents: "AdvertiseEventsPA",
    purchaseEvents: "PurchaseEventsPA",
  },
};

export const CHAIN_TOKEN_SYMBOL = (networkId: NetworkIdType) => {
  const mapping: Record<string, any[]> = {
    ITHEUM: ["E1", "ED", "0x250", "0x51"],
    // aITHEUM: ["0x250", "0x51"],
    eITHEUM: [5, 1],
    mITHEUM: [80001, 137],
    bITHEUM: [97, 56],
    hITHEUM: [1666700000],
    xITHEUM: [43113],
  };

  let sym = null;

  Object.keys(mapping).some((i) => {
    if (mapping[i].includes(networkId)) {
      sym = i;
    }

    return mapping[i].includes(networkId);
  });

  return sym;
};

export const TERMS = [
  { id: "1", val: "Research Purposes Only", coin: 2 },
  { id: "2", val: "Research or Commercial Purposes Only", coin: 2 },
  { id: "3", val: "Fully License (any use case)", coin: 2 },
];

export const sleep = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

export const buyOnOpenSea = (txNFTId: string, dnftContract: string, txNetworkId: NetworkIdType) => {
  window.open(`https://testnets.opensea.io/assets/${OPENSEA_CHAIN_NAMES[txNetworkId]}/${dnftContract}/${txNFTId}`);
};

export const gtagGo = (category: string, action: any, label: any, value?: any) => {
  /*
  e.g.
  Category: 'Videos', Action: 'Play', Label: 'Gone With the Wind'
  Category: 'Videos'; Action: 'Play - Mac Chrome'
  Category: 'Videos', Action: 'Video Load Time', Label: 'Gone With the Wind', Value: downloadTime

  Category: 'Auth', Action: 'Login', Label: 'Metamask'
  Category: 'Auth', Action: 'Login - Success', Label: 'Metamask'
  Category: 'Auth', Action: 'Login', Label: 'DeFi'
  Category: 'Auth', Action: 'Login', Label: 'Ledger'
  Category: 'Auth', Action: 'Login', Label: 'xPortalApp'
  Category: 'Auth', Action: 'Login', Label: 'WebWallet'

  Category: 'Auth', Action: 'Logout', Label: 'WebWallet'
  */

  if (!action || !category) {
    console.error("gtag tracking needs both action and category");
    return;
  }

  const eventObj: Record<string, string> = {
    event_category: category,
  };

  if (label) {
    eventObj["event_label"] = label;
  }

  if (value) {
    eventObj["event_value"] = value;
  }

  if (window.location.hostname !== "localhost") {
    (window as any).gtag("event", action, eventObj);
  }
};

export const clearAppSessionsLaunchMode = () => {
  localStorage?.removeItem("itm-wallet-used");
  localStorage?.removeItem("itm-launch-mode");
  localStorage?.removeItem("itm-launch-env");
  localStorage?.removeItem("itm-datacat-linked");
};

export const formatNumberRoundFloor = (num: number, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return (Math.floor(num * factor) / factor).toFixed(2);
};

export const convertWeiToEsdt = (amount: BigNumber.Value, decimals = 18, precision = 4) => {
  return new BigNumber(amount).shiftedBy(-decimals).decimalPlaces(precision);
};

export const convertEsdtToWei = (amount: BigNumber.Value, decimals = 18) => {
  return new BigNumber(amount).shiftedBy(decimals);
};

export const tryParseInt = (value: any, defaultValue = 0) => {
  if (defaultValue < 0) defaultValue = 0;
  const intValue = parseInt(value);
  return Number.isNaN(intValue) ? defaultValue : intValue;
};

export const isValidNumericCharacter = (char: any) => {
  return char.match(/[0-9]/);
};

export const dataCATDemoUserData = {
  "lastName": "User",
  "firstName": "DexDemo",
  "programsAllocation": [
    {
      "program": "custom-gamer-activity",
      "group": "custom",
      "userId": "custom-x",
      "status": "stop",
      "shortId": "1",
      "type": "1",
      "fromTs": 1528448026784,
      "toTs": 1535951753305,
    },
    {
      "program": "playstation-gamer-passport",
      "group": "custom",
      "userId": "custom-x",
      "status": "stop",
      "shortId": "1",
      "type": "1",
      "fromTs": 1528448026784,
      "toTs": 1535951753305,
    },
    {
      "program": "70dc6bd0-59b0-11e8-8d54-2d562f6cba54", // red heart challenge
      "userId": "351e6600-0d32-11e7-a1fc-2beae8f58872",
      "status": "complete",
      "shortId": "1",
      "type": "3",
      "fromTs": 1543835363643,
      "toTs": 1546073965694,
    },
    {
      "program": "48d7b020-eab0-11ea-a466-0334ff0e8bf2", // okpulse
      "userId": "d879d170-e5a8-11ea-8fbc-3f6bc955eff0",
      "status": "active",
      "shortId": "104",
      "type": "3",
      "fromTs": 1598786220915,
      "toTs": 1623154409311,
    },
    {
      "program": "ef62c220-50e1-11e7-9bd2-2f33680a66b6", // blood pressure tracker
      "userId": "351e6600-0d32-11e7-a1fc-2beae8f58872",
      "status": "stop",
      "shortId": "1",
      "type": "1",
      "fromTs": 1497520172549,
      "toTs": 1536402897123,
    },
    {
      "program": "bc9ce3e0-8f00-11e7-b1ff-9fef83fc8a42", // hypertension insights intense
      "userId": "351e6600-0d32-11e7-a1fc-2beae8f58872",
      "status": "stop",
      "shortId": "1",
      "type": "1",
      "fromTs": 1504262112978,
      "toTs": 1535607089747,
    },
    {
      "program": "476ab840-1cb7-11e9-84fe-e935b365220a",
      "userId": "351e6600-0d32-11e7-a1fc-2beae8f58872",
      "status": "active",
      "shortId": "1",
      "type": "1",
      "fromTs": 1548043292188,
      "toTs": 1623154409311,
    },
  ],
  "_lookups": {
    "programs": {
      "custom-gamer-activity": {
        "programName": "Gamer Passport Activity",
        "dataStreamURL": "https://itheumapi.com/readingsStream/db5e2d6c-d90a-11ec-9d64-0242ac120002/02f2d3f0-cbaa-11ec-864d-c9ca0d926d97",
        "dataPreviewURL": "https://itheum-static.s3.ap-southeast-2.amazonaws.com/gamer-passport-activity-dashboard-preview.png",
        "img": "gamer-passport-data",
        "description":
          "A bulk dataset of over 44099 data points collected from the Polygon, BSC and Elrond Blockchains and Discord Social Channels for over 81 Gamers playing the Wonderhero, Cyball and Knights of Cathena web3 games.",
      },
      "playstation-gamer-passport": {
        "programName": "Sony PlayStation Web3 Gamer Passport",
        "dataStreamURL": "https://api.itheumcloud-stg.com/hosteddataassets/playstation_gamer_1_data_passport.json",
        "dataPreviewURL": "https://api.itheumcloud-stg.com/hosteddataassets/playstation_gamer_1_data_passport_preview.json",
        "img": "sony-playstation-data-passport",
        "title": "My Sony PlayStation data passport",
        "description":
          "Unlock a live dataset of a Sony PlayStation gamer's platform, preferences, active titles played, trophies, playtime, and achievements. All sourced direct from the gamer!",
      },
      "bc9ce3e0-8f00-11e7-b1ff-9fef83fc8a42": {
        "programName": "Hypertension Insights Intense",
        "img": "hii",
        "description":
          'This Intense program aims to produce some blood pressure insights for our patient base. These insights can then be used to test some Hypothesis relating to the “Dangers of Morning Blood Pressure”, "Unusual trends in Arm to Arm BP difference" as well is the treatment plan a Patient on really controlling their Blood Pressure. \n\nAt the end of the Program the Patent will receive a report by post which we will recommend then take to their GP or Specialist. ',
        "duration": "2_weeks",
      },
      "476ab840-1cb7-11e9-84fe-e935b365220a": {
        "programName": "Blood Pressure OnDemand",
        "img": "bpo",
        "description": "A program for users to log and check blood pressure as they feel.",
        "duration": "ongoing",
      },
      "70dc6bd0-59b0-11e8-8d54-2d562f6cba54": {
        "programName": "Red Heart Challenge",
        "img": "rhc",
        "description": "A 3 week challenge to generate some Heart Health insights by collecting Blood Pressure readings, Stress Readings etc",
        "duration": "3_weeks",
      },
      "ef62c220-50e1-11e7-9bd2-2f33680a66b6": {
        "programName": "Blood Pressure Tracker",
        "img": "bpt",
        "description":
          "Hypertension is defined as a systolic blood pressure of 140 mm Hg or more, or a diastolic blood pressure of 90 mm Hg or more, or taking antihypertensive medication. It is estimated that 1 in 3 people globally supper from Hypertension.\n\nThis Program is to help anyone living with Hypertension or Mild Hypertension to better manger their condition with proactive monitoring and tracking. It's also designed to help anyone track and monitor their loved ones living with this condition as well.",
        "duration": "ongoing",
      },
      "48d7b020-eab0-11ea-a466-0334ff0e8bf2": {
        "programName": "OkPulse",
        "img": "okpulse",
        "description":
          "We would like to understand how we can best support you as you work remotely. This program provides us with a living pulse on your motivation, productivity, engagement levels and general health and wellbeing.",
        "duration": "ongoing",
      },
    },
  },
};

export const styleStrings = {
  gradientBorderMulticolor: "linear-gradient(#0F0F0F, #0F0F0F) padding-box, linear-gradient(to left top, #00C797, #FF439D) border-box",
  gradientBorderMulticolorLight: "linear-gradient(white, white) padding-box, linear-gradient(to left top, #00C797, #FF439D) border-box",
  gradientBorderPassive: "linear-gradient(#0F0F0F, #0F0F0F) padding-box, linear-gradient(to right, rgb(79 209 197 / 20%), rgb(79 209 197 / 60%)) border-box",
  gradientBorderPassiveLight: "linear-gradient(white, white) padding-box, linear-gradient(to right, rgb(79 209 197 / 20%), rgb(79 209 197 / 60%)) border-box",
  gradientBorderMulticolorToBottomRight: "linear-gradient(#0F0F0F, #0F0F0F) padding-box, linear-gradient(to left top, #00C79750, #FF439D50) border-box",
  gradientBorderMulticolorToBottomRightLight:
    "linear-gradient(white, white) padding-box, linear-gradient(to left top, #00C79750, #686868, #FF439D50) border-box",
};

export const itheumTokenRoundUtilExtended = (
  balance: any,
  decimals: any,
  BigNumber: any,
  returnAsOurStandardFormat?: boolean,
  decimalsToAdjustStandardFormat?: number
) => {
  try {
    const _balanceWeiString = balance.toString(); // 10200000000000000000
    const _balanceWeiBN = BigNumber.from(_balanceWeiString);

    const _decimals = 18;
    const _decimalsBN = BigNumber.from(_decimals);
    const _divisor = BigNumber.from(10).pow(_decimalsBN);

    const _beforeDecimal = _balanceWeiBN.div(_divisor);
    const _afterDecimal = _balanceWeiBN.mod(_divisor);

    // console.log(_beforeDecimal.toString()); // >> 10
    // console.log(_afterDecimal.toString()); // >> 200000000000000000

    // returnAsOurStandardFormat will format it as 10.2
    if (returnAsOurStandardFormat) {
      const charDigitsToShow = typeof decimalsToAdjustStandardFormat !== "undefined" ? decimalsToAdjustStandardFormat : 1;
      return `${_beforeDecimal.toString()}.${_afterDecimal.toString().substring(0, charDigitsToShow)}`;
    } else {
      return [_beforeDecimal.toString(), _afterDecimal.toString()];
    }
  } catch (e) {
    return "ERROR !";
  }
};
