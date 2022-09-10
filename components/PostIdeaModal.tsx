import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsonFile, storeFile } from "../utils/storeFile";
import Button from "./Button";
import Modal from "./Modal";

export const PostIdeaModal = ({
    setOpen,
    open,
    title,
    mintIdea,
    idea,
    setIdea,
    mintingIdea,
  }: {
    setOpen: (arg: boolean) => void;
    open: boolean;
    idea: string;
    setIdea: (arg: string) => void;
    title: string;
    mintIdea: (idea: string, metadata: string, deadline: string) => Promise<void>;
    mintingIdea: boolean;
  }) => {
    const [endTime, setEndTime] = useState("");
    const [textEdit, setTextEdit] = useState(true);
    const [loading, setLoading] = useState(false);
    const [about, setAbout] = useState("");
    const [currentTime, setCurrentTime] = useState(
      new Date(Date.now()).toISOString()
    );
    useEffect(() => {
      function tick() {
        setCurrentTime(new Date(Date.now()).toISOString());
      }
      let id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, [currentTime]);
    const generateMetadata = async () => {
      try {
        setLoading(true);
        const data = jsonFile("metadata.json", {
          title,
          about,
        });
        const res = await storeFile(data, "metadata.json");
        console.log(res);
        setLoading(false);
        if (res) {
          setOpen(false);
          mintIdea(idea, res?.cid, endTime);
          setIdea("");
          setAbout("");
          return res;
        }
        return undefined;
      } catch (err) {
        setLoading(false);
        console.log(err);
        setOpen(false);
        mintIdea(idea, "", endTime);
        setIdea("");
        setAbout("");
      }
    };
    return (
      <Modal open={open} setOpen={setOpen} title={title}>
        <span className="text-sm font-semibold opacity-80">Title</span>
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Mint a idea"
          className="w-full p-2 font-semibold rounded-md border border-strokes"
        />
        <span className="mt-1 text-sm font-semibold opacity-80">Deadline</span>
        <input
          className="mb-1 w-full p-2 border-solid border-2 border-strokes rounded-md active:border-strokes focus:outline-none focus:shadow-outline grow"
          type="datetime-local"
          min={currentTime.substring(0, 16)}
          //   value={record}
          placeholder="Date"
          onChange={(e) => {
            const date = new Date(e.target.value);
            setEndTime((date.getTime() / 1000).toString());
            // console.log(e.target.value,(date.getTime()/1000))
          }}
        />
        <div className="w-full mt-1 flex justify-between items-center">
          <span className=" text-sm font-semibold opacity-80">About</span>
          <Button
            onClick={() => setTextEdit(!textEdit)}
            className=" p-1 text-xs font-semibold opacity-80"
          >
            {!textEdit ? "📝 Edit" : "📰 Preview"}
          </Button>
        </div>
        {textEdit ? (
          <textarea
            className="mt-1 w-full p-2 h-32  border-solid border-2 border-strokes rounded-md active:border-strokes focus:outline-none focus:shadow-outline grow"
            value={about}
            onChange={(e) => {
              if (about.length <= 500) setAbout(e.target.value);
            }}
            placeholder="About (Markdown supported 📝)"
          />
        ) : (
          <div className="mt-1 w-full p-2 h-32 markdown-style border-solid border-2 border-strokes rounded-md active:border-strokes focus:outline-none focus:shadow-outline grow">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{about}</ReactMarkdown>
          </div>
        )}
        <span className="opacity-80 mb-1 w-full text-xs">{about.length}/500</span>
        <Button
          loading={loading}
          block
          onClick={() => {
            if (idea.length > 0) {
              generateMetadata();
            }
          }}
        >
          {loading ? "Cooking the Idea 💡" : "Mint Idea 💡"}
        </Button>
      </Modal>
    );
  };