import React, { useEffect, useState } from "react";
import { CheckCircleIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Switch,
  Progress,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  CloseButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Skeleton,
  Spinner,
  Stack,
  Tag,
  Text,
  Textarea,
  useColorMode,
  useDisclosure,
  useToast,
  Wrap,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { File, NFTStorage } from "nft.storage";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import * as Yup from "yup";
import { labels } from "libs/language";
import { isValidNumericCharacter, MENU, sleep, styleStrings } from "libs/util";
import { UserDataType } from "MultiversX/types";
import { useChainMeta } from "store/ChainMetaContext";
import ChainSupportedInput from "UtilComps/ChainSupportedInput";

import { ethers } from "ethers";
import { ABIS } from "../EVM/ABIs";

const InputLabelWithPopover = ({ children, tkey }: { children: any; tkey: string }) => {
  let title = "",
    text = "";

  if (tkey === "data-stream-url") {
    title = "Data Stream URL";
    text = labels.MINT_FORM_POPUP_INFO_DATA_STREAM;
  } else if (tkey === "data-preview-url") {
    title = "Data Preview URL";
    text = labels.MINT_FORM_POPUP_INFO_DATA_PREVIEW;
  } else if (tkey === "data-marshal-url") {
    title = "Data Marshal URL";
    text = labels.MINT_FORM_POPUP_INFO_DATA_MARSHAL;
  } else if (tkey === "token-name") {
    title = "Token Name (Short Title)";
    text = labels.MINT_FORM_POPUP_INFO_TOKEN_NAME;
  } else if (tkey === "dataset-title") {
    title = "Dataset Title";
    text = labels.MINT_FORM_POPUP_INFO_TITLE;
  } else if (tkey === "dataset-description") {
    title = "Dataset Description";
    text = labels.MINT_FORM_POPUP_INFO_DESC;
  } else if (tkey === "number-of-copies") {
    title = "Number of Copies";
    text = labels.MINT_FORM_POPUP_INFO_SUPPLY;
  } else if (tkey === "royalties") {
    title = "Royalties";
    text = labels.MINT_FORM_POPUP_INFO_ROYALTY;
  }

  return (
    <Flex fontSize="small">
      <Popover trigger="hover" placement="auto">
        <PopoverTrigger>{children}</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader fontWeight="semibold">{title}</PopoverHeader>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>{text}</PopoverBody>
        </PopoverContent>
      </Popover>
    </Flex>
  );
};

function makeRequest(url: string): Promise<{ statusCode: number; isError: boolean }> {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function (e) {
      resolve({
        statusCode: this.status,
        isError: false,
      });
    };
    xhr.onerror = function (e) {
      resolve({
        statusCode: this.status,
        isError: true,
      });
    };
    xhr.send();
  });
}

const checkUrlReturns200 = async (url: string) => {
  const { statusCode, isError } = await makeRequest(url);

  let isSuccess = false;
  let message = "";
  if (isError) {
    message = "Data Stream URL is not appropriate for minting into Data NFT (Unknown Error)";
  } else if (statusCode === 200) {
    isSuccess = true;
  } else if (statusCode === 404) {
    message = "Data Stream URL is not reachable (Status Code 404 received)";
  } else {
    message = `Data Stream URL must be a publicly accessible url (Status Code ${statusCode} received)`;
  }

  return {
    isSuccess,
    message,
  };
};

// Declaring the form types
type TradeDataFormType = {
  dataStreamUrlForm: string;
  dataPreviewUrlForm: string;
  tokenNameForm: string;
  datasetTitleForm: string;
  datasetDescriptionForm: string;
  numberOfCopiesForm: number;
  royaltiesForm: number;
};

export default function MintDataEVM({ onRfMount, dataCATAccount, setMenuItem }: { onRfMount: any; dataCATAccount: any; setMenuItem: any }) {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const { chainMeta: _chainMeta } = useChainMeta();
  const toast = useToast();
  const [saveProgress, setSaveProgress] = useState({
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
  });
  const [mintingSuccessful, setMintingSuccessful] = useState(false);
  const { isOpen: isProgressModalOpen, onOpen: onProgressModalOpen, onClose: onProgressModalClose } = useDisclosure();
  const { isOpen: isDrawerOpenTradeStream, onOpen: onOpenDrawerTradeStream, onClose: onCloseDrawerTradeStream } = useDisclosure();

  const [currDataCATSellObj, setCurrDataCATSellObj] = useState<any>(null);
  const [isStreamTrade, setIsStreamTrade] = useState(0);
  const [oneNFTImgLoaded, setOneNFTImgLoaded] = useState(false);
  const [dataNFTImg, setDataNFTImg] = useState("");
  const [dataNFTCopies, setDataNFTCopies] = useState(1);
  const [dataNFTRoyalty, setDataNFTRoyalty] = useState(0);
  const [dataNFTStreamUrl, setDataNFTStreamUrl] = useState("");
  const [dataNFTStreamPreviewUrl, setDataNFTStreamPreviewUrl] = useState("");
  const [errDataNFTStreamGeneric, setErrDataNFTStreamGeneric] = useState<any>(null);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [readTermsChecked, setReadTermsChecked] = useState(false);
  const [readAntiSpamFeeChecked, setReadAntiSpamFeeChecked] = useState(false);
  const [minRoyalties, setMinRoyalties] = useState(0);
  const [maxRoyalties, setMaxRoyalties] = useState(80);
  const [maxSupply, setMaxSupply] = useState(1);
  const [antiSpamTax, setAntiSpamTax] = useState(0);
  const [dataNFTStreamUrlStatus, setDataNFTStreamUrlStatus] = useState("");
  const [dataNFTStreamPreviewUrlStatus, setDataNFTStreamPreviewUrlStatus] = useState("");
  const [dataNFTImgGenServiceValid, setDataNFTImgGenService] = useState(false);
  const [itheumBalance, setItheumBalance] = useState(0);
  const [mintDataNFTDisabled, setMintDataNFTDisabled] = useState(true);
  const [userFocusedForm, setUserFocusedForm] = useState(false);
  const [, setDataStreamUrlValidation] = useState(false);
  const [, setDataPreviewUrlValidation] = useState(false);
  const [userData, setUserData] = useState<UserDataType | undefined>();
  const [dataNFTStreamUrlError, setDataNFTStreamUrlError] = useState("");
  const [dataNFTStreamPreviewUrlError, setDataNFTStreamPreviewUrlError] = useState("");
  const [datasetTitleError, setDatasetTitleError] = useState("");
  const [datasetDescriptionError, setDatasetDescriptionError] = useState("");
  const [dataNFTCopiesError, setDataNFTCopiesError] = useState("");
  const [dataNFTRoyaltyError, setDataNFTRoyaltyError] = useState("");

  const [newNFTId, setNewNFTId] = useState(null);
  const [txNFTConfirmation, setTxNFTConfirmation] = useState(0);
  const [txNFTHash, setTxNFTHash] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [deepLinkMode, setDeepLinkMode] = useState(false);

  const [priceErrors, setPriceErrors] = useState<string[]>([]);
  const [prices, setPrices] = useState<number[]>([10]);
  const [secondaryTradeable, setSecondaryTradeable] = useState<boolean>(false);

  // React hook form + yup integration
  // Declaring a validation schema for the form with the validation needed
  const validationSchema = Yup.object().shape({
    dataStreamUrlForm: Yup.string()
      .required("Data Stream URL is required")
      .url("Data Stream must be URL")
      .notOneOf(["https://drive.google.com"], `Data Stream URL doesn't accept Google Drive URLs`)
      .test("is-distinct", "Data Stream URL cannot be the same as the Data Preview URL", function (value) {
        return value !== this.parent.dataPreviewUrlForm;
      })
      .test("is-200", "Data Stream URL must be public", async function (value: string) {
        const { isSuccess, message } = await checkUrlReturns200(value);
        if (!isSuccess) {
          return this.createError({ message });
        }
        return true;
      }),

    dataPreviewUrlForm: Yup.string()
      .required("Data Preview URL is required")
      .url("Data Preview must be URL")
      .notOneOf(["https://drive.google.com"], `Data Preview URL doesn't accept Google Drive URLs`)
      .test("is-distinct", "Data Preview URL cannot be the same as the Data Stream URL", function (value) {
        return value !== this.parent.dataStreamUrlForm;
      })
      .test("is-200", "Data Stream URL must be public", async function (value: string) {
        const { isSuccess, message } = await checkUrlReturns200(value);
        if (!isSuccess) {
          return this.createError({ message });
        }
        return true;
      }),

    tokenNameForm: Yup.string()
      .required("Token name is required")
      .matches(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed")
      .min(3, "Token name must have at least 3 characters.")
      .max(20, "Token name must have maximum of 20 characters."),

    datasetTitleForm: Yup.string()
      .required("Dataset title is required")
      .matches(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters are allowed")
      .min(10, "Dataset title must have at least 10 characters.")
      .max(60, "Dataset title must have maximum of 60 characters."),
    datasetDescriptionForm: Yup.string()
      .required("Dataset description is required")
      .min(10, "Dataset description must have at least 10 characters.")
      .max(400, "Dataset description must have maximum of 400 characters."),

    numberOfCopiesForm: Yup.number()
      .typeError("Number of copies must be a number.")
      .min(1, "Minimum number of copies should be 1 or greater.")
      .max(maxSupply, `Number of copies should be less than ${maxSupply}.`)
      .required("Number of copies is required"),

    royaltiesForm: Yup.number()
      .typeError("Royalties must be a number.")
      .min(0, "Minimum value of royalties is 0%.")
      .max(maxRoyalties, `Maximum value of royalties is ${maxRoyalties}`)
      .required("Royalties is required"),
  });

  // Destructure the methods needed from React Hook Form useForm component
  const {
    control,
    formState: { errors },
    handleSubmit,
    trigger,
    setValue,
  } = useForm<TradeDataFormType>({
    defaultValues: {
      dataStreamUrlForm: "",
      dataPreviewUrlForm: "",
      tokenNameForm: "",
      datasetTitleForm: "",
      datasetDescriptionForm: "",
      numberOfCopiesForm: 1,
      royaltiesForm: 0,
    }, // declaring default values for inputs not necessary to declare
    mode: "onChange", // mode stay for when the validation should be applied
    resolver: yupResolver(validationSchema), // telling to React Hook Form that we want to use yupResolver as the validation schema
  });

  const onSubmit = (data: TradeDataFormType) => {
    console.log(data);
  }; // here you can make logic that you want to happen on submit (used for debugging)

  // query settings from Data NFT Minter SC
  useEffect(() => {
    if (!_chainMeta.networkId) return;

    // onProgressModalOpen();
  }, [_chainMeta.networkId]);

  // set initial states for validation
  useEffect(() => {
    onChangeDataNFTStreamUrl("");
    onChangeDataNFTStreamPreviewUrl("");
    // onChangeDataNFTMarshalService(`${process.env.REACT_APP_ENV_DATAMARSHAL_API}`);
    onChangeDataNFTImageGenService();
    // onChangeDataNFTTokenName("");
    onChangeDatasetTitle("");
    onChangeDatasetDescription("");
    handleChangeDataNftCopies(1);
    handleChangeDataNftRoyalties(0);

    setMinRoyalties(0);
    setMaxRoyalties(80);
    setMaxSupply(1);
    setAntiSpamTax(0);
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // S: validation logic

  const onChangeDataNFTStreamUrl = (value: string) => {
    const trimmedValue = value.trim();
    let error = "";

    if (!trimmedValue.startsWith("https://")) {
      error = "Data Stream URL must start with 'https://'";
    } else if (trimmedValue.includes(" ")) {
      error = "Data Stream URL cannot contain spaces";
    } else if (dataNFTStreamPreviewUrl === trimmedValue) {
      error = "Data Stream URL cannot be same as the Data Stream Preview URL";
    } else if (trimmedValue.length > 1000) {
      error = "Length of Data Stream URL cannot exceed 1000";
    } else {
      // temp disable until we work out a better way to do it without CORS errors on 3rd party hosts
      checkUrlReturns200(trimmedValue).then(({ isSuccess, message }) => {
        setDataNFTStreamUrlStatus(message);
      });
    }

    setDataNFTStreamUrlError(error);
    setDataNFTStreamUrl(trimmedValue);
  };

  const onChangeDataNFTStreamPreviewUrl = (value: string) => {
    const trimmedValue = value.trim();
    let error = "";

    if (!trimmedValue.startsWith("https://")) {
      error = "Data Preview URL must start with 'https://'";
    } else if (trimmedValue.includes(" ")) {
      error = "Data Preview URL cannot contain spaces";
    } else if (dataNFTStreamUrl === trimmedValue) {
      error = "Data Preview URL cannot be same as the Data Stream URL";
    } else if (trimmedValue.length > 1000) {
      error = "Length of Data Preview URL cannot exceed 1000";
    } else {
      // temp disable until we work out a better way to do it without CORS errors on 3rd party hosts
      checkUrlReturns200(trimmedValue).then(({ isSuccess, message }) => {
        setDataNFTStreamPreviewUrlStatus(message);
      });
    }

    setDataNFTStreamPreviewUrlError(error);
    setDataNFTStreamPreviewUrl(trimmedValue);
  };

  const onChangeDataNFTImageGenService = () => {
    // Itheum Image Gen Service Check (Data DEX API health check)
    checkUrlReturns200(`${process.env.REACT_APP_ENV_DATADEX_DEVNET_API}/health-check`).then(({ isSuccess, message }) => {
      setDataNFTImgGenService(isSuccess);
    });
  };

  const onChangeDatasetTitle = (value: string) => {
    let error = "";

    if (value.length < 10 || value.length > 60) {
      error = "Length of Dataset Title must be between 10 and 60 characters";
    } else if (!value.match(/^[0-9a-zA-Z\s]+$/)) {
      error = "Dataset Title can only contain alphanumeric characters";
    }

    setDatasetTitleError(error);
    setDatasetTitle(value);
  };

  const onChangeDatasetDescription = (value: string) => {
    let error = "";

    if (value.length < 10 || value.length > 400) {
      error = "Length of Dataset Description must be between 10 and 400 characters";
    }

    setDatasetDescriptionError(error);
    setDatasetDescription(value);
  };

  const handleChangeDataNftCopies = (value: number) => {
    let error = "";
    if (value < 1) {
      error = "Number of copies cannot be negative";
    } else if (maxSupply >= 0 && value > maxSupply) {
      error = `Number of copies cannot exceed ${maxSupply}`;
    }

    setDataNFTCopiesError(error);
    setDataNFTCopies(value);
  };

  const handleChangeDataNftRoyalties = (value: number) => {
    let error = "";
    if (value < 0) {
      error = "Royalties cannot be negative";
    } else if (minRoyalties >= 0 && value < minRoyalties) {
      error = `Royalties cannot be lower than ${minRoyalties}`;
    } else if (maxRoyalties >= 0 && value > maxRoyalties) {
      error = `Royalties cannot be higher than ${maxRoyalties}`;
    }

    setDataNFTRoyaltyError(error);
    setDataNFTRoyalty(value);
  };

  useEffect(() => {
    // init value
    handleChangeDataNftRoyalties(minRoyalties);
  }, [minRoyalties, maxRoyalties]);

  useEffect(() => {
    // init value
    handleChangeDataNftCopies(1);
  }, [maxSupply]);

  useEffect(() => {
    // console.log("dataNFTStreamUrlError ", !!dataNFTStreamUrlError);
    // console.log("dataNFTStreamPreviewUrlError ", !!dataNFTStreamPreviewUrlError);
    // console.log("datasetTitleError ", !!datasetTitleError);
    // console.log("datasetDescriptionError ", !!datasetDescriptionError);
    // console.log("dataNFTCopiesError ", !!dataNFTCopiesError);
    // console.log("dataNFTRoyaltyError ", !!dataNFTRoyaltyError.toString());
    // console.log("dataNFTStreamUrlStatus ", !!dataNFTStreamUrlStatus.toString());
    // console.log("dataNFTStreamPreviewUrlStatus ", !!dataNFTStreamPreviewUrlStatus.toString());
    // console.log("dataNFTImgGenServiceValid ", !dataNFTImgGenServiceValid.toString());
    // console.log("readTermsChecked ", !readTermsChecked.toString());
    // console.log("readAntiSpamFeeChecked ", !readAntiSpamFeeChecked.toString());
    // console.log("minRoyalties ", minRoyalties.toString());
    // console.log("maxRoyalties ", maxRoyalties.toString());
    // console.log("maxSupply ", maxSupply.toString());
    // console.log("antiSpamTax ", antiSpamTax.toString());

    setMintDataNFTDisabled(
      !!dataNFTStreamUrlError ||
        !!dataNFTStreamPreviewUrlError ||
        // !!dataNFTTokenNameError ||
        !!datasetTitleError ||
        !!datasetDescriptionError ||
        !!dataNFTCopiesError ||
        !!dataNFTRoyaltyError ||
        !!dataNFTStreamUrlStatus ||
        !!dataNFTStreamPreviewUrlStatus ||
        // !!dataNFTMarshalServiceStatus ||
        !dataNFTImgGenServiceValid ||
        !readTermsChecked ||
        !readAntiSpamFeeChecked ||
        minRoyalties < 0 ||
        maxRoyalties < 0 ||
        maxSupply < 0 ||
        antiSpamTax < 0
      // itheumBalance < antiSpamTax ||
      // // if userData.contractWhitelistEnabled is true, it means whitelist mode is on; only whitelisted users can mint
      // (!!userData && userData.contractWhitelistEnabled && !userData.userWhitelistedForMint) ||
      // (!!userData && userData.contractPaused) ||
      // (!!userData && Date.now() < userData.lastUserMintTime + userData.mintTimeLimit)
    );
  }, [
    dataNFTStreamUrlError,
    dataNFTStreamPreviewUrlError,
    // dataNFTTokenNameError,
    datasetTitleError,
    datasetDescriptionError,
    dataNFTCopiesError,
    dataNFTRoyaltyError,
    dataNFTStreamUrlStatus,
    dataNFTStreamPreviewUrlStatus,
    // dataNFTMarshalServiceStatus,
    dataNFTImgGenServiceValid,
    readTermsChecked,
    readAntiSpamFeeChecked,
    minRoyalties,
    maxRoyalties,
    maxSupply,
    antiSpamTax,

    itheumBalance,

    userData,
  ]);

  useEffect(() => {
    console.log("******************** LOAD");

    if (searchParams) {
      console.log(searchParams.get("loadDrawer"));
      console.log(searchParams.get("skipPreview"));
      console.log(searchParams.get("dm"));
      console.log(searchParams.get("ds"));

      if (searchParams.get("loadDrawer") && searchParams.get("ds")) {
        getDataForSale(dataCATAccount?.programsAllocation.find((i: any) => i.program === "playstation-gamer-passport"));
        // setDeepLinkMode(true);
      }
    }
  }, [searchParams]);

  // E: validation logic
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const getDataForSale = async (dataCATProgram: any) => {
    let selObj: any;
    let dataCATStreamUrl = "";
    let dataCATStreamPreviewUrl = "";

    if (dataCATProgram?.program) {
      selObj = {
        ...dataCATAccount.programsAllocation.find((i: any) => i.program === dataCATProgram.program),
        ...dataCATAccount._lookups.programs[dataCATProgram.program],
      };

      setCurrDataCATSellObj(selObj);

      if (selObj?.group === "custom") {
        dataCATStreamUrl = selObj.dataStreamURL + `#f=${Date.now()}`;
        dataCATStreamPreviewUrl = selObj.dataPreviewURL;
      } else {
        dataCATStreamUrl = `https://itheumapi.com/readingsStream/${selObj.userId}/${selObj.program}#f=${Date.now()}`;
        dataCATStreamPreviewUrl = `https://itheumapi.com/programReadingPreview/${selObj.program}`;
      }

      if (searchParams.get("ds")) {
        onChangeDataNFTStreamUrl(decodeURIComponent(searchParams.get("ds") || ""));
        setDataNFTStreamUrl(decodeURIComponent(searchParams.get("ds") || ""));
        setValue("dataStreamUrlForm", decodeURIComponent(searchParams.get("ds") || ""));
      } else {
        onChangeDataNFTStreamUrl(dataCATStreamUrl);
        setDataNFTStreamUrl(dataCATStreamUrl);
        setValue("dataStreamUrlForm", dataCATStreamUrl);
      }
      trigger("dataStreamUrlForm");

      // after pre-completed data is set to the corresponding field, we set the value of the Yup form and trigger it so that the data
      // can be validated and the form re-rendered to show the corresponding error message if there is one
      onChangeDataNFTStreamPreviewUrl(dataCATStreamPreviewUrl); //validate the url so we can know if we should disable the button or not.
      setDataNFTStreamPreviewUrl(dataCATStreamPreviewUrl);
      setValue("dataPreviewUrlForm", dataCATStreamPreviewUrl);
      trigger("dataPreviewUrlForm");

      onChangeDatasetDescription(selObj.description);
      setValue("datasetDescriptionForm", selObj.description);
      trigger("datasetDescriptionForm");
      if (selObj.title) {
        onChangeDatasetTitle(selObj.title);
        setValue("datasetTitleForm", selObj.title);
        trigger("datasetTitleForm");
      }
    }

    setIsStreamTrade(isStreamTrade);
    onOpenDrawerTradeStream();
  };

  const dataNFTSellSubmit = async () => {
    if (!_chainMeta.loggedInAddress) {
      toast({
        title: labels.ERR_MINT_FORM_NO_WALLET_CONN,
        status: "error",
        isClosable: true,
        duration: 20000,
      });
      return;
    }

    const res = await validateBaseInput();

    if (res) {
      setErrDataNFTStreamGeneric(null);
      dataNFTDataStreamAdvertise();
    }
  };

  const dataNFTDataStreamAdvertise = async () => {
    /*
      1) Call the data marshal and get a encrypted data stream url and hash of url (s1)
      2) Use the hash for to generate the gen img URL from the generative API (s2)
        2.1) Save the new generative image to IPFS and get it's IPFS url (s3)
      3) Mint the SFT via the Minter Contract (s4)
    */

    setMintingSuccessful(false);
    onProgressModalOpen();

    try {
      setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s1: 1 }));

      buildUniqueImage({
        dataNFTHash: btoa(dataNFTStreamUrl),
      });
    } catch (e) {
      setErrDataNFTStreamGeneric(e);
    }
  };

  const buildUniqueImage = async ({ dataNFTHash }: { dataNFTHash: any }) => {
    await sleep(3);
    const newNFTImg = `${process.env.REACT_APP_ENV_DATADEX_DEVNET_API}/v1/generateNFTArt?hash=${dataNFTHash}`;

    setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s2: 1 }));

    let res;

    try {
      // catch IPFS error
      const { traits } = await createFileFromUrl(newNFTImg);

      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_ENV_NFT_STORAGE_KEY || "",
      });

      res = await nftstorage.storeDirectory([traits]);
    } catch (e) {
      setErrDataNFTStreamGeneric(new Error(labels.ERR_MINT_FORM_NFT_IMG_GEN_AND_STORAGE_CATCH_HIT));
      return;
    }

    if (!res) {
      setErrDataNFTStreamGeneric(new Error(labels.ERR_MINT_FORM_NFT_IMG_GEN_ISSUE));
      return;
    }

    // const imageOnIpfsUrl = `https://ipfs.io/ipfs/${res}/image.png`;
    const metadataOnIpfsUrl = `https://ipfs.io/ipfs/${res}/metadata.json`;

    setDataNFTImg(newNFTImg);
    setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s3: 1 }));

    await sleep(3);

    web3_handleOnChainMint({ metadataOnIpfsUrl });
    // web3_handleOnChainMint({ metadataOnIpfsUrl: 'https://bafkreig3i2east7rum5h4ysz7t3r2ia3jxmj7qcxz7fveu7utogqtcefwy.ipfs.nftstorage.link' });
  };

  const web3_handleOnChainMint = async (params: any) => {
    try {
      const web3Signer = _chainMeta.ethersProvider.getSigner();
      const dnftContract = new ethers.Contract(_chainMeta.contracts.dnft, ABIS.dNFT, web3Signer);

      const _uri = params.metadataOnIpfsUrl;
      const _priceInItheum = prices[0];
      const _royaltyInPercent = dataNFTRoyalty || 0;
      const _secondaryTradeable = secondaryTradeable;

      const decimals = 18;
      const priceInPrecision = ethers.utils.parseUnits(`${_priceInItheum}.0`, decimals).toHexString();
      const txResponse = await dnftContract.createDataNFT(_uri, priceInPrecision, _royaltyInPercent, _secondaryTradeable);

      // show a nice loading animation to user
      setTxNFTHash(`https://shibuya.subscan.io/tx/${txResponse.hash}`);

      await sleep(2);

      setTxNFTConfirmation(40);

      // wait for 1 confirmation from ethers
      const txReceipt = await txResponse.wait();

      setTxNFTConfirmation(60);

      await sleep(2);

      if (txReceipt.status) {
        setTxNFTConfirmation(80);

        // get tokenId
        const event = txReceipt.events.find((event: any) => event.event === "Transfer");
        const [, , tokenId] = event.args;

        setNewNFTId(tokenId.toString());

        // setNewNFTId(receipt.events.Transfer.returnValues.tokenId);

        setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s4: 1 }));

        await sleep(3);

        setTxNFTConfirmation(100);

        setMintingSuccessful(true);
      } else {
        const txErr = new Error("NFT Contract Error on method createDataNFT");
        console.error(txErr);

        setErrDataNFTStreamGeneric(txErr);
      }
    } catch (e) {
      console.error(e);
      setErrDataNFTStreamGeneric(e);
    }
  };

  async function createFileFromUrl(imgUrl: string) {
    const res = await fetch(imgUrl);
    // const data = await res.blob();
    // const _imageFile = new File([data], "image.png", { type: "image/png" });
    const traits = createIpfsMetadata(res.headers.get("x-nft-traits") || "", imgUrl);
    const _traitsFile = new File([JSON.stringify(traits)], "metadata.json", { type: "application/json" });
    // return { image: _imageFile, traits: _traitsFile };
    return { traits: _traitsFile };
  }

  function createIpfsMetadata(traits: string, imgUrl: string) {
    /*
      {
      "name": "Cat Marshal EVM", DONE
      "description": "Car Marshal has moved to EVM chains",
      "image": "https://ipfs.io/ipfs/bafybeifp2jlgl5y4glh7xto4nqahyr2dz5upwhlwnmrwrdceggii4lrhue/image.png",
      "external_url": "https://datadex.itheum.io",
      "attributes": [
      {
        "trait_type": "Shadow",
        "value": "RectangleTeal"
      },
      {
        "trait_type": "Frame",
        "value": "RectangleBlue"
      },
      {
        "trait_type": "Base",
        "value": "Teal"
      },
      {
        "trait_type": "Shape",
        "value": "ConePink"
      },
      {
        "trait_type": "Badge",
        "value": "Shield"
      },
      {
        "trait_type": "BG",
        "value": "Circuit"
      },
      {
        "trait_type": "Data Preview URL",
        "value": "https://raw.githubusercontent.com/Itheum/data-assets/main/Health/H1__Signs_of_Anxiety_in_American_Households_due_to_Covid19/preview.json"
      }
      ]
      }
      */
    const metadata = {
      name: datasetTitle,
      description: datasetDescription,
      image: imgUrl,
      attributes: [] as object[],
    };

    const attributes = traits.split(",").filter((element) => element.trim() !== "");
    const metadataAttributes = [];

    for (const attribute of attributes) {
      const [key, value] = attribute.split(":");
      const trait = { trait_type: key.trim(), value: value.trim() };
      metadataAttributes.push(trait);
    }

    metadataAttributes.push({ trait_type: "Data Stream URL", value: dataNFTStreamUrl });
    metadataAttributes.push({ trait_type: "Data Preview URL", value: dataNFTStreamPreviewUrl });
    metadataAttributes.push({ trait_type: "Creator", value: _chainMeta.loggedInAddress });
    metadata.attributes = metadataAttributes;

    return metadata;
  }

  const closeProgressModal = () => {
    if (mintingSuccessful) {
      toast({
        title: 'Success! Data NFT Minted. Head over to your "Data NFT Wallet" to view your new NFT',
        status: "success",
        isClosable: true,
      });

      onCloseDrawerTradeStream();

      // remount the component (quick way to rest all state to pristine)
      onRfMount();
    }

    onProgressModalClose();

    // re-initialize modal status
    setSaveProgress({ s1: 0, s2: 0, s3: 0, s4: 0 });
    setMintingSuccessful(false);
    setDataNFTImg("");
    setTxNFTHash(null);
    setTxNFTConfirmation(0);
  };

  function validateBaseInput() {
    if (!dataNFTStreamUrl.includes("https://") || !dataNFTStreamPreviewUrl.includes("https://")) {
      toast({
        title: labels.ERR_URL_MISSING_HTTPS,
        status: "error",
        isClosable: true,
        duration: 20000,
      });
      return true;
    } else {
      return true;
    }
  }

  const validateDataStreamUrl = (value: string) => {
    if (value.includes("https://drive.google.com")) {
      setDataStreamUrlValidation(true);
    } else {
      setDataStreamUrlValidation(false);
    }
  };

  const validateDataPreviewUrl = (value: string) => {
    if (value.includes("https://drive.google.com")) {
      setDataPreviewUrlValidation(true);
    } else {
      setDataPreviewUrlValidation(false);
    }
  };

  let gradientBorderForTrade = styleStrings.gradientBorderMulticolorToBottomRight;
  let gradientBorderCards = styleStrings.gradientBorderMulticolor;

  if (colorMode === "light") {
    gradientBorderForTrade = styleStrings.gradientBorderMulticolorToBottomRightLight;
    gradientBorderCards = styleStrings.gradientBorderMulticolorLight;
  }

  return (
    <>
      <Stack mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
        <Heading size="xl" fontWeight="medium">
          Trade Your Data
        </Heading>
        <Heading size="1rem" opacity=".7" fontWeight="light">
          Connect, mint and trade your datasets as Data NFTs in our Data NFT Marketplace
        </Heading>

        <Wrap shouldWrapChildren={true} spacing={5}>
          <Box
            maxW="xs"
            overflow="hidden"
            mt={5}
            border=".01rem solid transparent"
            backgroundColor="none"
            borderRadius="0.75rem"
            style={{ "background": gradientBorderForTrade }}>
            <Image src="https://itheum-static.s3.ap-southeast-2.amazonaws.com/data-stream.png" alt="" rounded="lg" />

            <Box p="6">
              <Box display="flex" alignItems="baseline">
                <Box mt="1" fontWeight="semibold" as="h4" lineHeight="tight" noOfLines={1}>
                  Any Data Stream as Data NFT-FT
                </Box>
              </Box>
              <Button mt="3" colorScheme="teal" variant="outline" borderRadius="xl" onClick={() => getDataForSale(null)}>
                <Text color={colorMode === "dark" ? "white" : "black"}>Advertise Data</Text>
              </Button>
            </Box>
          </Box>
        </Wrap>

        {dataCATAccount?.programsAllocation?.length > 0 && (
          <>
            <Heading size="lg" fontWeight="semibold" marginTop="6rem !important">
              Supported Data CAT Programs
            </Heading>
            <Heading size="sm" opacity=".7" fontWeight="normal" marginBottom="5 !important">
              Join a community built app and earn rewards if you trade your data
            </Heading>
            <Wrap shouldWrapChildren={true} spacingX={5}>
              {dataCATAccount.programsAllocation.map((item: any) => (
                <Box
                  key={item.program}
                  maxW="22.4rem"
                  borderWidth="1px"
                  overflow="hidden"
                  border=".1rem solid transparent"
                  backgroundColor="none"
                  borderRadius="1.5rem">
                  <Image
                    src={`https://itheum-static.s3-ap-southeast-2.amazonaws.com/dex-${dataCATAccount._lookups.programs[item.program].img}.png`}
                    alt=""
                    border=".1rem solid transparent"
                    height="13.375rem"
                    borderRadius="1.5rem"
                    style={{ "background": gradientBorderCards }}
                  />

                  <Box paddingTop="6" paddingBottom="2">
                    <Box display="flex" alignItems="center">
                      <Badge borderRadius="sm" px="2" py="0.08rem" colorScheme="teal">
                        {" "}
                        New
                      </Badge>
                      <Box ml="2" fontWeight="semibold" lineHeight="tight" fontSize="2xl" noOfLines={1}>
                        {dataCATAccount._lookups.programs[item.program].programName}
                      </Box>
                    </Box>
                    <Button mt="2" colorScheme="teal" variant="outline" borderRadius="xl" onClick={() => getDataForSale(item)}>
                      <Text color={colorMode === "dark" ? "white" : "black"}>Trade Program Data</Text>
                    </Button>
                  </Box>
                </Box>
              ))}
            </Wrap>
          </>
        )}

        <Drawer onClose={onRfMount} isOpen={isDrawerOpenTradeStream} size="xl" closeOnEsc={false} closeOnOverlayClick={false}>
          <ModalOverlay bg="#181818e0">
            <DrawerContent bg="#181818">
              <DrawerHeader>
                <HStack spacing="5">
                  <CloseButton
                    size="lg"
                    onClick={() => {
                      setSearchParams(); // clear any deep link search params
                      onRfMount();
                    }}
                  />
                  {(currDataCATSellObj && (
                    <Stack>
                      <Box fontSize="2xl">
                        Trade data from your{" "}
                        <Text color="teal.200" fontSize="2xl">
                          {currDataCATSellObj.programName}
                        </Text>{" "}
                        program as a Data NFT-FT
                      </Box>
                    </Stack>
                  )) || (
                    <Heading as="h4" size="lg">
                      Trade a Data Stream as a Data NFT-FT
                    </Heading>
                  )}
                </HStack>
              </DrawerHeader>
              <DrawerBody
                onClick={() => {
                  if (!userFocusedForm) {
                    setUserFocusedForm(true);
                  }
                }}>
                <Stack spacing="5" mt="5">
                  {(minRoyalties < 0 ||
                    maxRoyalties < 0 ||
                    maxSupply < 0 ||
                    antiSpamTax < 0 ||
                    !dataNFTImgGenServiceValid ||
                    (!!userData && userData.contractWhitelistEnabled && !userData.userWhitelistedForMint) ||
                    (!!userData && userData.contractPaused)) && (
                    <Alert status="error">
                      <Stack>
                        <AlertTitle fontSize="md" mb={2}>
                          <AlertIcon display="inline-block" />
                          <Text display="inline-block" lineHeight="2" style={{ verticalAlign: "middle" }}>
                            Uptime Errors
                          </Text>
                        </AlertTitle>
                        <AlertDescription>
                          {minRoyalties < 0 && <Text fontSize="md">Unable to read default value of Min Royalties.</Text>}
                          {maxRoyalties < 0 && <Text fontSize="md">Unable to read default value of Max Royalties.</Text>}
                          {maxSupply < 0 && <Text fontSize="md">Unable to read default value of Max Supply.</Text>}
                          {antiSpamTax < 0 && <Text fontSize="md">Unable to read default value of Anti-Spam Tax.</Text>}
                          {!dataNFTImgGenServiceValid && <Text fontSize="md">Generative image generation service is not responding.</Text>}
                          {!!userData && userData.contractWhitelistEnabled && !userData.userWhitelistedForMint && (
                            <AlertDescription fontSize="md">You are not currently whitelisted to mint Data NFTs</AlertDescription>
                          )}
                          {!!userData && userData.contractPaused && <Text fontSize="md">The minter smart contract is paused for maintenance.</Text>}
                        </AlertDescription>
                      </Stack>
                    </Alert>
                  )}

                  {!!userData && Date.now() < userData.lastUserMintTime + userData.mintTimeLimit && (
                    <Alert status="error">
                      <Stack>
                        <AlertTitle fontSize="md" mb={2}>
                          <AlertIcon display="inline-block" />
                          <Text display="inline-block" lineHeight="2" style={{ verticalAlign: "middle" }}>
                            Alerts
                          </Text>
                        </AlertTitle>
                        <AlertDescription>
                          {!!userData && Date.now() < userData.lastUserMintTime + userData.mintTimeLimit && (
                            <Text fontSize="md">{`There is a time interval enforced between mints. You can mint your next Data NFT-FT after ${new Date(
                              userData.lastUserMintTime + userData.mintTimeLimit
                            ).toLocaleString()}`}</Text>
                          )}
                        </AlertDescription>
                      </Stack>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Text fontSize="sm" color="gray.400">
                      * required fields
                    </Text>
                    <Text fontSize="sm" color="gray.400" mt="0 !important">
                      + click on an item&apos;s title to learn more
                    </Text>

                    {!deepLinkMode && (
                      <Stack spacing="3">
                        <Text fontWeight="bold" color="teal.200" fontSize="xl" mt="8 !important">
                          Data Asset Detail
                        </Text>

                        <FormControl isInvalid={!!errors.dataStreamUrlForm}>
                          <InputLabelWithPopover tkey="data-stream-url">
                            <Text fontWeight="bold" fontSize="md">
                              Data Stream URL *
                            </Text>
                          </InputLabelWithPopover>

                          <Controller
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <Input
                                mt="1 !important"
                                placeholder="e.g. https://mydomain.com/my_hosted_file.json"
                                id="dataStreamUrlForm"
                                isDisabled={!!currDataCATSellObj}
                                value={dataNFTStreamUrl}
                                onChange={(event) => {
                                  onChange(event.target.value);
                                  onChangeDataNFTStreamUrl(event.currentTarget.value);
                                  validateDataStreamUrl(event.currentTarget.value);
                                }}
                              />
                            )}
                            name={"dataStreamUrlForm"}
                          />
                          <FormErrorMessage>{errors?.dataStreamUrlForm?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.dataPreviewUrlForm}>
                          <InputLabelWithPopover tkey="data-preview-url">
                            <Text fontWeight="bold" fontSize="md" mt={1}>
                              Data Preview URL *
                            </Text>
                          </InputLabelWithPopover>

                          <Controller
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <Input
                                mt="1 !important"
                                placeholder="e.g. https://mydomain.com/my_hosted_file_preview.json"
                                id="dataPreviewUrlForm"
                                isDisabled={!!currDataCATSellObj}
                                value={dataNFTStreamPreviewUrl}
                                onChange={(event) => {
                                  onChange(event.target.value);
                                  onChangeDataNFTStreamPreviewUrl(event.currentTarget.value);
                                  validateDataPreviewUrl(event.currentTarget.value);
                                }}
                              />
                            )}
                            name="dataPreviewUrlForm"
                          />
                          <FormErrorMessage>{errors?.dataPreviewUrlForm?.message}</FormErrorMessage>

                          {currDataCATSellObj && (
                            <Link fontSize="sm" href={dataNFTStreamPreviewUrl} isExternal>
                              View Preview Data <ExternalLinkIcon mx="2px" />
                            </Link>
                          )}
                        </FormControl>
                      </Stack>
                    )}

                    <Stack spacing="3">
                      <Text fontWeight="bold" color="teal.200" fontSize="xl" mt="8 !important">
                        NFT Token Metadata
                      </Text>

                      <FormControl isInvalid={!!errors.datasetTitleForm}>
                        <InputLabelWithPopover tkey="dataset-title">
                          <Text fontWeight="bold" fontSize="md" mt={1}>
                            Dataset Title *
                          </Text>
                        </InputLabelWithPopover>

                        <Controller
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Input
                              mt="1 !important"
                              placeholder="Between 10 and 60 alphanumeric characters only"
                              id="datasetTitleForm"
                              value={datasetTitle}
                              onChange={(event) => {
                                onChange(event.target.value);
                                onChangeDatasetTitle(event.currentTarget.value);
                              }}
                            />
                          )}
                          name="datasetTitleForm"
                        />
                        <FormErrorMessage>{errors?.datasetTitleForm?.message}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.datasetDescriptionForm}>
                        <InputLabelWithPopover tkey="dataset-description">
                          <Text fontWeight="bold" fontSize="md" mt={1}>
                            Dataset Description *
                          </Text>
                        </InputLabelWithPopover>

                        <Controller
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Textarea
                              mt="1 !important"
                              placeholder="Between 10 and 400 characters only. URL allowed."
                              id={"datasetDescriptionForm"}
                              value={datasetDescription}
                              onChange={(event) => {
                                onChange(event.target.value);
                                onChangeDatasetDescription(event.currentTarget.value);
                              }}
                            />
                          )}
                          name="datasetDescriptionForm"
                        />
                        <FormErrorMessage>{errors?.datasetDescriptionForm?.message}</FormErrorMessage>
                      </FormControl>

                      {/* <FormControl isInvalid={!!errors.numberOfCopiesForm}>
                        <InputLabelWithPopover tkey="number-of-copies">
                          <Text fontWeight="bold" fontSize="md" mt={1}>
                            Number of copies
                          </Text>
                        </InputLabelWithPopover>

                        <Controller
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <NumberInput
                              mt="1 !important"
                              size="md"
                              id="numberOfCopiesForm"
                              maxW={24}
                              step={1}
                              defaultValue={1}
                              min={1}
                              value={dataNFTCopies}
                              max={maxSupply > 0 ? maxSupply : 1}
                              isValidCharacter={isValidNumericCharacter}
                              onChange={(valueAsString: string) => {
                                onChange(valueAsString);
                                handleChangeDataNftCopies(Number(valueAsString));
                              }}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          )}
                          name="numberOfCopiesForm"
                        />
                        <FormErrorMessage>{errors?.numberOfCopiesForm?.message}</FormErrorMessage>
                      </FormControl>
                      <Text color="gray.400" fontSize="sm" mt="1 !important">
                        Limit the quality to increase value (rarity) - Suggested: less than {maxSupply}
                      </Text> */}

                      <FormControl isInvalid={!!errors.royaltiesForm}>
                        <InputLabelWithPopover tkey="royalties">
                          <Text fontWeight="bold" fontSize="md">
                            Royalties
                          </Text>
                        </InputLabelWithPopover>

                        <Controller
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <NumberInput
                              mt="1 !important"
                              size="md"
                              id="royaltiesForm"
                              maxW={24}
                              step={5}
                              defaultValue={minRoyalties}
                              min={minRoyalties > 0 ? minRoyalties : 0}
                              max={maxRoyalties > 0 ? maxRoyalties : 0}
                              isValidCharacter={isValidNumericCharacter}
                              onChange={(valueAsString: string) => {
                                onChange(valueAsString);
                                handleChangeDataNftRoyalties(Number(valueAsString));
                              }}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          )}
                          name="royaltiesForm"
                        />
                        <FormErrorMessage>{errors?.royaltiesForm?.message}</FormErrorMessage>
                      </FormControl>
                      <Text color="gray.400" fontSize="sm" mt="1 !important">
                        Min: {minRoyalties >= 0 ? minRoyalties : "-"}%, Max: {maxRoyalties >= 0 ? maxRoyalties : "-"}%
                      </Text>

                      <Box>
                        <Text mt="10px" fontWeight="bold" fontSize="md">
                          List on Data NFT marketplace for an unlock fee of
                        </Text>
                        <HStack>
                          <NumberInput
                            mt="1 !important"
                            size="md"
                            maxW={24}
                            step={5}
                            min={10}
                            isValidCharacter={isValidNumericCharacter}
                            max={100}
                            value={prices[0]}
                            onChange={(valueString, valueAsNumber) => {
                              let error = "";
                              if (valueAsNumber < 10) error = "Cannot be less than minimum listing fee";
                              if (valueAsNumber > 100) error = "Cannot exceed maximum listing fee";
                              setPriceErrors((oldErrors) => {
                                const newErrors = [...oldErrors];
                                newErrors[0] = error;
                                return newErrors;
                              });
                              setPrices((oldPrices) => {
                                const newPrices = [...oldPrices];
                                newPrices[0] = !valueAsNumber ? 0 : valueAsNumber;
                                return newPrices;
                              });
                            }}
                            keepWithinRange={true}>
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <Text> $ITHEUM</Text>
                        </HStack>
                        {priceErrors[0] && (
                          <Text color="red.400" fontSize="xs">
                            {priceErrors[0]}
                          </Text>
                        )}
                      </Box>

                      <Box mt="5">
                        <Text fontWeight="bold" color="teal.200" fontSize="xl" mt="8 !important">
                          Do you want this Data NFT tradable in 3rd Party NFT Marketplaces?
                        </Text>
                        <Text fontSize="md" mt="4 !important">
                          You can trade Data NFTs in all 3rd Party Marketplaces as Data NFTs are just regular NFTs with Data Streams attached to them. But doing
                          so has some risks to you as a Data Creator,{" "}
                          <b>the main risk being that there is no guarantee that you will get your creator royalty payments if your Data NFT is re-traded.</b>{" "}
                          If you are uncomfortable with this, we recommend you keep turned this off to ensure your Data NFT is only tradable in {`Itheum's`}{" "}
                          Data NFT Marketplace, where your creator royalties will ALWAYS be paid to you.
                        </Text>
                        <Text fontWeight="bold" mt="5">
                          Make externally tradable on 3rd party marketplaces (like OpenSea)
                        </Text>
                        <Switch
                          mt="10px"
                          colorScheme="teal"
                          size="lg"
                          isChecked={secondaryTradeable}
                          onChange={(e) => setSecondaryTradeable(e.target.checked)}
                        />
                      </Box>
                    </Stack>

                    <Box>
                      <Text fontWeight="bold" color="teal.200" fontSize="xl" mt="8 !important">
                        Terms and Fees
                      </Text>

                      <Text fontSize="md" mt="4 !important">
                        Minting a Data NFT and putting it for trade on the Data DEX means you have to agree to some strict “terms of use”, as an example, you
                        agree that the data is free of any illegal material and that it does not breach any copyright laws. You also agree to make sure the Data
                        Stream URL is always online. Given it&apos;s an NFT, you also have limitations like not being able to update the title, description,
                        royalty, etc. But there are other conditions too. Take some time to read these “terms of use” before you proceed and it&apos;s critical
                        you understand the terms of use before proceeding.
                      </Text>

                      <Flex mt="3 !important">
                        <Button colorScheme="teal" variant="outline" size="sm" onClick={() => window.open("https://itheum.com/legal/datadex/termsofuse")}>
                          Read Terms of Use
                        </Button>
                      </Flex>

                      <Checkbox size="md" mt="3 !important" isChecked={readTermsChecked} onChange={(e) => setReadTermsChecked(e.target.checked)}>
                        I have read and I agree to the Terms of Use
                      </Checkbox>

                      {userFocusedForm && !readTermsChecked && (
                        <Text color="red.400" fontSize="sm" mt="1 !important">
                          Please read and agree to terms of use.
                        </Text>
                      )}

                      <Text fontSize="md" mt="8 !important">
                        An “anti-spam fee” is required to ensure that the Data DEX does not get impacted by spam datasets created by bad actors. This fee will
                        be dynamically adjusted by the protocol based on ongoing dataset curation discovery by the Itheum DAO.
                      </Text>

                      <Box mt="3 !important">
                        <Tag variant="solid" colorScheme="teal">
                          Anti-Spam Fee is currently {antiSpamTax < 0 ? "?" : antiSpamTax} ITHEUM tokens
                        </Tag>
                      </Box>

                      {itheumBalance < antiSpamTax && (
                        <Text color="red.400" fontSize="sm" mt="1 !important">
                          You don&apos;t have enough ITHEUM for Anti-Spam Tax
                        </Text>
                      )}

                      <Checkbox size="md" mt="3 !important" isChecked={readAntiSpamFeeChecked} onChange={(e) => setReadAntiSpamFeeChecked(e.target.checked)}>
                        I accept the deduction of the anti-spam minting fee from my wallet
                      </Checkbox>

                      {userFocusedForm && !readAntiSpamFeeChecked && (
                        <Text color="red.400" fontSize="sm" mt="1 !important">
                          You need to agree to anti-spam deduction to mint
                        </Text>
                      )}
                    </Box>

                    <Flex>
                      <ChainSupportedInput feature={MENU.SELL}>
                        <Button mt="5" colorScheme="teal" isLoading={isProgressModalOpen} onClick={dataNFTSellSubmit} isDisabled={mintDataNFTDisabled}>
                          Mint Your Data NFT
                        </Button>
                      </ChainSupportedInput>
                    </Flex>
                  </form>
                </Stack>
                <Modal isOpen={isProgressModalOpen} onClose={closeProgressModal} closeOnEsc={false} closeOnOverlayClick={false}>
                  <ModalOverlay>
                    <ModalContent bg="#181818">
                      <ModalHeader>Data NFT Minting Progress</ModalHeader>
                      {!!errDataNFTStreamGeneric && <ModalCloseButton />}
                      <ModalBody pb={6}>
                        <Stack spacing={5}>
                          <HStack>
                            {(!saveProgress.s1 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                            <Text>Generating encrypted data stream metadata</Text>
                          </HStack>

                          <HStack>
                            {(!saveProgress.s2 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                            <Text>Generating unique tamper-proof data stream signature</Text>
                          </HStack>

                          {dataNFTImg && (
                            <>
                              <Skeleton isLoaded={oneNFTImgLoaded} h={200} margin="auto">
                                <Center>
                                  <Image src={dataNFTImg} h={200} w={200} borderRadius="md" onLoad={() => setOneNFTImgLoaded(true)} />
                                </Center>
                              </Skeleton>
                              <Box textAlign="center">
                                <Text fontSize="xs">This image was created using the unique data signature (it&apos;s one of a kind!)</Text>
                              </Box>
                            </>
                          )}

                          <HStack>
                            {(!saveProgress.s3 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                            <Text>Saving NFT Metadata to IPFS</Text>
                          </HStack>

                          <HStack>
                            {(!saveProgress.s4 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                            <Text>Minting your new Data NFT on blockchain</Text>
                          </HStack>

                          <Stack>
                            {txNFTHash && (
                              <Link fontSize="sm" href={txNFTHash} isExternal>
                                View On-Chain TX <ExternalLinkIcon mx="2px" />
                              </Link>
                            )}

                            {txNFTConfirmation && (
                              <Box>
                                <Progress isAnimated={true} colorScheme="teal" hasStripe value={txNFTConfirmation} />
                              </Box>
                            )}
                          </Stack>

                          {mintingSuccessful && (
                            <Box textAlign="center" mt="6">
                              <Alert status="success">
                                <Text colorScheme="teal">Success! Your Data NFT has been minted on the Astar Network Blockchain</Text>
                              </Alert>
                              <HStack mt="4">
                                <Button
                                  colorScheme="teal"
                                  onClick={() => {
                                    setMenuItem(MENU.NFTMINE);
                                    navigate("/datanfts/wallet");
                                  }}>
                                  Visit your Data NFT Wallet to see it!
                                </Button>
                                <Button colorScheme="teal" variant="outline" onClick={closeProgressModal}>
                                  Close & Return
                                </Button>
                              </HStack>
                            </Box>
                          )}

                          {errDataNFTStreamGeneric && (
                            <Alert status="error">
                              <Stack>
                                <AlertTitle fontSize="md">
                                  <AlertIcon mb={2} />
                                  Process Error
                                </AlertTitle>
                                {errDataNFTStreamGeneric.message && <AlertDescription fontSize="md">{errDataNFTStreamGeneric.message}</AlertDescription>}
                                <CloseButton position="absolute" right="8px" top="8px" onClick={() => closeProgressModal()} />
                              </Stack>
                            </Alert>
                          )}
                        </Stack>
                      </ModalBody>
                    </ModalContent>
                  </ModalOverlay>
                </Modal>
              </DrawerBody>
            </DrawerContent>
          </ModalOverlay>
        </Drawer>
      </Stack>
    </>
  );
}
