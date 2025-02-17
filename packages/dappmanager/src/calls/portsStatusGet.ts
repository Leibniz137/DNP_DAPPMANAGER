import * as db from "../db";
import { PortToOpen } from "../types";
import {
  ApiTablePortStatus,
  UpnpPortMapping,
  UpnpTablePortStatus
} from "../common";
import { performPortsScan } from "../modules/portsTable/performPortsScan";

/**
 * API call that returns the ports status to be displayed in the ports table
 * using UPnP. It is called from the UI only if upnp is enabled
 */
export async function portsUpnpStatusGet({
  portsToOpen
}: {
  portsToOpen: PortToOpen[];
}): Promise<UpnpTablePortStatus[]> {
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get(); // Ports opened, mapped with UPnP

  return portsToOpen.map(port => ({
    port: port.portNumber,
    protocol: port.protocol,
    dnpName: port.dnpName,
    serviceName: port.serviceName,
    status: upnpPortMappings.find(
      upnpPort => parseInt(upnpPort.inPort) === port.portNumber
    )
      ? "open"
      : "closed"
  }));
}

/**
 * API call that returns the ports status to be displayed in the ports table
 * using API scan service
 */
export async function portsApiStatusGet({
  portsToOpen
}: {
  portsToOpen: PortToOpen[];
}): Promise<ApiTablePortStatus[]> {
  const apiTcpPortsStatus = await performPortsScan({
    publicIp: db.publicIp.get(),
    portsToOpen
  });

  return portsToOpen.map(port => {
    const tcpPort =
      port.protocol === "TCP"
        ? apiTcpPortsStatus.find(tcpPort => tcpPort.port === port.portNumber)
        : undefined;
    return {
      port: port.portNumber,
      protocol: port.protocol,
      dnpName: port.dnpName,
      serviceName: port.serviceName,
      status: tcpPort ? tcpPort.status : "unknown",
      message: tcpPort ? tcpPort.message : undefined
    };
  });
}
