import { render, screen } from "@testing-library/react";
import {
  INavigationMenuItem,
  NavigationMenuItemType,
  SystemLinks,
} from "shared/types/menu";
import userEvent from "@testing-library/user-event";
import { ApplicationRoot } from "frontend/components/ApplicationRoot";
import { rest } from "msw";
import { BASE_TEST_URL } from "__tests__/_/api-handlers/_utils";
import { setupApiHandlers } from "__tests__/_/setupApihandlers";
import { SideBar } from "../SideBar";

const server = setupApiHandlers();

const navigationItems: INavigationMenuItem[] = [
  {
    id: "1",
    title: "External Link",
    type: NavigationMenuItemType.ExternalLink,
    link: "https://external.com",
  },
  {
    id: "2",
    title: "Header",
    type: NavigationMenuItemType.Header,
  },
  {
    id: "3",
    title: "Settings",
    type: NavigationMenuItemType.System,
    link: SystemLinks.Settings,
  },
  {
    id: "4",
    title: "Entity",
    type: NavigationMenuItemType.Entities,
    link: "some-where",
    children: [
      {
        id: "5",
        title: "Entity Table",
        type: NavigationMenuItemType.Entities,
        link: "entity-id",
      },
      {
        id: "6",
        title: "Entity Dashboard",
        type: NavigationMenuItemType.Dashboard,
        link: "entity-id",
      },
    ],
  },
];

describe("<RenderNavigation />", () => {
  server.use(
    rest.get(BASE_TEST_URL("/api/menu"), async (_, res, ctx) => {
      return res(ctx.json(navigationItems));
    })
  );

  it("should render all first level items", async () => {
    render(
      <ApplicationRoot>
        <SideBar isFullWidth setIsFullWidth={jest.fn()} />
      </ApplicationRoot>
    );

    expect(await screen.findByText("Header")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/settings/entities"
    );

    expect(screen.getByRole("link", { name: "External Link" })).toHaveAttribute(
      "href",
      "https://external.com"
    );
  });

  it("should hide the menu items when is not full width", async () => {
    render(
      <ApplicationRoot>
        <SideBar isFullWidth={false} setIsFullWidth={jest.fn()} />
      </ApplicationRoot>
    );

    expect(screen.queryByText("Header")).not.toBeVisible();

    expect(
      screen.queryByRole("link", { name: "Settings" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Entity" })
    ).not.toBeInTheDocument();
  });

  it("should render second level items when pressed", async () => {
    render(
      <ApplicationRoot>
        <SideBar isFullWidth setIsFullWidth={jest.fn()} />
      </ApplicationRoot>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Entity Table" })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Entity" }));

    expect(screen.getByRole("link", { name: "Entity Table" })).toHaveAttribute(
      "href",
      "/admin/entity-id"
    );

    await userEvent.click(screen.getByRole("button", { name: "Entity" }));

    expect(
      screen.queryByRole("link", { name: "Entity Table" })
    ).not.toBeInTheDocument();
  });
});
