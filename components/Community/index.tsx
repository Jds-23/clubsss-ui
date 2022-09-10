import { Contract, ethers } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import { SUPPORTED_NETWORKS } from "../../constants/networks";
import IDEA_PORTAL_ABI from "../../constants/abis/IdeaPortal.json";
import Link from "next/link";
interface Props {
  community: string;
}
const CommunityCard: React.FC<Props> = ({ community }) => {
  const [communityName, setCommunityName] = useState<string>();
  const [metadata, setMetadata] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [cover, setCover] = useState<string>();
  const fetchData = useCallback(async () => {
    const chainIdStr = "0x13881";
    const library = SUPPORTED_NETWORKS[chainIdStr]?.rpcUrls[0]
      ? new ethers.providers.JsonRpcProvider(
          SUPPORTED_NETWORKS[chainIdStr].rpcUrls[0]
        )
      : undefined;
    const portalContract = new Contract(community, IDEA_PORTAL_ABI, library);
    if (portalContract) {
      const name = await portalContract.name();
      const metadata = await portalContract.metadata();
      setCommunityName(name);
      setMetadata(metadata);
    } else {
      setCommunityName("");
      setMetadata("");
    }
  }, [community]);
  const fetchMetadata = useCallback(async () => {
    {
      if (metadata) {
        console.log(metadata);
        fetch(`https://ipfs.io/ipfs/${metadata}/metadata.json`)
          .then((res) => res.json())
          .then((res) => {
            console.log(res);
            setAbout(res?.about);
            setCover(res?.cover);
          })
          .catch((err) => console.log(err));
      }
    }
  }, [metadata]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return (
    <Link href={`/club/${community}`}>
      <div className="w-full cursor-pointer p-1 border rounded-md border-accent">
        <div className="flex items-center">
          {cover ? (
            <img
              src={cover}
              className="w-14 h-14 bg-slate-400 rounded-full mr-2"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-400 rounded-full mr-2" />
          )}
          {communityName ? (
            <div>
              <h1 className="text-lg"> {communityName}</h1>
              {about && <p>{about}</p>}
            </div>
          ) : (
            <div className="animate-pulse w-12 bg-slate-400 rounded-sm h-4" />
          )}
        </div>
      </div>
    </Link>
  );
};

export default CommunityCard;
