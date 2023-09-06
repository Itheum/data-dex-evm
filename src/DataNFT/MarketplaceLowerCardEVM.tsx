import React, { FC, useState } from "react";
import { Button, Text, useDisclosure } from "@chakra-ui/react";
import ProcureDataNFTModal from "./ProcureDataNFTModalEVM";
import { DataNftMetadataType, ItemType, MarketplaceRequirementsType, OfferType } from "../MultiversX/typesEVM";
import { useChainMeta } from "../store/ChainMetaContext";

type MarketplaceLowerCardProps = {
  item: ItemType;
  offers: OfferType[];
  nftMetadatas: DataNftMetadataType[];
  index: number;
  itheumPrice: number | undefined;
  marketRequirements: MarketplaceRequirementsType | undefined;
  setMenuItem: any;
  onRefreshTokenBalance: any;
  onCompletion: any;
};

const MarketplaceLowerCardEVM: FC<MarketplaceLowerCardProps> = ({
  item,
  index,
  offers,
  nftMetadatas,
  itheumPrice,
  marketRequirements,
  setMenuItem,
  onRefreshTokenBalance,
  onCompletion,
}) => {
  const { chainMeta: _chainMeta } = useChainMeta() as any;
  const [amountOfTokens, setAmountOfTokens] = useState<any>({});
  const [amountErrors, setAmountErrors] = useState<string[]>([]);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number>(-1); // no selection
  const { isOpen: isProcureModalOpen, onOpen: onProcureModalOpen, onClose: onProcureModalClose } = useDisclosure();

  return (
    <>
      <Button
        size="sm"
        colorScheme="teal"
        mt="3"
        isDisabled={!!amountErrors[index]}
        onClick={() => {
          setSelectedOfferIndex(index);
          onProcureModalOpen();
        }}>
        Procure Data NFT
      </Button>

      {amountErrors[index] && (
        <Text color="red.400" fontSize="xs" mt={1}>
          {amountErrors[index]}
        </Text>
      )}

      {selectedOfferIndex >= 0 && nftMetadatas.length > selectedOfferIndex && (
        <ProcureDataNFTModal
          isOpen={isProcureModalOpen}
          onClose={onProcureModalClose}
          itheumPrice={itheumPrice || 0}
          marketContract={null}
          buyerFee={marketRequirements?.buyer_fee || 0}
          nftData={nftMetadatas[selectedOfferIndex]}
          offer={offers[selectedOfferIndex]}
          amount={amountOfTokens[selectedOfferIndex]}
          item={item}
          setMenuItem={setMenuItem}
          onRefreshTokenBalance={onRefreshTokenBalance}
          onCompletion={onCompletion}
        />
      )}
    </>
  );
};

export default MarketplaceLowerCardEVM;
