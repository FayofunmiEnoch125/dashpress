import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ApplicationRoot } from "frontend/components/ApplicationRoot";
import VersionInfo from "pages/admin/settings/versions";

import { setupApiHandlers } from "__tests__/_/setupApihandlers";

setupApiHandlers();

describe("pages/admin/settings/version", () => {
  beforeAll(() => {
    const useRouter = jest.spyOn(require("next/router"), "useRouter");
    useRouter.mockImplementation(() => ({
      asPath: "/",
    }));
  });

  it("should display system info", async () => {
    render(
      <ApplicationRoot>
        <VersionInfo />
      </ApplicationRoot>
    );
    await waitFor(() => {
      expect(screen.getByText("key1")).toBeInTheDocument();
    });
    expect(screen.getByText("key2")).toBeInTheDocument();
    expect(screen.getByText("key3")).toBeInTheDocument();

    expect(screen.getByText("value1")).toBeInTheDocument();
    expect(screen.getByText("value2")).toBeInTheDocument();
    expect(screen.getByText("value3")).toBeInTheDocument();
  });
});
