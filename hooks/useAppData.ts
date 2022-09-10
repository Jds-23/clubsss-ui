import { useCallback, useEffect, useMemo, useState } from "react";
import IDEA_PORTAL_ABI from "../constants/abis/IdeaPortal.json";
import useContract from "./useContract";

interface Community {
  id: number;
  metadaTa: string;
  metadata: string;
  deadline: number;
  from: string;
  votesCount: number;
  votes: {
    id: string;
    from: string;
    weight: number;
    type: number;
  }[];
  upScore: number;
  score: number;
  downScore: number;
  timestamp: number;
}

export function useAppData(community: string | undefined): {
  communities: Community[] | undefined;
  nftAddress: string | undefined;
  clubName: string | undefined;
} {
  const CommunityContract = useContract(community, IDEA_PORTAL_ABI);
  const [communities, setCommunities] = useState<Community[]>();
  const [nftAddress, setNftAddress] = useState<string>();
  const [clubName, setClubName] = useState<string>();
  const fetchCommunties = useCallback(async () => {
    if (!CommunityContract) return undefined;
    const waves = await CommunityContract.getAllWaves();
    setCommunities(
      waves.map((wave: any, index: any) => ({
        id: index,
        ideaStr: wave.message,
        metadata: wave.metadata,
        deadline: wave.deadline.toNumber(),
        from: wave.waver,
        timestamp: wave.timestamp.toNumber(),
        votesCount: 0,
        votes: [],
        upScore: 0,
        score: 0,
        downScore: 0,
      }))
    );
  }, [CommunityContract]);
  const fetchNFTAddress = useCallback(async () => {
    if (!CommunityContract) return undefined;
    const contract = await CommunityContract.nftContract();
    const name = await CommunityContract.name();
    setNftAddress(contract);
    setClubName(name);
  }, [nftAddress, setClubName, CommunityContract]);

  useEffect(() => {
    fetchCommunties();
  }, [fetchCommunties]);
  useEffect(() => {
    fetchNFTAddress();
  }, [fetchNFTAddress]);

  return { communities, nftAddress, clubName };
}
