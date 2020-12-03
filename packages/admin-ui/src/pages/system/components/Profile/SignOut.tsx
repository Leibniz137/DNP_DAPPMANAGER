import React, { useState } from "react";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import { fetchLogout } from "api/auth";
import { ReqStatus } from "types";
import Ok from "components/Ok";

export function SignOut() {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onLogout() {
    try {
      setReqStatus({ loading: true });
      await fetchLogout();
      setReqStatus({ result: true });
      window.location.reload();
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  return (
    <>
      <Button
        className="register-button"
        onClick={onLogout}
        variant="outline-danger"
        disabled={reqStatus.loading}
      >
        Sign out
      </Button>

      {reqStatus.result && <Ok ok msg={"Logged out"}></Ok>}
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </>
  );
}
