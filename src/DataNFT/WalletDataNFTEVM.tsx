import React, { useState, useEffect } from "react";
import { CheckCircleIcon, ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Link,
  Image,
  Flex,
  Skeleton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Badge,
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  useDisclosure,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CloseButton,
  ModalCloseButton,
  Spinner,
  useColorMode,
  Switch,
  Spacer,
  useBreakpointValue,
  Tooltip,
  Progress,
} from "@chakra-ui/react";
import { useGetAccountInfo, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import imgGuidePopup from "img/guide-unblock-popups.png";
import { useLocalStorage } from "libs/hooks";
import { labels } from "libs/language";
import { CHAIN_TX_VIEWER, uxConfig, isValidNumericCharacter, sleep, styleStrings, itheumTokenRoundUtilExtended } from "libs/util";
import { transformDescription } from "libs/util2";
import { getItheumPriceFromApi } from "MultiversX/api";
import { DataNftMarketContract } from "MultiversX/dataNftMarket";
import { DataNftMintContract } from "MultiversX/dataNftMint";
import { DataNftType } from "MultiversX/typesEVM";
import { useChainMeta } from "store/ChainMetaContext";
import ShortAddress from "UtilComps/ShortAddress";
import ListDataNFTModal from "./ListDataNFTModal";
import blueTickIcon from "img/creator-verified.png";
import { useConnectWallet } from "@web3-onboard/react";

import { ethers } from "ethers";
import { ABIS } from "../EVM/ABIs";

export type WalletDataNFTMxPropType = {
  hasLoaded: boolean;
  maxPayment: number;
  userData: any;
  setHasLoaded: (hasLoaded: boolean) => void;
  sellerFee: number;
  openNftDetailsDrawer: (e: number) => void;
} & DataNftType;

export default function WalletDataNFTMX(item: WalletDataNFTMxPropType) {
  const { colorMode } = useColorMode();
  const { chainMeta: _chainMeta } = useChainMeta();
  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const toast = useToast();
  const { isOpen: isAccessProgressModalOpen, onOpen: onAccessProgressModalOpen, onClose: onAccessProgressModalClose } = useDisclosure();
  const [unlockAccessProgress, setUnlockAccessProgress] = useState({
    s1: 0,
    s2: 0,
    s3: 0,
  });
  const [errUnlockAccessGeneric, setErrUnlockAccessGeneric] = useState<string>("");
  const [walletUsedSession] = useLocalStorage("itm-wallet-used", null);
  const [burnNFTModalState, setBurnNFTModalState] = useState(1); // 1 and 2
  const mintContract = new DataNftMintContract(_chainMeta.networkId);
  const marketContract = new DataNftMarketContract(_chainMeta.networkId);
  const [dataNftBurnAmount, setDataNftBurnAmount] = useState(1);
  const [dataNftBurnAmountError, setDataNftBurnAmountError] = useState("");
  const [selectedDataNft, setSelectedDataNft] = useState<DataNftType | undefined>();
  const { isOpen: isBurnNFTOpen, onOpen: onBurnNFTOpen, onClose: onBurnNFTClose } = useDisclosure();
  const { isOpen: isListNFTOpen, onOpen: onListNFTOpen, onClose: onListNFTClose } = useDisclosure();
  const [amount, setAmount] = useState(1);
  const [amountError, setAmountError] = useState("");
  const [price, setPrice] = useState(10);
  const [priceError, setPriceError] = useState("");
  const [itheumPrice, setItheumPrice] = useState<number | undefined>();

  const [istradeable, setIstradeable] = useState(false);
  const [isTransferable, setIsTransferable] = useState(false);
  const [isUpdatetradeableDisabled, setIsUpdatetradeableDisabled] = useState(true);
  const [isUpdateTransferableDisabled, setIsUpdateTransferableDisabled] = useState(true);
  const modelSize = useBreakpointValue({ base: "xs", md: "xl" });
  const { isOpen: isUpdateModalOpen, onOpen: onUpdateModalOpen, onClose: onUpdateModalClose } = useDisclosure();
  const [updatePropertyWorking, setUpdatePropertyWorking] = useState(false);
  const [txConfirmationUpdateProperty, setTxConfirmationUpdateProperty] = useState(0);
  const [txHashUpdateProperty, setTxHashUpdateProperty] = useState<string>("");
  const [txErrorUpdateProperty, setTxErrorUpdateProperty] = useState<any | null>(null);
  const [nftImageLoaded, setNftImageLoaded] = useState(false);

  useEffect(() => {
    if (txErrorUpdateProperty) {
      setUpdatePropertyWorking(false);
    } else {
      if (txHashUpdateProperty && txConfirmationUpdateProperty === 100) {
        toast({
          title: `Congrats! You have succesfully updated the property!`,
          status: "success",
          duration: 6000,
          isClosable: true,
        });

        resetUpdatePropertyState();
        onUpdateModalClose();
      }
    }
  }, [txConfirmationUpdateProperty, txHashUpdateProperty, txErrorUpdateProperty]);

  const web3_updateProperty = async (propertyWantedToUpdate: string) => {
    setUpdatePropertyWorking(true);

    const web3Signer = _chainMeta.ethersProvider.getSigner();
    const dnftContract = new ethers.Contract(_chainMeta.contracts.dnft, ABIS.dNFT, web3Signer);

    try {
      const txResponse =
        propertyWantedToUpdate === "tradeable"
          ? await dnftContract.setDataNFTSecondaryTradeable(item.id, !item.secondaryTradeable) // tradeable
          : await dnftContract.setDataNFTTransferable(item.id, !item.transferable); // Transferable

      // show a nice loading animation to user
      setTxHashUpdateProperty(`https://shibuya.subscan.io/tx/${txResponse.hash}`);

      await sleep(2);
      setTxConfirmationUpdateProperty(40);

      // wait for 1 confirmation from ethers
      const txReceipt = await txResponse.wait();

      setTxConfirmationUpdateProperty(60);
      await sleep(2);

      if (txReceipt.status) {
        propertyWantedToUpdate === "tradeable" ? setIsUpdatetradeableDisabled(true) : setIsUpdateTransferableDisabled(true);

        setTxConfirmationUpdateProperty(100);
      } else {
        const txErr = new Error(
          `Data NFT Contract Error on method ${propertyWantedToUpdate === "tradeable" ? "setDataNFTSecondaryTradeable" : "setDataNFTTransferable"}`
        );
        setTxErrorUpdateProperty(txErr);
      }
    } catch (e) {
      console.log(e);

      setTxErrorUpdateProperty(e);
    }
  };

  function resetUpdatePropertyState() {
    setUpdatePropertyWorking(false);
    setTxConfirmationUpdateProperty(0);
    setTxHashUpdateProperty("");
    setTxErrorUpdateProperty(null);
  }

  const handleToggletradeable = () => {
    setIstradeable(!istradeable);
    setIsUpdatetradeableDisabled(!isUpdatetradeableDisabled);
  };
  const handleToggleTransferable = () => {
    setIsTransferable(!isTransferable);
    setIsUpdateTransferableDisabled(!isUpdateTransferableDisabled);
  };
  useEffect(() => {
    item.secondaryTradeable === 1 ? setIstradeable(true) : setIstradeable(false);
  }, [item.secondaryTradeable]);
  useEffect(() => {
    item.transferable === 1 ? setIsTransferable(true) : setIsTransferable(false);
  }, [item.transferable]);

  const handleUpdateProperty = async (propertyWantedToUpdate: string) => {
    setTxErrorUpdateProperty(null);
    web3_updateProperty(propertyWantedToUpdate);
    onUpdateModalOpen();
  };

  // useEffect(() => {
  //   getItheumPrice();
  //   const interval = setInterval(() => {
  //     getItheumPrice();
  //   }, 60_000);
  //   return () => clearInterval(interval);
  // }, []);

  const onBurn = () => {
    if (!address) {
      toast({
        title: labels.ERR_BURN_NO_WALLET_CONN,
        status: "error",
        isClosable: true,
      });
      return;
    }
    if (!selectedDataNft) {
      toast({
        title: labels.ERR_BURN_NO_NFT_SELECTED,
        status: "error",
        isClosable: true,
      });
      return;
    }

    mintContract.sendBurnTransaction(address, selectedDataNft.collection, selectedDataNft.nonce, dataNftBurnAmount);

    onBurnNFTClose(); // close modal
  };

  // const getItheumPrice = () => {
  //   (async () => {
  //     const _itheumPrice = await getItheumPriceFromApi();
  //     setItheumPrice(_itheumPrice);
  //   })();
  // };

  const accessDataStream = async (dataMarshal: string, NFTId: string, dataStream: string) => {
    /*
      1) get a nonce from the data marshal (s1)
      2) get user to sign the nonce and obtain signature (s2)
      3) send the signature for verification from the marshal and open stream in new window (s3)
    */

    onAccessProgressModalOpen();

    setUnlockAccessProgress((prevProgress) => ({ ...prevProgress, s1: 1 }));

    await sleep(3);

    setUnlockAccessProgress((prevProgress) => ({
      ...prevProgress,
      s2: 1,
    }));

    await sleep(3);

    // auto download the file without ever exposing the url
    const link = document.createElement("a");
    link.target = "_blank";
    link.setAttribute("target", "_blank");
    link.href = dataStream;
    link.dispatchEvent(new MouseEvent("click"));

    setUnlockAccessProgress((prevProgress) => ({
      ...prevProgress,
      s3: 1,
    }));
  };

  const cleanupAccessDataStreamProcess = () => {
    setUnlockAccessProgress({ s1: 0, s2: 0, s3: 0 });
    setErrUnlockAccessGeneric("");
    onAccessProgressModalClose();
  };

  const onBurnButtonClick = (nft: DataNftType) => {
    setSelectedDataNft(nft);
    setDataNftBurnAmount(Number(nft.balance));
    setBurnNFTModalState(1);
    onBurnNFTOpen();
  };

  const onListButtonClick = (nft: DataNftType) => {
    setSelectedDataNft(nft);
    onListNFTOpen();
  };

  const onChangeDataNftBurnAmount = (valueAsString: string) => {
    let error = "";
    const valueAsNumber = Number(valueAsString);
    if (valueAsNumber < 1) {
      error = "Burn amount cannot be zero or negative";
    } else if (selectedDataNft && valueAsNumber > Number(selectedDataNft.balance)) {
      error = "Data NFT balance exceeded";
    }

    setDataNftBurnAmountError(error);
    setDataNftBurnAmount(valueAsNumber);
  };

  let gradientBorderForTrade = styleStrings.gradientBorderMulticolorToBottomRight;

  if (colorMode === "light") {
    gradientBorderForTrade = styleStrings.gradientBorderMulticolorToBottomRightLight;
  }

  return (
    <Skeleton fitContent={true} isLoaded={item.hasLoaded} borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
      <Box
        w="275px"
        h="720px"
        mx="3 !important"
        key={item.id}
        borderWidth="0.5px"
        borderRadius="xl"
        mb="1rem"
        position="relative"
        style={{ background: gradientBorderForTrade }}>
        <Flex justifyContent="center">
          <Image
            src={item.nftImgUrl}
            alt={item.dataPreview}
            h={236}
            w={236}
            mx={6}
            mt={6}
            borderRadius="32px"
            cursor="pointer"
            onLoad={() => item.setHasLoaded(true)}
            onClick={() => item.openNftDetailsDrawer(item.index)}
          />
        </Flex>

        <Flex mx={6} my={3} direction="column" justify="space-between">
          <Text fontSize="md" color="#929497">
            <Link
              href={`${CHAIN_TX_VIEWER[_chainMeta.networkId as keyof typeof CHAIN_TX_VIEWER]}/erc721_inventory?tokenID=${item.id}&contract=${
                _chainMeta.contracts.dnft
              }`}
              isExternal>
              NFT ID {item.id} <ExternalLinkIcon mx="2px" />
            </Link>
          </Text>
          <Popover trigger="hover" placement="auto">
            <PopoverTrigger>
              <div>
                <Text fontWeight="semibold" fontSize="lg" mt="1.5" noOfLines={1}>
                  {item.title}
                </Text>

                <Flex flexGrow="1">
                  <Text fontSize="md" color="#929497" noOfLines={2} w="100%" h="10">
                    {transformDescription(item.description)}
                  </Text>
                </Flex>
              </div>
            </PopoverTrigger>
            <PopoverContent mx="2" width="220px" mt="-7">
              <PopoverHeader fontWeight="semibold" fontSize="lg">
                {item.title}
              </PopoverHeader>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
                <Text fontSize="md" mt="1" color="#929497">
                  {transformDescription(item.description)}
                </Text>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          <Box mt={1}>
            {
              <Box color="#8c8f9282" fontSize="md">
                <HStack>
                  {item.creator === "0x950c869b1af2543154bd668d83188c1bc77bf82c" && <Image h="20px" src={blueTickIcon} />}
                  Creator: <ShortAddress address={item.creator} fontSize="md"></ShortAddress>
                  <Link href={`${CHAIN_TX_VIEWER[_chainMeta.networkId as keyof typeof CHAIN_TX_VIEWER]}/account/${item.creator}`} isExternal>
                    <ExternalLinkIcon ml="5px" fontSize="sm" />
                  </Link>
                </HStack>
              </Box>
            }

            {/* <Box color="#8c8f9282" fontSize="md">
              {`Creation time: ${moment(item.creationTime).format(uxConfig.dateStr)}`}
            </Box> */}

            <Stack backgroundColor="none" display="flex" flexDirection="column" justifyContent="flex-start" alignItems="flex-start" my="2" height="6rem">
              <Badge borderRadius="md" px="3" py="1" mt="1" colorScheme={item.creator !== _chainMeta.loggedInAddress ? "teal" : "blue"}>
                <Text fontSize={"sm"} fontWeight="semibold">
                  You are the {item.creator !== _chainMeta.loggedInAddress ? "Owner" : "Creator"}
                </Text>
              </Badge>

              <Badge borderRadius="md" px="3" py="1" bgColor="#E2AEEA30">
                <Text fontSize={"sm"} fontWeight="semibold" color="#E2AEEA">
                  Fully Transferable License
                </Text>
              </Badge>

              {/* <Button
                mt="1"
                size="md"
                borderRadius="lg"
                fontSize="sm"
                bgColor="#FF439D"
                _hover={{ backgroundColor: "#FF439D70" }}
                isDisabled={hasPendingTransactions}
                onClick={() => onBurnButtonClick(item)}>
                Burn
              </Button> */}
            </Stack>

            <Box backgroundColor="none" fontSize="md" fontWeight="normal" my={2}>
              <Text fontWeight="bold" fontSize="md">{`Royalty: ${item.royalties === -2 ? "Loading..." : item.royalties}%`}</Text>

              <Box my="10px">
                <HStack>
                  <Tooltip label={labels.WHAT_IS_TRADABLE}>
                    <Text fontSize="sm" w="75px">
                      Externally Tradable:{" "}
                    </Text>
                  </Tooltip>
                  `Tradable: $
                  {item.secondaryTradeable === -2 ? (
                    "Loading..."
                  ) : (
                    <Badge borderRadius="sm" colorScheme={istradeable ? "teal" : "red"}>
                      {istradeable ? "Yes" : "No"}
                    </Badge>
                  )}
                  {item.creator === _chainMeta.loggedInAddress && (
                    <>
                      <Spacer />
                      <Switch colorScheme="teal" isChecked={istradeable} onChange={handleToggletradeable} />
                      <Button
                        size="xsm"
                        p="1"
                        fontSize={"xs"}
                        colorScheme="teal"
                        ml={2}
                        isDisabled={isUpdatetradeableDisabled}
                        onClick={() => handleUpdateProperty("tradeable")}
                        _active={{
                          bg: "#dddfe2",
                          transform: "scale(0.98)",
                          borderColor: "#bec3c9",
                        }}>
                        Update
                      </Button>
                    </>
                  )}
                </HStack>
                <HStack mt="1">
                  <Tooltip label={labels.WHAT_IS_TRANSFERABLE}>
                    <Text fontSize="sm" w="75px">
                      List for Trade:{" "}
                    </Text>
                  </Tooltip>
                  {item.transferable === -2 ? (
                    "Loading..."
                  ) : (
                    <Badge borderRadius="sm" colorScheme={isTransferable ? "teal" : "red"}>
                      {isTransferable ? "Yes" : "No"}
                    </Badge>
                  )}
                  <Spacer />
                  <Switch colorScheme="teal" isChecked={isTransferable} onChange={handleToggleTransferable} />
                  <Button
                    size="xsm"
                    p="1"
                    fontSize="xs"
                    colorScheme="teal"
                    ml={2}
                    isDisabled={isUpdateTransferableDisabled}
                    onClick={() => handleUpdateProperty("transferable")}>
                    Update
                  </Button>
                </HStack>
              </Box>
              {/* {`Balance: ${item.balance} (Max supply: ${item.supply})`} */}
            </Box>

            <HStack borderTop="solid 1px" pt="5px">
              <Box fontWeight="bold" fontSize="md">{`Unlock Fee: ${
                item.feeInTokens === -2 ? "Loading..." : itheumTokenRoundUtilExtended(item.feeInTokens, 18, ethers.BigNumber, true)
              } ITHEUM`}</Box>
            </HStack>

            <HStack mt="30px">
              <Button
                size="sm"
                colorScheme="teal"
                w="full"
                onClick={() => {
                  accessDataStream(item.dataMarshal, item.id, item.dataStream);
                }}>
                View Data
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                w="full"
                variant="outline"
                onClick={() => {
                  window.open(item.dataPreview);
                }}>
                <Text py={3} color={colorMode === "dark" ? "white" : "black"}>
                  Preview Data
                </Text>
              </Button>
            </HStack>

            <Box style={{ "visibility": "hidden" }}>
              <Flex mt="5" flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="#929497">
                  How many to list:{" "}
                </Text>
                <NumberInput
                  size="sm"
                  borderRadius="4.65px !important"
                  maxW={20}
                  step={1}
                  defaultValue={1}
                  min={1}
                  max={item.balance}
                  isValidCharacter={isValidNumericCharacter}
                  value={amount}
                  onChange={(value) => {
                    let error = "";
                    const valueAsNumber = Number(value);
                    if (valueAsNumber <= 0) {
                      error = "Cannot be zero or negative";
                    } else if (valueAsNumber > item.balance) {
                      error = "Cannot exceed balance";
                    }
                    setAmountError(error);
                    setAmount(valueAsNumber);
                  }}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
              {amountError && (
                <Text color="red.400" fontSize="xs">
                  {amountError}
                </Text>
              )}

              <Flex mt="5" flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="#929497">
                  Unlock fee for each:{" "}
                </Text>
                <NumberInput
                  size="sm"
                  maxW={20}
                  step={5}
                  defaultValue={10}
                  min={0}
                  isValidCharacter={isValidNumericCharacter}
                  max={item.maxPayment ? item.maxPayment : 0}
                  value={price}
                  onChange={(valueString) => {
                    let error = "";
                    const valueAsNumber = Number(valueString);
                    if (valueAsNumber < 0) {
                      error = "Cannot be negative";
                    } else if (valueAsNumber > item.maxPayment ? item.maxPayment : 0) {
                      error = "Cannot exceed maximum listing fee";
                    }
                    setPriceError(error);
                    setPrice(valueAsNumber);
                  }}
                  keepWithinRange={true}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
              {priceError && (
                <Text color="red.400" fontSize="xs">
                  {priceError}
                </Text>
              )}
              <Button
                size="sm"
                mt={4}
                width="100%"
                colorScheme="teal"
                variant="outline"
                isDisabled={hasPendingTransactions || !!amountError || !!priceError}
                onClick={() => onListButtonClick(item)}>
                <Text py={3} color={colorMode === "dark" ? "white" : "black"}>
                  List {amount} NFT{amount > 1 && "s"} for {price ? `${price} ITHEUM ${amount > 1 ? "each" : ""}` : "Free"}
                </Text>
              </Button>
            </Box>
          </Box>
        </Flex>

        <Modal size={modelSize} isOpen={isUpdateModalOpen} onClose={onUpdateModalClose} closeOnEsc={false} closeOnOverlayClick={false}>
          <ModalOverlay bg="#181818e0">
            <ModalContent bg="#181818">
              <ModalHeader>
                <HStack>
                  <Stack>
                    <Text fontSize={"lg"} fontWeight={"normal"}>
                      Updating the Externally Tradable property of
                    </Text>
                    <Text p={2} bg={"blackAlpha.300"} fontSize={"lg"} fontWeight={"semibold"}>
                      {item.title}
                    </Text>
                  </Stack>
                  <Spacer></Spacer>
                  <Skeleton isLoaded={nftImageLoaded}>
                    <Image
                      p={4}
                      borderRadius="5px"
                      height={"150px"}
                      width="150px"
                      src={item.nftImgUrl}
                      onLoad={() => {
                        setNftImageLoaded(true);
                      }}
                    />
                  </Skeleton>
                </HStack>
              </ModalHeader>

              <ModalBody>
                {updatePropertyWorking && (
                  <Stack p={2} bg={"blackAlpha.400"}>
                    <Text>Progress </Text>
                    <Stack p={2}>
                      <Progress size={"lg"} colorScheme="teal" hasStripe isAnimated={true} value={txConfirmationUpdateProperty} />

                      <HStack>
                        <Text fontSize="sm">Transaction </Text>
                        <Link fontSize="sm" href={txHashUpdateProperty} isExternal>
                          <ExternalLinkIcon mx="2px" />
                        </Link>
                      </HStack>
                    </Stack>
                  </Stack>
                )}

                {txErrorUpdateProperty && (
                  <Alert status="error">
                    <AlertIcon />
                    {txErrorUpdateProperty.message && <AlertTitle fontSize="md">{txErrorUpdateProperty.message}</AlertTitle>}
                    <CloseButton position="absolute" right="8px" top="8px" onClick={onUpdateModalClose} />
                  </Alert>
                )}
                {txErrorUpdateProperty && "data" in txErrorUpdateProperty && "message" in txErrorUpdateProperty.data && (
                  <Alert status="error">
                    <AlertIcon />
                    {txErrorUpdateProperty.data.message && <AlertTitle fontSize="md">{txErrorUpdateProperty.data.message}</AlertTitle>}
                  </Alert>
                )}
                <Flex justifyContent="end" mt="8 !important">
                  <Button mx="3" colorScheme="teal" size="sm" variant="outline" isDisabled={updatePropertyWorking} onClick={onUpdateModalClose}>
                    Cancel
                  </Button>
                </Flex>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        </Modal>
        <Box
          position="absolute"
          top="0"
          bottom="0"
          left="0"
          right="0"
          height="100%"
          width="100%"
          backgroundColor="blackAlpha.800"
          rounded="lg"
          visibility={
            item.userData && (item.userData?.addressFrozen || (item.userData?.frozenNonces && item.userData?.frozenNonces.includes(item?.nonce)))
              ? "visible"
              : "collapse"
          }
          backdropFilter="auto"
          backdropBlur="6px">
          <Text fontSize="md" position="absolute" top="45%" textAlign="center" px="2">
            - FROZEN - <br />
            Data NFT is under investigation by the DAO as there was a complaint received against it
          </Text>
        </Box>

        {selectedDataNft && (
          <Modal isOpen={isBurnNFTOpen} onClose={onBurnNFTClose} closeOnEsc={false} closeOnOverlayClick={false}>
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px) hue-rotate(90deg)" />
            <ModalContent>
              {burnNFTModalState === 1 ? (
                <>
                  <ModalHeader>Burn Supply from my Data NFT</ModalHeader>
                  <ModalBody pb={6}>
                    <HStack spacing="5" alignItems="center">
                      <Box flex="1.1">
                        <Stack>
                          <Image src={selectedDataNft.nftImgUrl} h={100} w={100} borderRadius="md" m="auto" />
                          <Text fontWeight="bold" fontSize="md" backgroundColor="blackAlpha.300" px="1" textAlign="center">
                            {selectedDataNft.tokenName}
                          </Text>
                        </Stack>
                      </Box>
                      <Box flex="1.9" alignContent="center">
                        <Text color="orange.300" fontSize="sm">
                          You have ownership of {selectedDataNft.balance} Data NFTs (out of a total of {selectedDataNft.supply}). You can burn these{" "}
                          {selectedDataNft.balance} Data NFTs and remove them from your wallet.
                          {selectedDataNft.supply - selectedDataNft.balance > 0 &&
                            ` The remaining ${selectedDataNft.supply - selectedDataNft.balance} ${
                              selectedDataNft.supply - selectedDataNft.balance > 1 ? "are" : "is"
                            } not under your ownership.`}
                        </Text>
                      </Box>
                    </HStack>

                    <Text fontSize="md" mt="4">
                      Please note that Data NFTs not listed in the Data NFT marketplace are &quot;NOT public&quot; and are &quot;Private&quot; to only you so no
                      one can see or access them. So only burn Data NFTs if you are sure you want to destroy your Data NFTs for good. Once burned you will not
                      be able to recover them again.
                    </Text>

                    <HStack mt="8">
                      <Text fontSize="md">How many do you want to burn?</Text>
                      <NumberInput
                        size="xs"
                        maxW={16}
                        step={1}
                        defaultValue={selectedDataNft.balance}
                        min={1}
                        max={selectedDataNft.balance}
                        isValidCharacter={isValidNumericCharacter}
                        value={dataNftBurnAmount}
                        onChange={onChangeDataNftBurnAmount}
                        keepWithinRange={true}>
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </HStack>
                    {dataNftBurnAmountError && (
                      <Text ml="208px" color="red.400" fontSize="sm" mt="1 !important">
                        {dataNftBurnAmountError}
                      </Text>
                    )}

                    <Flex justifyContent="end" mt="8 !important">
                      <Button
                        colorScheme="teal"
                        size="sm"
                        mx="3"
                        onClick={() => setBurnNFTModalState(2)}
                        isDisabled={!!dataNftBurnAmountError || hasPendingTransactions}>
                        I want to Burn my {dataNftBurnAmount} Data NFTs
                      </Button>
                      <Button colorScheme="teal" size="sm" variant="outline" onClick={onBurnNFTClose}>
                        Cancel
                      </Button>
                    </Flex>
                  </ModalBody>
                </>
              ) : (
                <>
                  <ModalHeader>Are you sure?</ModalHeader>
                  <ModalBody pb={6}>
                    <Flex>
                      <Text fontWeight="bold" fontSize="md" px="1">
                        Data NFT Title: &nbsp;
                      </Text>
                      <Text fontWeight="bold" fontSize="md" backgroundColor="blackAlpha.300" px="1">
                        {selectedDataNft.title}
                      </Text>
                    </Flex>
                    <Flex mt="1">
                      <Text fontWeight="bold" fontSize="md" px="1">
                        Burn Amount: &nbsp;&nbsp;
                      </Text>
                      <Text fontSize="sm" backgroundColor="blackAlpha.300" px="1">
                        {dataNftBurnAmount}
                      </Text>
                    </Flex>
                    <Text fontSize="md" mt="2">
                      Are you sure you want to proceed with burning the Data NFTs? You cannot undo this action.
                    </Text>
                    <Flex justifyContent="end" mt="6 !important">
                      <Button colorScheme="teal" size="sm" mx="3" onClick={onBurn} isDisabled={hasPendingTransactions}>
                        Proceed
                      </Button>
                      <Button colorScheme="teal" size="sm" variant="outline" onClick={onBurnNFTClose}>
                        Cancel
                      </Button>
                    </Flex>
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        )}

        {selectedDataNft && (
          <ListDataNFTModal
            isOpen={isListNFTOpen}
            onClose={onListNFTClose}
            nftData={selectedDataNft}
            itheumPrice={itheumPrice || 0}
            marketContract={marketContract}
            sellerFee={item.sellerFee || 0}
            offer={{ wanted_token_identifier: _chainMeta.contracts.itheumToken, wanted_token_amount: price, wanted_token_nonce: 0 }}
            amount={amount}
            setAmount={setAmount}
          />
        )}

        <Modal isOpen={isAccessProgressModalOpen} onClose={cleanupAccessDataStreamProcess} closeOnEsc={false} closeOnOverlayClick={false}>
          <ModalOverlay bg="#181818e0">
            <ModalContent bg="#181818">
              <ModalHeader>Data Access Unlock Progress</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <Stack spacing={5}>
                  <HStack>
                    {(!unlockAccessProgress.s1 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                    <Text>Initiating handshake with Data Marshal</Text>
                  </HStack>

                  <HStack>
                    {(!unlockAccessProgress.s2 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                    <Stack>
                      <Text>Please sign transaction to complete handshake</Text>
                      <Text fontSize="sm">Note: This will not use gas or submit any blockchain transactions</Text>
                    </Stack>
                  </HStack>

                  <HStack>
                    {(!unlockAccessProgress.s3 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}
                    <Text>Verifying data access rights to unlock Data Stream</Text>
                  </HStack>

                  {unlockAccessProgress.s1 && unlockAccessProgress.s2 && (
                    <Stack border="solid .04rem" padding={3} borderRadius={5}>
                      <Text fontSize="sm" lineHeight={1.7}>
                        <InfoIcon boxSize={5} mr={1} />
                        Popups are needed for the Data Marshal to give you access to Data Streams. If your browser is prompting you to allow popups, please
                        select <b>Always allow pop-ups</b>
                      </Text>
                      <Image boxSize="250px" height="auto" m=".5rem auto 0 auto !important" src={imgGuidePopup} borderRadius={10} />
                    </Stack>
                  )}

                  {errUnlockAccessGeneric && (
                    <Alert status="error">
                      <Stack>
                        <AlertTitle fontSize="md">
                          <AlertIcon mb={2} />
                          Process Error
                        </AlertTitle>
                        {errUnlockAccessGeneric && <AlertDescription fontSize="md">{errUnlockAccessGeneric}</AlertDescription>}
                        <CloseButton position="absolute" right="8px" top="8px" onClick={cleanupAccessDataStreamProcess} />
                      </Stack>
                    </Alert>
                  )}
                  {unlockAccessProgress.s1 && unlockAccessProgress.s2 && unlockAccessProgress.s3 && (
                    <Button colorScheme="teal" variant="outline" onClick={cleanupAccessDataStreamProcess}>
                      Close & Return
                    </Button>
                  )}
                </Stack>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </Box>
    </Skeleton>
  );
}
