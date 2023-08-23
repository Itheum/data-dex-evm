import React, { FC, useEffect, useState } from "react";
import { CheckCircleIcon, ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";

import {
  Flex,
  Heading,
  HStack,
  Stack,
  Image,
  Alert,
  AlertDescription,
  AlertTitle,
  Text,
  CloseButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  SimpleGrid,
  TabList,
  Tabs,
  Tab,
  Box,
  Icon,
  TabPanel,
  TabPanels,
  useColorMode,
  useToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalCloseButton,
  Spinner,
  AlertIcon,
} from "@chakra-ui/react";
import imgGuidePopup from "img/guide-unblock-popups.png";

import { useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks/transactions";
import { FaStore, FaBrush } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import DataNFTDetails from "DataNFT/DataNFTDetails";
import { createNftId } from "libs/util2";
import { DataNftMetadataType, ItemType, MarketplaceRequirementsType, OfferType, OfferTypeEVM } from "MultiversX/typesEVM";
import { useChainMeta } from "store/ChainMetaContext";
import { CustomPagination } from "./CustomPagination";
import MarketplaceLowerCard from "./MarketplaceLowerCardEVM";
import MyListedDataLowerCard from "./MyListedDataLowerCard";
import UpperCardComponentEVM from "../UtilComps/UpperCardComponentEVM";
import useThrottle from "../UtilComps/UseThrottle";

import { ethers } from "ethers";
import { ABIS } from "../EVM/ABIs";
import WalletDataNFTEVM from "./WalletDataNFTEVM";
import { sleep } from "libs/util";

interface PropsType {
  tabState: number; // 1 for "Public Marketplace", 2 for "My Data NFTs",
  setMenuItem: any;
  onRefreshTokenBalance: any;
}

export const Marketplace: FC<PropsType> = ({ tabState, setMenuItem, onRefreshTokenBalance }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const { chainMeta: _chainMeta } = useChainMeta() as any;
  const { hasPendingTransactions, pendingTransactions } = useGetPendingTransactions();
  const [itheumPrice, setItheumPrice] = useState<number | undefined>();
  const [loadingOffers, setLoadingOffers] = useState<boolean>(false);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number>(-1); // no selection
  const [nftMetadatas, setNftMetadatas] = useState<DataNftMetadataType[]>([]);
  const [nftMetadatasLoading, setNftMetadatasLoading] = useState<boolean>(false);
  const [oneNFTImgLoaded, setOneNFTImgLoaded] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [marketRequirements, setMarketRequirements] = useState<MarketplaceRequirementsType | undefined>(undefined);
  const [maxPaymentFeeMap, setMaxPaymentFeeMap] = useState<Record<string, number>>({});
  const [marketFreezedNonces, setMarketFreezedNonces] = useState<number[]>([]);

  const [offerForDrawer, setOfferForDrawer] = useState<OfferType | undefined>();

  const [offers, setOffers] = useState<OfferType[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);

  const [currentPageItems, setCurrentPageItems] = useState<ItemType[]>([]);
  const [currentPageMetadatas, setCurrentPageMetadatas] = useState<DataNftMetadataType[]>([]);

  const { isOpen: isDrawerOpenTradeStream, onOpen: onOpenDrawerTradeStream, onClose: onCloseDrawerTradeStream } = useDisclosure();

  ///view data button

  const { isOpen: isAccessProgressModalOpen, onOpen: onAccessProgressModalOpen, onClose: onAccessProgressModalClose } = useDisclosure();
  const [unlockAccessProgress, setUnlockAccessProgress] = useState({
    s1: 0,
    s2: 0,
    s3: 0,
  });
  const [errUnlockAccessGeneric, setErrUnlockAccessGeneric] = useState<string>("");

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
    link.href = dataStream; /// TODO FIND A WAY TO GET THE DATASTREAM,preview,marshal  FROM API or smart contract
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

  // pagination
  const [pageCount, setPageCount] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const marketplace = "/datanfts/marketplace/market";
  const location = useLocation();

  useEffect(() => {
    setPageCount(Math.ceil(filteredItems.length / pageSize));
  }, [filteredItems, pageSize]);

  useEffect(() => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = currentPage * pageSize;

    // Slice the arrays to get the items and metadatas that has to be displayed for the current page
    const itemsForCurrentPage = filteredItems.slice(startIdx, endIdx);
    const metadatasForCurrentPage = nftMetadatas.slice(startIdx, endIdx);
    setCurrentPageMetadatas(metadatasForCurrentPage);
    setCurrentPageItems(itemsForCurrentPage);
  }, [currentPage, filteredItems]);

  const setPageIndex = (newPageIndex: number) => {
    setCurrentPage(newPageIndex + 1);
    //navigate(`/datanfts/marketplace/${tabState === 1 ? "market" : "my"}${newPageIndex > 0 ? "/" + newPageIndex : ""}`);
  };

  const onGotoPage = useThrottle((newPageIndex: number) => {
    if (0 <= newPageIndex && newPageIndex < pageCount) {
      setPageIndex(newPageIndex);
    }
  });

  useEffect(() => {
    (async () => {
      if (!_chainMeta.networkId) return;

      // init - no selection
      setSelectedOfferIndex(-1);

      // start loading offers
      setLoadingOffers(true);

      const allDataNFTs = `https://shibuya.api.bluez.app/api/nft/v3/33b743f848524995fa87ea8519a0b486/getNFTsForContract?contractAddress=0xaC9e9eA0d85641Fa176583215447C81eBB5eD7b3`;

      fetch(allDataNFTs, { method: "GET" })
        .then((resp) => resp.json())
        .then(async (res) => {
          setOffers(res.items);

          const _dataNfts: any[] = [];
          const _tokenIdAry: number[] = [];

          res.items.forEach((offer: OfferTypeEVM, i: number) => {
            _tokenIdAry.push(offer.tokenId);

            _dataNfts.push({
              index: offer.tokenId,
              owner: offer.ownerAddress,
              wanted_token_identifier: "",
              wanted_token_amount: "",
              wanted_token_nonce: offer.tokenId,
              offered_token_identifier: "",
              offered_token_nonce: offer.tokenId,
              quantity: 1,
            });
          });

          mergeSmartContractMetaData(_tokenIdAry, res.items, _dataNfts);
        });
    })();
  }, [tabState, hasPendingTransactions, _chainMeta.networkId]);

  function mergeSmartContractMetaData(_tokenIdAry: any, _allItems: any, _dataNfts: any) {
    // use the list of token IDs to get all the other needed details (price, royalty etc) from the smart contract
    Promise.all(_tokenIdAry.map((i: string) => getTokenDetailsFromContract(i))).then((responses) => {
      const scMetaMap = responses.reduce((sum, i) => {
        sum[i.tokenId] = {
          royaltyInPercent: i.royaltyInPercent,
          secondaryTradeable: i.secondaryTradeable,
          transferable: i.transferable,
          priceInItheum: i.priceInItheum,
        };

        return sum;
      }, {});

      const _metadatas: DataNftMetadataType[] = [];

      for (let i = 0; i < _allItems.length; i++) {
        ///if we are on my page I only want the metadatas where the logged in address is owner of
        if (
          _chainMeta.loggedInAddress && location.pathname === "/datanfts/marketplace/market/my"
            ? scMetaMap[_allItems[i].tokenId].transferable === 1 && _allItems[i].ownerAddress === _chainMeta.loggedInAddress
            : scMetaMap[_allItems[i].tokenId].transferable === 1
        ) {
          _metadatas.push({
            index: _allItems[i].tokenId,
            id: _allItems[i].tokenId,
            nftImgUrl: _allItems[i].image,
            dataPreview: "", // we need this for preview data button
            dataStream: "", // TODO FIND A WAY TO GET THE DATASTREAM,preview,marshal  FROM API or smart contract
            dataMarshal: "", //now we are using this function to get that data, but only for a certain address:  getNftsOfACollectionForAnAddress
            tokenName: "",
            creator: "", // we don't know who the creator is -- this info only comes via Covalent API for now
            creationTime: new Date(), // we don't know who the creator is -- this info only comes via Covalent API for now
            supply: 1,
            balance: 1,
            description: _allItems[i].description,
            title: _allItems[i].name,
            royalties: scMetaMap[_allItems[i].tokenId].royaltyInPercent,
            nonce: 0,
            collection: _allItems[i].contractAddress,
            feeInTokens: scMetaMap[_allItems[i].tokenId].priceInItheum,
            transferable: scMetaMap[_allItems[i].tokenId].transferable,
            secondaryTradeable: scMetaMap[_allItems[i].tokenId].secondaryTradeable,
          });
        }
      }

      setNftMetadatas(_metadatas);
      setNftMetadatasLoading(false);

      const forSaleItems = _dataNfts?.filter((item: any) => scMetaMap[item.index].transferable === 1);

      if (_chainMeta.loggedInAddress && location.pathname === "/datanfts/marketplace/market/my") {
        const myListedDataNfts = forSaleItems?.filter((item: any) => item.owner === _chainMeta.loggedInAddress);
        setFilteredItems(myListedDataNfts);
      } else {
        setFilteredItems(forSaleItems);
      }
      // end loading offers
      setLoadingOffers(false);
    });
  }

  async function getTokenDetailsFromContract(tokenId: string) {
    const contract = new ethers.Contract(_chainMeta.contracts.dnft, ABIS.dNFT, _chainMeta.ethersProvider);
    const tokenDetails = await contract.dataNFTs(parseInt(tokenId));

    const pickDetails = {
      tokenId,
      royaltyInPercent: tokenDetails.royaltyInPercent,
      secondaryTradeable: tokenDetails.secondaryTradeable === true ? 1 : 0, // 1 means true, 0 means false
      transferable: tokenDetails.transferable === true ? 1 : 0, // 1 means true, 0 means false
      priceInItheum: tokenDetails.priceInItheum.toString(),
    };

    return pickDetails;
  }

  function openNftDetailsDrawer(index: number) {
    setOfferForDrawer(offers[index]);
    onOpenDrawerTradeStream();
  }

  function closeDetailsView() {
    onCloseDrawerTradeStream();
    setOfferForDrawer(undefined);
  }

  const toast = useToast();

  return (
    <>
      <Stack>
        <Heading size="xl" fontWeight="medium" mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          Data NFT Marketplace
        </Heading>
        <Heading size="1rem" opacity=".7" fontWeight="light" px={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          Explore and discover new Data NFTs direct from Data Creators and peer-to-peer traders
        </Heading>
        <Box position="relative">
          <Tabs pt={10} index={tabState - 1}>
            <TabList justifyContent={{ base: "start", lg: "space-between" }} overflow={{ base: "scroll", md: "unset", lg: "unset" }}>
              <Flex>
                <Tab
                  _selected={{ borderBottom: "5px solid", borderBottomColor: "teal.200" }}
                  flexDirection="row"
                  _disabled={{ opacity: 1 }}
                  fontSize={{ base: "sm", md: "md" }}
                  onClick={() => {
                    if (hasPendingTransactions) return;
                    setCurrentPage(1);
                    navigate("/datanfts/marketplace/market");
                  }}>
                  <Flex ml="4.7rem" alignItems="center" py={3}>
                    <Icon as={FaStore} mx={2} size="0.95rem" textColor={colorMode === "dark" ? "white" : "black"} />
                    <Text fontSize="lg" fontWeight="medium" color={colorMode === "dark" ? "white" : "black"}>
                      Public Marketplace
                    </Text>
                  </Flex>
                </Tab>
                <Tab
                  _selected={{ borderBottom: "5px solid", borderBottomColor: "teal.200" }}
                  fontSize={{ base: "sm", md: "md" }}
                  onClick={() => {
                    if (hasPendingTransactions) return;
                    setCurrentPage(1);
                    navigate("/datanfts/marketplace/market/my");
                  }}>
                  {_chainMeta.loggedInAddress && (
                    <Flex ml="4.7rem" alignItems="center" py={3}>
                      <Icon as={FaBrush} size="0.95rem" mx={2} textColor={colorMode === "dark" ? "white" : "black"} />
                      <Text fontSize="lg" fontWeight="medium" color={colorMode === "dark" ? "white" : "black"}>
                        My Listed Data NFT(s)
                      </Text>
                    </Flex>
                  )}
                </Tab>
              </Flex>
              {!loadingOffers && !nftMetadatasLoading && (
                <Flex mr="4.7rem">
                  <CustomPagination
                    pageCount={pageCount}
                    pageIndex={currentPage - 1}
                    pageSize={pageSize}
                    gotoPage={onGotoPage}
                    disabled={hasPendingTransactions}
                  />
                </Flex>
              )}
            </TabList>

            <TabPanels>
              <TabPanel mt={2} width={"full"}>
                {!loadingOffers && !nftMetadatasLoading && offers.length === 0 ? (
                  <Text>No data yet...</Text>
                ) : (
                  <SimpleGrid
                    columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                    spacingY={4}
                    mx={{ base: 0, "2xl": "24 !important" }}
                    mt="5 !important"
                    justifyItems={"center"}>
                    {offers.length > 0 &&
                      currentPageItems?.map((item, index) => (
                        <UpperCardComponentEVM
                          key={index}
                          nftImageLoading={oneNFTImgLoaded && !loadingOffers}
                          imageUrl={currentPageMetadatas[index]?.nftImgUrl || ""}
                          setNftImageLoaded={setOneNFTImgLoaded}
                          nftMetadatas={currentPageMetadatas}
                          marketRequirements={marketRequirements}
                          item={item}
                          userData={userData}
                          index={index}
                          marketFreezedNonces={marketFreezedNonces}
                          openNftDetailsDrawer={openNftDetailsDrawer}
                          itheumPrice={itheumPrice}>
                          {location.pathname.includes(marketplace) &&
                          currentPageMetadatas.length > 0 &&
                          !loadingOffers &&
                          !nftMetadatasLoading &&
                          !(_chainMeta.loggedInAddress && _chainMeta.loggedInAddress === item?.owner) ? ( // not owner
                            <HStack mt="30px">
                              <Button
                                size="sm"
                                colorScheme="teal"
                                w="full"
                                onClick={() => {
                                  accessDataStream(
                                    currentPageMetadatas[index]?.dataMarshal,
                                    currentPageMetadatas[index]?.id,
                                    currentPageMetadatas[index]?.dataStream
                                  );
                                }}>
                                View Data
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="teal"
                                w="full"
                                variant="outline"
                                onClick={() => {
                                  console.log("THE PREVIEW " + item.dataPreview);
                                  window.open(item.dataPreview);
                                }}>
                                <Text py={3} color={colorMode === "dark" ? "white" : "black"}>
                                  Preview Data
                                </Text>
                              </Button>
                            </HStack>
                          ) : (
                            <></>
                          )}
                        </UpperCardComponentEVM>
                      ))}
                  </SimpleGrid>
                )}
              </TabPanel>
              <TabPanel mt={2} width={"full"}>
                {!loadingOffers && !nftMetadatasLoading && offers.length === 0 ? (
                  <Text>No data yet...</Text>
                ) : (
                  <SimpleGrid
                    columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                    spacingY={4}
                    mx={{ base: 0, "2xl": "24 !important" }}
                    mt="5 !important"
                    justifyItems={"center"}>
                    {offers.length > 0 &&
                      currentPageItems?.map((item, index) => (
                        <UpperCardComponentEVM
                          key={index}
                          nftImageLoading={oneNFTImgLoaded && !loadingOffers}
                          imageUrl={currentPageMetadatas[index]?.nftImgUrl || ""}
                          setNftImageLoaded={setOneNFTImgLoaded}
                          nftMetadatas={currentPageMetadatas}
                          marketRequirements={marketRequirements}
                          item={item}
                          userData={userData}
                          index={index}
                          marketFreezedNonces={marketFreezedNonces}
                          openNftDetailsDrawer={openNftDetailsDrawer}
                          itheumPrice={itheumPrice}>
                          {location.pathname.includes(marketplace + "/my") &&
                            currentPageMetadatas.length > 0 &&
                            !loadingOffers &&
                            !nftMetadatasLoading &&
                            _chainMeta.loggedInAddress && (
                              <MyListedDataLowerCard
                                index={index}
                                offers={currentPageItems}
                                nftMetadatas={currentPageMetadatas}
                                itheumPrice={itheumPrice}
                                marketRequirements={marketRequirements}
                                maxPaymentFeeMap={maxPaymentFeeMap}
                              />
                            )}
                        </UpperCardComponentEVM>
                      ))}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>

          {
            /* show bottom pagination only if offers exist */
            offers.length > 0 && !loadingOffers && !nftMetadatasLoading && (
              <Flex justifyContent={{ base: "center", md: "center" }} py="5">
                <CustomPagination
                  pageCount={pageCount}
                  pageIndex={currentPage - 1}
                  pageSize={pageSize}
                  gotoPage={onGotoPage}
                  disabled={hasPendingTransactions}
                />
              </Flex>
            )
          }
        </Box>{" "}
        {(loadingOffers || nftMetadatasLoading) && (
          <Spinner position="absolute" color="teal" size="lg" top="50%" left="50%" transform="translate(-50%, -50%)" />
        )}
      </Stack>

      {offerForDrawer && (
        <>
          <Drawer onClose={closeDetailsView} isOpen={isDrawerOpenTradeStream} size="xl" closeOnEsc={false} closeOnOverlayClick={true}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerHeader>
                <HStack spacing="5">
                  <CloseButton size="lg" onClick={closeDetailsView} />
                  <Heading as="h4" size="lg">
                    Data NFT Details
                  </Heading>
                </HStack>
              </DrawerHeader>
              <DrawerBody>
                <DataNFTDetails
                  tokenIdProp={createNftId(offerForDrawer.offered_token_identifier, offerForDrawer.offered_token_nonce)}
                  offerIdProp={offerForDrawer.index}
                  closeDetailsView={closeDetailsView}
                />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
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
                      Popups are needed for the Data Marshal to give you access to Data Streams. If your browser is prompting you to allow popups, please select{" "}
                      <b>Always allow pop-ups</b>
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
    </>
  );
};

export default Marketplace;
