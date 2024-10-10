import { Text } from "./text";

const isMac =
  typeof navigator === "object" ? /mac/i.test(navigator.platform) : false;

const shortcutSymbolMap: Record<string, string> = {
  cmd: "⌘",
  ctrl: "⌃",
  shift: "⇧",
  option: "⌥",
  backspace: "⌫",
  click: "+click",
};

const shortcutWinMap: Record<string, string> = {
  cmd: "ctrl",
};

type ShortcutDefinition = Array<string>;

// @todo check what linux needs
// Converts commands to OS specific equivalent, e.g. cmd on mac to ctrl on win
const mapToOs = (value: ShortcutDefinition) => {
  if (isMac) {
    return value;
  }
  return value.map((key) => shortcutWinMap[key] || key);
};

const format = (value: ShortcutDefinition) => {
  return mapToOs(value).map(
    (shortcut) => shortcutSymbolMap[shortcut] ?? shortcut.toUpperCase()
  );
};

export const Kbd = ({
  value,
  color = "subtle",
}: {
  value: ShortcutDefinition;
  color?: "subtle" | "moreSubtle";
}) => {
  return (
    <Text color={color} as="kbd">
      {format(value)}
    </Text>
  );
};
