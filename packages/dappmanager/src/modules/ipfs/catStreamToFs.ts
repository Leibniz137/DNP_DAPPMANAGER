import fs from "fs";
import { isAbsolute } from "path";
import { TimeoutErrorKy } from "./types";
const toStream = require("it-to-stream");

const resolution = 2;
const timeoutMaxDownloadTime = 5 * 60 * 1000;

export interface CatStreamToFsArgs {
  hash: string;
  path: string;
  timeout?: number;
  fileSize?: number;
  progress?: (n: number) => void;
}

/**
 * Streams an IPFS object to the local fs.
 * If the stream does not start within the specified timeout,
 * it will throw and error. This utility does not verify the file
 *
 * @param hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param path "/usr/src/path-to-file/file.ext"
 * @param options Available options:
 * - onChunk: {function} Gets called on every received chuck
 *   function(chunk) {}
 */
export async function catStreamToFs(
  { hash, path, timeout, fileSize, progress }: CatStreamToFsArgs,
  ipfs: any
): Promise<void> {
  return new Promise((resolve, reject): void => {
    if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
      reject(Error(`Invalid path: "${path}"`));

    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(TimeoutErrorKy);
    }, timeout || 30 * 1000);

    const onError = (streamId: string) => (err: Error): void => {
      clearTimeout(timeoutToCancel);
      reject(Error(streamId + ": " + err));
    };

    let totalData = 0;
    let previousProgress = -1;
    const round = (n: number): number =>
      resolution * Math.round((100 * n) / resolution);

    const onData = (chunk: Buffer): void => {
      clearTimeout(timeoutToCancel);
      totalData += chunk.length;
      if (progress && fileSize) {
        const currentProgress = round(totalData / fileSize);
        if (currentProgress !== previousProgress) {
          progress(currentProgress);
          previousProgress = currentProgress;
        }
      }
    };

    const onFinish = (): void => {
      clearTimeout(timeoutToCancel);
      resolve();
    };

    // IPFS native timeout will interrupt a working but slow stream
    // Use a max higher timeout that the one to check availability
    const readable = toStream.readable(
      ipfs.cat(hash, { timeout: timeoutMaxDownloadTime })
    );

    const readStream = readable
      .on("data", onData)
      .on("error", onError("ReadableStream"));
    const writeStream = fs
      .createWriteStream(path)
      .on("finish", onFinish)
      .on("error", onError("WriteStream"));
    readStream.pipe(writeStream);
  });
}
