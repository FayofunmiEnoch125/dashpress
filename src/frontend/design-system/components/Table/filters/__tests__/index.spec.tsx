import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FilterOperators, IColumnFilterBag } from "shared/types/data";
import { TableFilter } from "..";
import { TableFilterType } from "../types";

const setFilterValueJestFn = jest.fn();

function TestComponent({
  type,
  defaultValue = {},
}: {
  defaultValue?: IColumnFilterBag<any>;
  type: TableFilterType;
}) {
  const [state, setState] = useState(defaultValue);
  return (
    <TableFilter
      type={type}
      column={{
        setFilterValue: (value) => {
          setState(value);
          setFilterValueJestFn(value);
        },
        getFilterValue: () => state,
      }}
      view="Test Column"
      debounceWait={100}
    />
  );
}

describe("Table Filters", () => {
  describe("Strings", () => {
    const type = { _type: "string", bag: undefined } as const;

    it("should have the correct options", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Search")
      );

      expect(screen.getAllByRole("option").map((option) => option.textContent))
        .toMatchInlineSnapshot(`
          [
            "Contains",
            "Equal To",
            "Not Equal To",
          ]
        `);
    });

    it("should filter by value correctly", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Search")
      );

      await userEvent.type(screen.getByPlaceholderText("Search"), "Hello");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "c",
          value: "Hello",
        });
      });

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Filter Operator" }),
        "Equal To"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: "Hello",
        });
      });
    });

    it("should render default value correctly", async () => {
      render(
        <TestComponent
          defaultValue={{
            operator: FilterOperators.NOT_EQUAL,
            value: "Default Value",
          }}
          type={type}
        />
      );

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Search Is Active")
      );

      expect(screen.getByPlaceholderText("Search")).toHaveValue(
        "Default Value"
      );
      expect(
        screen.getByRole("combobox", { name: "Select Filter Operator" })
      ).toHaveValue("n");

      await userEvent.type(screen.getByPlaceholderText("Search"), " Updated");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "n",
          value: "Default Value Updated",
        });
      });
    });
  });

  describe("Numbers", () => {
    const type = { _type: "number", bag: undefined } as const;

    it("should have the correct options", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Number")
      );

      expect(screen.getAllByRole("option").map((option) => option.textContent))
        .toMatchInlineSnapshot(`
        [
          "Equal To",
          "Not Equal To",
          "Between",
          "Greater Than",
          "Less Than",
        ]
      `);
    });

    it("should filter by value correctly", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Number")
      );

      await userEvent.type(
        screen.getByRole("spinbutton", { name: "Value 1" }),
        "123"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: 123,
        });
      });

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Filter Operator" }),
        "Between"
      );

      await userEvent.type(
        screen.getByRole("spinbutton", { name: "Value 2" }),
        "456"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "b",
          value: 123,
          value2: 456,
        });
      });
    });

    it("should render default value correctly", async () => {
      render(
        <TestComponent
          defaultValue={{
            operator: FilterOperators.BETWEEN,
            value: "56",
            value2: "78",
          }}
          type={type}
        />
      );

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Number Is Active")
      );

      expect(screen.getByRole("spinbutton", { name: "Value 1" })).toHaveValue(
        56
      );

      expect(screen.getByRole("spinbutton", { name: "Value 2" })).toHaveValue(
        78
      );

      expect(
        screen.getByRole("combobox", { name: "Select Filter Operator" })
      ).toHaveValue("b");

      await userEvent.type(
        screen.getByRole("spinbutton", { name: "Value 1" }),
        "1"
      );
      await userEvent.type(
        screen.getByRole("spinbutton", { name: "Value 2" }),
        "2"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "b",
          value: 561,
          value2: 782,
        });
      });
    });
  });

  describe("Id", () => {
    const type = { _type: "idField", bag: undefined } as const;

    it("should have the correct options", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(screen.getByLabelText("Filter Test Column By Id"));

      expect(
        screen
          .getAllByRole("option", { hidden: true })
          .map((option) => option.textContent)
      ).toMatchInlineSnapshot(`
          [
            "Equal To",
          ]
        `);
    });

    it("should filter by value correctly", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(screen.getByLabelText("Filter Test Column By Id"));

      await userEvent.type(screen.getByPlaceholderText("Enter value"), "12345");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: "12345",
        });
      });

      expect(
        screen.queryByRole("combobox", { name: "Select Filter Operator" })
      ).not.toBeInTheDocument();
    });

    it("should render default value correctly", async () => {
      render(
        <TestComponent
          defaultValue={{
            operator: FilterOperators.EQUAL_TO,
            value: "789",
          }}
          type={type}
        />
      );

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Id Is Active")
      );

      expect(screen.getByPlaceholderText("Enter value")).toHaveValue("789");

      await userEvent.type(screen.getByPlaceholderText("Enter value"), "0");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: "7890",
        });
      });
    });
  });

  describe("Boolean", () => {
    const type: TableFilterType = {
      _type: "boolean",
      bag: [
        {
          label: "True Option",
          value: true,
        },
        {
          label: "False Option",
          value: false,
        },
      ],
    };

    it("should have the correct options", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Boolean")
      );

      expect(screen.getAllByRole("option").map((option) => option.textContent))
        .toMatchInlineSnapshot(`
        [
          "-- Select State --",
          "True Option",
          "False Option",
        ]
      `);
    });

    it("should filter by value correctly", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Boolean")
      );

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Boolean" }),
        "True Option"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: true,
        });
      });

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Boolean" }),
        "False Option"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: false,
        });
      });

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Boolean" }),
        "-- Select State --"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
        });
      });

      expect(
        screen.queryByRole("combobox", { name: "Select Filter Operator" })
      ).not.toBeInTheDocument();
    });

    it("should render default value correctly", async () => {
      render(
        <TestComponent
          defaultValue={{
            operator: FilterOperators.EQUAL_TO,
            value: false,
          }}
          type={type}
        />
      );

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Boolean Is Active")
      );

      expect(
        screen.getByRole("combobox", { name: "Select Boolean" })
      ).toHaveValue("false");

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Boolean" }),
        "True Option"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "e",
          value: true,
        });
      });
    });
  });

  describe("Status", () => {
    const type: TableFilterType = {
      _type: "status",
      bag: [
        {
          label: "Option 1 Label",
          value: "option-1",
        },
        {
          label: "Option 2 Label",
          value: "option-2",
        },
        {
          label: "Option 3 Label",
          value: "option-3",
        },
      ],
    };

    it("should have the correct options", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Status")
      );

      expect(screen.getAllByRole("option").map((option) => option.textContent))
        .toMatchInlineSnapshot(`
        [
          "In",
          "Not In",
        ]
      `);
    });

    it("should filter by value correctly", async () => {
      render(<TestComponent type={type} />);

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Status")
      );

      await userEvent.type(
        await screen.findByLabelText("Select Status"),
        "Option 1 Label"
      );

      await userEvent.keyboard("{Enter}");

      await userEvent.type(
        await screen.findByLabelText("Select Status"),
        "Option 2 Label"
      );

      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "i",
          value: ["option-1", "option-2"],
        });
      });

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Select Filter Operator" }),
        "Not In"
      );

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "t",
          value: ["option-1", "option-2"],
        });
      });
    });

    it("should render default value correctly", async () => {
      render(
        <TestComponent
          defaultValue={{
            operator: FilterOperators.NOT_IN,
            value: ["option-3"],
          }}
          type={type}
        />
      );

      await userEvent.click(
        screen.getByLabelText("Filter Test Column By Status Is Active")
      );

      await userEvent.type(
        await screen.findByLabelText("Select Status"),
        "Option 1 Label"
      );

      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
          operator: "t",
          value: ["option-3", "option-1"],
        });
      });
    });
  });

  it("should clear filters", async () => {
    render(<TestComponent type={{ _type: "string", bag: undefined }} />);

    await userEvent.click(
      screen.getByLabelText("Filter Test Column By Search")
    );

    await userEvent.type(screen.getByPlaceholderText("Search"), "Hello");

    await waitFor(() => {
      expect(setFilterValueJestFn).toHaveBeenLastCalledWith({
        operator: "c",
        value: "Hello",
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(setFilterValueJestFn).toHaveBeenLastCalledWith(undefined);
    });
  });
});
