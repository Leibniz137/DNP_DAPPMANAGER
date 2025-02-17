import fetch from "node-fetch";
import { urlJoin } from "../../utils/url";
import params from "../../params";
import { packageSetEnvironment } from "../../calls/packageSetEnvironment";
import { ComposeFileEditor } from "../compose/editor";

const {
  WIREGUARD_API_URL,
  WIREGUARD_DEVICES_ENVNAME,
  WIREGUARD_DNP_NAME,
  WIREGUARD_ISCORE,
  WIREGUARD_MAIN_SERVICE
} = params;

export class WireguardClient {
  getDevices(): string[] {
    // Why not fetch the ENVs from a container inspect > config ??
    // ENVs that are not declared in the compose will show up (i.e. PATH)
    // So it's easier and cleaner to just parse the docker-compose.yml
    const compose = new ComposeFileEditor(WIREGUARD_DNP_NAME, WIREGUARD_ISCORE);
    const service = compose.services()[WIREGUARD_MAIN_SERVICE];
    if (!service)
      throw Error(`Wireguard service ${WIREGUARD_MAIN_SERVICE} does not exist`);
    const peersCsv = service.getEnvs()[WIREGUARD_DEVICES_ENVNAME] || "";
    return peersCsv.split(",");
  }

  async addDevice(device: string): Promise<void> {
    if (!device) throw Error("Device name must not be empty");
    if (!/^[a-z0-9]+$/i.test(device))
      throw Error("Device name must contain only alphanumeric characters");

    const devices = new Set(this.getDevices());
    if (devices.has(device)) throw Error(`Device ${device} already exists`);
    devices.add(device);
    await this.setDevices(Array.from(devices.values()));
  }

  async removeDevice(device: string): Promise<void> {
    const devices = new Set(this.getDevices());
    const removed = devices.delete(device);
    if (!removed) throw Error(`Device ${device} does not exist`);
    await this.setDevices(Array.from(devices.values()));
  }

  private async setDevices(devices: string[]): Promise<void> {
    await packageSetEnvironment({
      dnpName: WIREGUARD_DNP_NAME,
      environmentByService: {
        [WIREGUARD_MAIN_SERVICE]: {
          [WIREGUARD_DEVICES_ENVNAME]: devices.join(",")
        }
      }
    });
  }

  async getDeviceCredentials(device: string): Promise<{ config: string }> {
    const configUrl = urlJoin(WIREGUARD_API_URL, device);
    const res = await fetch(configUrl);
    const body = await res.text();
    if (res.status === 404) throw Error(`Device not found`);
    if (!res.ok)
      throw Error(`Error fetching credentials: ${res.statusText} ${body}`);
    return { config: body };
  }
}
