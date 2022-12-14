import type { NextPage } from "next";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "../components/Button";
import IdeaCard from "../components/IdeaCard";
import useApp from "../state/app/hooks";
import useNft from "../state/app/useNft";
// import { PhotographIcon } from "@heroicons/react/outline";
import useWallet from "../state/wallet/hooks/useWallet";
import { getDate } from "../utils";
import Modal from "../components/Modal";
import { jsonFile, storeFile, storeFiles } from "../utils/storeFile";
import { useSubgraph } from "../hooks/useSubgraph";
import useSortableData from "../hooks/useSortableData";
import { COMMUNITY_FACTORY_ADDRESS, JUST_NFT_ADDRESS } from "../constants";
import useContract from "../hooks/useContract";
import COMMUNITY_FACTORY_ABI from "../constants/abis/CommunityFactory.json";
import { Contract, ethers } from "ethers";
import { SUPPORTED_NETWORKS } from "../constants/networks";
import CommunityCard from "../components/Community";
import useToast from "../hooks/useToasts";
import uploadAssetToIPFS from "../utils/uploadAssetsToIPFS";

// subgraph ❌ to contract raw data
//    - waverData by waves
// Hooks to passed on address
// communities/0x99..000 use this
// abi update and hook update
// nft contract fetch

const Home: NextPage = () => {
  const { account } = useWallet();

  const [open, setOpen] = useState(false);

  const CommunityFactory = useContract(
    COMMUNITY_FACTORY_ADDRESS,
    COMMUNITY_FACTORY_ABI
  );
  const [communties, setCommunities] = useState<string[]>();
  const fetchCommunities = useCallback(async () => {
    if (!CommunityFactory) return;
    const communties = await CommunityFactory.getCommunities();
    setCommunities(communties);
  }, [CommunityFactory, setCommunities]);
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  return (
    <div>
      <Head>
        <title>clubsss</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CreateAClubModal
        open={open}
        setOpen={setOpen}
        fetchCommunities={fetchCommunities}
      />
      <main className="w-full px-4 mx-auto max-w-3xl flex flex-col items-center font-semibold">
        <h1 className="font-bold text-2xl m-3">Clubs</h1>
        <div className="grid grid-cols-3 gap-1 w-full mx-auto max-w-3xl">
          {communties?.map((community) => (
            <CommunityCard key={community} community={community} />
          ))}
        </div>
        <h1 className="font-bold text-2xl m-3">Create A Club</h1>
        {account ? (
          <div className="w-full">
            <Button onClick={() => setOpen(true)} className="mx-auto">
              Create
            </Button>
          </div>
        ) : (
          <h1>Connect Wallet to create a community</h1>
        )}
      </main>
    </div>
  );
};

export default Home;

const CreateAClubModal = ({
  fetchCommunities,
  open,
  setOpen,
}: {
  fetchCommunities: () => Promise<void>;
  setOpen: (arg: boolean) => void;
  open: boolean;
}) => {
  const [cover, setCover] = useState<string>();
  const drop = useRef<any>(null);
  const fileInput = useRef<any>(null);
  const [coverState, setCoverState] = useState<string>();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [showOption, setShowOption] = useState(false);
  const [option, setOption] = useState(0);
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState<string>();
  const options = ["Default NFT Contract", "Custom NFT contract"];

  const { account, web3Provider } = useWallet();
  const { txSuccess, error, txWaiting, dismiss } = useToast();

  const createCommunity = useCallback(
    async (metadata: string, nameOfClub: string) => {
      try {
        if (!account || !web3Provider) return;
        const signer = web3Provider.getSigner();
        const CommunityFactory = new Contract(
          COMMUNITY_FACTORY_ADDRESS,
          COMMUNITY_FACTORY_ABI,
          signer
        );
        const nft = option === 0 ? JUST_NFT_ADDRESS : address;

        const data = await ethers.utils.defaultAbiCoder.encode(
          ["address", "string", "string"],
          [nft, nameOfClub, metadata]
        );
        const tx = await CommunityFactory.deployCommunity(0, data);
        txWaiting("Creating...");
        await tx.wait();
        dismiss();
        fetchCommunities();
        txSuccess("Created your community", tx.hash);
        console.log("Created -- ", tx.hash);
      } catch (err: any) {
        console.log(err.message);
      }
    },
    [address, account, option]
  );

  const uploadfile = async (files: any) => {
    setCoverState("loading");
    if (files && files.length) {
      setCover(undefined);
      const attachment = await uploadAssetToIPFS(files);
      console.log(attachment);
      if (attachment) {
        setCover(attachment);
        setCoverState("set");
      } else {
        setCoverState("Error!");
      }
    }
  };

  const generateMetadata = async () => {
    try {
      setLoading("Creating...");
      const data = jsonFile("metadata.json", {
        name,
        about,
        cover,
      });
      const res = await storeFile(data, "metadata.json");
      console.log(res);
      if (res) {
        createCommunity(res?.cid, name);
        setName("");
        setAbout("");
        setLoading(undefined);
        setOpen(false);
        return res;
      }
      setOpen(false);
      setLoading(undefined);
      return undefined;
    } catch (err) {
      setLoading(undefined);
      console.log(err);
      setOpen(false);
      createCommunity("", name);
      setName("");
      setAbout("");
      setLoading(undefined);
    }
  };

  return (
    <Modal title="Create A Club" open={open} setOpen={setOpen}>
      <div className="w-full">
        {cover && (
          <img
            className="object-contain max-h-[200px] w-full bg-gray-300 rounded-lg border dark:bg-gray-800 dark:border-gray-700/80"
            loading="lazy"
            src={cover}
            height={"300px"}
            width={"640px"}
            // blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(640, 300))}`}
            alt={"cover"}
          />
        )}
        <div
          ref={drop}
          className={`w-full border-2 py-2 px-3 flex items-center rounded-lg ${
            coverState ? "text-gray-500" : "border-black"
          } my-2`}
        >
          {!coverState && (
            <>
              {/* <PhotographIcon className="w-6 h-6" /> */}
              <div>
                Drop or{" "}
                <button
                  onClick={() => {
                    if (fileInput) fileInput.current.click();
                  }}
                  className="underline underline-offset-1"
                >
                  choose
                </button>{" "}
                your cover image.
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(evt) => {
                    evt.preventDefault();
                    uploadfile(evt.target.files);
                  }}
                  disabled={!!cover}
                />
              </div>
            </>
          )}
          {coverState === "set" && (
            <>
              {/* <PhotographIcon className="w-6 h-6" /> */}
              <div>
                Drop to replace or{" "}
                <button
                  onClick={() => {
                    setCover(undefined);
                    setCoverState(undefined);
                  }}
                  className="underline underline-offset-1"
                >
                  click here to remove
                </button>{" "}
                your cover image.
              </div>
            </>
          )}
          {coverState === "loading" && (
            <>
              {/* <Spinner size="sm" /> */}
              <div>&nbsp;Loading.</div>
            </>
          )}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full p-2 mb-2 font-semibold rounded-md border border-strokes"
        />

        <textarea
          className="mt-1 w-full p-2 h-20 font-semibold  border-solid border-2 border-strokes rounded-md active:border-strokes focus:outline-none focus:shadow-outline grow"
          value={about}
          onChange={(e) => {
            if (about.length <= 100) setAbout(e.target.value);
          }}
          placeholder="Description"
        />
        <span className="opacity-80 mb-1 w-full text-xs">
          {about.length}/100
        </span>
        <div className="relative mb-2 w-full">
          <button
            onClick={() => setShowOption(true)}
            className="w-full rounded-md border border-strokes p-2 flex items-center justify-between"
          >
            {options[option]}
            <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
          {showOption && (
            <div
              className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              role="listbox"
              aria-labelledby="listbox-label"
              aria-activedescendant="listbox-option-3"
            >
              {options.map((option, index) => (
                <div
                  key={index}
                  className="text-gray-900  relative cursor-pointer hover:bg-slate-200 select-none py-2 pl-3 pr-9"
                  id="listbox-option-0"
                  role="option"
                  onClick={() => {
                    setOption(index);
                    setShowOption(false);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
        {option !== 0 && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="NFT address"
            className="w-full p-2 mb-2 font-semibold rounded-md border border-strokes"
          />
        )}

        <Button
          loading={!!loading}
          onClick={generateMetadata}
          block
          className="mx-auto"
        >
          {loading ?? "Create a Club"}{" "}
        </Button>
      </div>
    </Modal>
  );
};
