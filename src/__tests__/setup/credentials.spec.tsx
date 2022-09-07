import * as React from "react";
import { render, screen } from "@testing-library/react";
import { AppWrapper } from "@hadmean/chromista";
import { setupApiHandlers } from "__tests__/_/setupApihandlers";
import { rest } from "msw";
import { BASE_TEST_URL } from "__tests__/_/api-handlers/_utils";
import CredentialsSetup from "pages/setup/credentials";

const server = setupApiHandlers();

describe("pages/setup/credentials", () => {
  const useRouter = jest.spyOn(require("next/router"), "useRouter");

  beforeAll(() => {
    localStorage.clear();
  });

  it("should render form when there is no DB credentials", async () => {
    server.resetHandlers();
    localStorage.clear();
    const replaceMock = jest.fn();
    useRouter.mockImplementation(() => ({
      replace: replaceMock,
    }));

    server.use(
      rest.get(BASE_TEST_URL("/api/setup/check"), async (_, res, ctx) => {
        return res(
          ctx.json({
            hasUsers: false,
            hasDbCredentials: false,
          })
        );
      })
    );

    render(
      <AppWrapper>
        <CredentialsSetup />
      </AppWrapper>
    );

    expect(await screen.findByText("Setup DB credentials")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
