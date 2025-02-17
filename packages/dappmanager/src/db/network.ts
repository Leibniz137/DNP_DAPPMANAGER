import { dbMain } from "./dbFactory";

const NO_NAT_LOOPBACK = "no-nat-loopback";
const DOUBLE_NAT = "double-nat";
const ALERT_TO_OPEN_PORTS = "alert-to-open-ports";
const INTERNAL_IP = "internal-ip";

export const noNatLoopback = dbMain.staticKey<boolean>(NO_NAT_LOOPBACK, false);
export const doubleNat = dbMain.staticKey<boolean>(DOUBLE_NAT, false);
export const alertToOpenPorts = dbMain.staticKey<boolean>(
  ALERT_TO_OPEN_PORTS,
  false
);
export const internalIp = dbMain.staticKey<string>(INTERNAL_IP, "");
