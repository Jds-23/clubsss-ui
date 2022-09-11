import { storeFile } from "./storeFile";

const uploadAssetToIPFS = async (data: any): Promise<string | undefined> => {
  try {
    const attachments = [];
    for (let i = 0; i < data.length; i++) {
      let file = data.item(i);
      //   const formData = new FormData();
      //   formData.append("file", file, "img");
      //   const upload = await fetch("https://ipfs.infura.io:5001/api/v0/add", {
      //     method: "POST",
      //     body: formData,
      //   });
      //   const { Hash }: { Hash: string } = await upload.json();
      const res = await storeFile(file, file?.name ?? "some");

      if (res?.gatewayURL)
        attachments.push({
          item: res?.gatewayURL,
          type: file.type,
        });
    }

    return attachments[0].item;
  } catch {
    return undefined;
  }
};
export default uploadAssetToIPFS;
