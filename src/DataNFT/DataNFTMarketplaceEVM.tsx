import React, { FC, useEffect, useState } from "react";
import {
  Flex,
  Heading,
  HStack,
  Stack,
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
} from "@chakra-ui/react";

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

  const [items, setItems] = useState<ItemType[]>([]);

  const { isOpen: isDrawerOpenTradeStream, onOpen: onOpenDrawerTradeStream, onClose: onCloseDrawerTradeStream } = useDisclosure();

  // pagination
  const [pageCount, setPageCount] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
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
        if (scMetaMap[_allItems[i].tokenId].transferable === 1 && scMetaMap[_allItems[i].tokenId].secondaryTradeable === 1) {
          _metadatas.push({
            index: _allItems[i].tokenId,
            id: _allItems[i].tokenId,
            nftImgUrl: _allItems[i].image,
            dataPreview: "",
            dataStream: "",
            dataMarshal: "",
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

      const forSaleItems = _dataNfts?.filter((item: any) => scMetaMap[item.index].transferable === 1 && scMetaMap[item.index].secondaryTradeable === 1);
      setFilteredItems(forSaleItems);

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
          <Tabs pt={10}>
            <TabList justifyContent={{ base: "start", lg: "space-between" }} overflow={{ base: "scroll", md: "unset", lg: "unset" }}>
              <Flex>
                <Tab
                  _selected={{ borderBottom: "5px solid", borderBottomColor: "teal.200" }}
                  flexDirection="row"
                  _disabled={{ opacity: 1 }}
                  fontSize={{ base: "sm", md: "md" }}
                  onClick={() => {
                    if (hasPendingTransactions) return;
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
                  isDisabled={true}
                  fontSize={{ base: "sm", md: "md" }}
                  onClick={() => {
                    if (hasPendingTransactions) return;
                    navigate("/datanfts/marketplace/my");
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
              <Flex mr="4.7rem">
                <CustomPagination
                  pageCount={pageCount}
                  pageIndex={currentPage - 1}
                  pageSize={pageSize}
                  gotoPage={onGotoPage}
                  disabled={hasPendingTransactions}
                />
              </Flex>
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
                          !(_chainMeta.loggedInAddress && _chainMeta.loggedInAddress == item?.owner) ? (
                            <MarketplaceLowerCard
                              nftMetadatas={currentPageMetadatas}
                              index={index}
                              item={item}
                              offers={offers}
                              itheumPrice={itheumPrice}
                              marketRequirements={marketRequirements}
                              setMenuItem={setMenuItem}
                              onRefreshTokenBalance={onRefreshTokenBalance}
                            />
                          ) : (
                            <MyListedDataLowerCard
                              index={index}
                              offers={items}
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
              <TabPanel mt={2} width={"full"}>
                <Text>Noting here yet...</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {
            /* show bottom pagination only if offers exist */
            offers.length > 0 && (
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
        </Box>
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
    </>
  );
};

export default Marketplace;
