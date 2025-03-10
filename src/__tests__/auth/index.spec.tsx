import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ApplicationRoot } from "frontend/components/ApplicationRoot";
import { setupApiHandlers } from "__tests__/_/setupApihandlers";
import SignIn from "pages/auth";
import userEvent from "@testing-library/user-event";
import { JWT_TOKEN_STORAGE_KEY } from "frontend/hooks/auth/auth.store";

setupApiHandlers();

describe("pages/auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should redirect to dashboard when user is authenticated", async () => {
    localStorage.setItem(JWT_TOKEN_STORAGE_KEY, "foo");
    const useRouter = jest.spyOn(require("next/router"), "useRouter");

    const replaceMock = jest.fn();
    useRouter.mockImplementation(() => ({
      replace: replaceMock,
      query: {},
    }));

    render(
      <ApplicationRoot>
        <SignIn />
      </ApplicationRoot>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });

  // Need to be able to tell jest to ignore 401 errors as the test crashes after hitting it
  it.skip("should prompt invalid login when invalid credentials are put in", async () => {
    const useRouter = jest.spyOn(require("next/router"), "useRouter");

    const pushMock = jest.fn();
    useRouter.mockImplementation(() => ({
      push: pushMock,
      query: {},
    }));

    render(
      <ApplicationRoot>
        <SignIn />
      </ApplicationRoot>
    );

    await userEvent.type(
      await screen.findByLabelText("Username"),
      "Invalid Username"
    );
    await userEvent.type(
      await screen.findByLabelText("Password"),
      "Invalid Password"
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Invalid Login"
    );

    expect(localStorage.getItem(JWT_TOKEN_STORAGE_KEY)).toBeNull();

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("should redirect to dashboard when user is succesfully authenticated", async () => {
    const pushMock = jest.fn();
    const useRouter = jest.spyOn(require("next/router"), "useRouter");

    useRouter.mockImplementation(() => ({
      replace: () => {},
      push: pushMock,
      query: {},
    }));

    render(
      <ApplicationRoot>
        <SignIn />
      </ApplicationRoot>
    );

    await userEvent.type(await screen.findByLabelText("Username"), "user");
    await userEvent.type(await screen.findByLabelText("Password"), "password");

    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(localStorage.getItem(JWT_TOKEN_STORAGE_KEY)).toBe(
      "some valid jwt token"
    );

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  describe("Demo Credentials", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    beforeAll(() => {
      localStorage.clear();
    });

    it("should be hidden when NEXT_PUBLIC_IS_DEMO is false", async () => {
      render(
        <ApplicationRoot>
          <SignIn />
        </ApplicationRoot>
      );

      expect(
        screen.queryByLabelText("Demo App Credentials")
      ).not.toBeInTheDocument();
    });

    it("should be shown when NEXT_PUBLIC_IS_DEMO is true", async () => {
      process.env.NEXT_PUBLIC_IS_DEMO = "true";
      render(
        <ApplicationRoot>
          <SignIn />
        </ApplicationRoot>
      );

      expect(screen.getByLabelText("Demo App Credentials")).toHaveTextContent(
        "Username is rootPassword is password"
      );
    });
  });
});
