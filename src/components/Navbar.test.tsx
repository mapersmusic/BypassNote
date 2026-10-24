import { fireEvent, render, screen } from "@testing-library/react-native";

import { IconDownload } from "./icons";
import { Navbar } from "./Navbar";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  usePathname: () => "/",
}));

jest.mock("@/hooks/use-breakpoint", () => ({
  useIsWide: () => false,
}));

describe("Navbar", () => {
  it("referme le menu après avoir lancé une action", () => {
    const onPress = jest.fn();

    render(
      <Navbar
        actions={[
          { key: "export", label: "Exporter .bpnote", icon: IconDownload, onPress },
        ]}
      />,
    );

    fireEvent.press(screen.getByLabelText("Ouvrir le menu"));
    fireEvent.press(screen.getByText("Exporter .bpnote"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Menu")).toBeNull();
  });
});
