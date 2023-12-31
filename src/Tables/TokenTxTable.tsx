import React, { useEffect, useState, useMemo } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { HStack, Link } from "@chakra-ui/react";
import { TransactionOnNetwork } from "@multiversx/sdk-network-providers/out";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { CHAIN_TX_VIEWER } from "libs/util";
import { getApi } from "MultiversX/api";
import { DataNftMarketContract } from "MultiversX/dataNftMarket";
import { useChainMeta } from "store/ChainMetaContext";
import ShortAddress from "UtilComps/ShortAddress";
import { DataTable } from "./Components/DataTable";
import { buildHistory, DataNftOnNetwork, timeSince, TokenTableProps, TransactionInTable } from "./Components/tableUtils";

export default function TokenTxTable(props: TokenTableProps) {
  const { chainMeta: _chainMeta } = useChainMeta();
  const [data, setData] = useState<TransactionInTable[]>([]);

  const marketContract = new DataNftMarketContract(_chainMeta.networkId);

  const linkIconStyle = { display: "flex" };
  const columns = useMemo<ColumnDef<TransactionInTable, any>[]>(
    () => [
      {
        id: "hash",
        accessorFn: (row) => row.hash,
        cell: (cellProps) => (
          <HStack>
            <ShortAddress address={cellProps.getValue()} />
            <Link
              href={`${CHAIN_TX_VIEWER[_chainMeta.networkId as keyof typeof CHAIN_TX_VIEWER]}/transactions/${cellProps.getValue()}`}
              isExternal
              style={linkIconStyle}>
              <ExternalLinkIcon />
            </Link>
          </HStack>
        ),
        header: "Hash",
        footer: (footerProps) => footerProps.column.id,
      },
      {
        id: "age",
        accessorFn: (row) => timeSince(row.timestamp),
        header: "Age",
        footer: (footerProps) => footerProps.column.id,
      },
      {
        id: "from",
        accessorFn: (row) => row.from,
        cell: (cellProps) => (
          <HStack>
            <ShortAddress address={cellProps.getValue()} />
            <Link
              href={`${CHAIN_TX_VIEWER[_chainMeta.networkId as keyof typeof CHAIN_TX_VIEWER]}/accounts/${cellProps.getValue()}`}
              isExternal
              style={linkIconStyle}>
              <ExternalLinkIcon />
            </Link>
          </HStack>
        ),
        header: "From",
        footer: (footerProps) => footerProps.column.id,
      },
      {
        id: "to",
        accessorFn: (row) => row.to,
        cell: (cellProps) => (
          <HStack>
            <ShortAddress address={cellProps.getValue()} />
            <Link
              href={`${CHAIN_TX_VIEWER[_chainMeta.networkId as keyof typeof CHAIN_TX_VIEWER]}/accounts/${cellProps.getValue()}`}
              isExternal
              style={linkIconStyle}>
              <ExternalLinkIcon />
            </Link>
          </HStack>
        ),
        header: "To",
        footer: (footerProps) => footerProps.column.id,
      },
      {
        id: "method",
        accessorFn: (row) => row.method,
        header: "Method",
        footer: (footerProps) => footerProps.column.id,
      },
      {
        id: "amount",
        accessorFn: (row) => row.value,
        header: "Amount",
        footer: (footerProps) => footerProps.column.id,
      },
    ],
    []
  );

  useEffect(() => {
    const apiUrl = getApi(_chainMeta.networkId);

    Promise.all([
      axios.get(`https://${apiUrl}/transactions?token=${props.tokenId}&status=success&size=1000&function=burn&order=asc`),
      axios.get(
        `https://${apiUrl}/accounts/${marketContract.dataNftMarketContractAddress}/transactions?status=success&function=cancelOffer%2CaddOffer%2CacceptOffer%2CchangeOfferPrice&size=10000&order=asc`
      ),
    ]).then((responses) => {
      const mergedTransactions = getHistory(responses, props.tokenId);
      const history = buildHistory(mergedTransactions);
      setData(history);
    });
  }, []);

  return <DataTable columns={columns} data={data} />;
}

function getHistory(responses: any[], tokenId?: string) {
  DataNftOnNetwork.ids = [];
  DataNftOnNetwork.token_identifier = tokenId;
  DataNftOnNetwork.addOfferIndex = 0;
  const transactionsWithId: DataNftOnNetwork[] = [];

  responses.forEach((response: any) => {
    const txs = response.data;
    const transactions = txs.map((tx: any) => {
      const transaction = TransactionOnNetwork.fromProxyHttpResponse(tx.txHash, tx);
      return DataNftOnNetwork.fromTransactionOnNetwork(transaction);
    });
    const filteredTransactions = transactions.filter((data: DataNftOnNetwork) => {
      return data?.transfers[0]?.properties?.identifier === tokenId || DataNftOnNetwork.ids.includes(parseInt(data?.methodArgs[0], 16));
    });
    transactionsWithId.push(...filteredTransactions);
  });
  return transactionsWithId;
}
