import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ApplicationRoot } from "frontend/components/ApplicationRoot";
import userEvent from "@testing-library/user-event";
import UserPreferences from "pages/account/preferences";

import { setupApiHandlers } from "__tests__/_/setupApihandlers";

setupApiHandlers();

describe("pages/account/preferences", () => {
  beforeAll(() => {
    const useRouter = jest.spyOn(require("next/router"), "useRouter");
    useRouter.mockImplementation(() => ({
      asPath: "/",
    }));
  });

  it("should display user preferences", async () => {
    render(
      <ApplicationRoot>
        <UserPreferences />
      </ApplicationRoot>
    );
    await waitFor(() => {
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        "Dark"
      );
    });
  });

  it("should update user preference", async () => {
    render(
      <ApplicationRoot>
        <UserPreferences />
      </ApplicationRoot>
    );
    await userEvent.click(screen.getByRole("option", { name: "Light" }));

    await userEvent.click(
      screen.getByRole("button", { name: "Save Account Preferences" })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Theme Preference Saved Successfully"
    );
  });

  it("should display updated preference", async () => {
    render(
      <ApplicationRoot>
        <UserPreferences />
      </ApplicationRoot>
    );
    await waitFor(() => {
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        "Light"
      );
    });
  });
});
