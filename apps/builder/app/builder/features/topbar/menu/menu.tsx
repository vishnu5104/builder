import { useStore } from "@nanostores/react";
import {
  theme,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemRightSlot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  Tooltip,
  Kbd,
  menuItemCss,
} from "@webstudio-is/design-system";
import {
  $userPlanFeatures,
  $isCloneDialogOpen,
  $isShareDialogOpen,
  $isPublishDialogOpen,
} from "~/builder/shared/nano-states";
import { cloneProjectUrl, dashboardUrl } from "~/shared/router-utils";
import {
  $authPermit,
  $authToken,
  $authTokenPermissions,
} from "~/shared/nano-states";
import { emitCommand } from "~/builder/shared/commands";
import { MenuButton } from "./menu-button";
import { $isProjectSettingsOpen } from "~/shared/nano-states/seo";
import { UpgradeIcon } from "@webstudio-is/icons";
import { getSetting, setSetting } from "~/builder/shared/client-settings";

const ViewMenuItem = () => {
  const navigatorLayout = getSetting("navigatorLayout");

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>View</DropdownMenuSubTrigger>
      <DropdownMenuSubContent width="regular">
        <DropdownMenuCheckboxItem
          checked={navigatorLayout === "undocked"}
          onSelect={() => {
            const setting =
              navigatorLayout === "undocked" ? "docked" : "undocked";
            setSetting("navigatorLayout", setting);
          }}
        >
          Undock navigator
        </DropdownMenuCheckboxItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

export const Menu = () => {
  const { hasProPlan } = useStore($userPlanFeatures);
  const authPermit = useStore($authPermit);
  const authTokenPermission = useStore($authTokenPermissions);
  const authToken = useStore($authToken);

  const isPublishEnabled = authPermit === "own" || authPermit === "admin";

  const isShareEnabled = authPermit === "own";

  const disabledPublishTooltipContent = isPublishEnabled
    ? undefined
    : "Only owner or admin can publish projects";

  const disabledShareTooltipContent = isShareEnabled
    ? undefined
    : "Only owner can share projects";

  // If authToken is defined, the user is not logged into the current project and must be redirected to the dashboard to clone the project.
  const cloneIsExternal = authToken !== undefined;

  return (
    <DropdownMenu>
      <MenuButton />
      <DropdownMenuPortal>
        <DropdownMenuContent
          sideOffset={4}
          collisionPadding={4}
          width="regular"
        >
          <DropdownMenuItem
            onSelect={() => {
              window.location.href = dashboardUrl({ origin: window.origin });
            }}
          >
            Dashboard
          </DropdownMenuItem>
          <Tooltip side="right" content={undefined}>
            <DropdownMenuItem
              onSelect={() => {
                $isProjectSettingsOpen.set(true);
              }}
            >
              Project Settings
            </DropdownMenuItem>
          </Tooltip>
          <DropdownMenuItem onSelect={() => emitCommand("openBreakpointsMenu")}>
            Breakpoints
          </DropdownMenuItem>
          <ViewMenuItem />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => emitCommand("undo")}>
            Undo
            <DropdownMenuItemRightSlot>
              <Kbd value={["cmd", "z"]} />
            </DropdownMenuItemRightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => emitCommand("redo")}>
            Redo
            <DropdownMenuItemRightSlot>
              <Kbd value={["shift", "cmd", "z"]} />
            </DropdownMenuItemRightSlot>
          </DropdownMenuItem>
          {/* https://github.com/webstudio-is/webstudio/issues/499

          <DropdownMenuItem
            onSelect={() => {
              // TODO
            }}
          >
            Copy
            <DropdownMenuItemRightSlot><Kbd value={["cmd", "c"]} /></DropdownMenuItemRightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              // TODO
            }}
          >
            Paste
            <DropdownMenuItemRightSlot><Kbd value={["cmd", "v"]} /></DropdownMenuItemRightSlot>
          </DropdownMenuItem>

          */}
          <DropdownMenuItem onSelect={() => emitCommand("deleteInstance")}>
            Delete
            <DropdownMenuItemRightSlot>
              <Kbd value={["backspace"]} />
            </DropdownMenuItemRightSlot>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => emitCommand("togglePreview")}>
            Preview
            <DropdownMenuItemRightSlot>
              <Kbd value={["cmd", "shift", "p"]} />
            </DropdownMenuItemRightSlot>
          </DropdownMenuItem>

          <Tooltip
            side="right"
            sideOffset={10}
            content={disabledShareTooltipContent}
          >
            <DropdownMenuItem
              onSelect={() => {
                $isShareDialogOpen.set(true);
              }}
              disabled={isShareEnabled === false}
            >
              Share
            </DropdownMenuItem>
          </Tooltip>

          <Tooltip
            side="right"
            sideOffset={10}
            content={disabledPublishTooltipContent}
          >
            <DropdownMenuItem
              onSelect={() => {
                $isPublishDialogOpen.set(true);
              }}
              disabled={isPublishEnabled === false}
            >
              Publish
            </DropdownMenuItem>
          </Tooltip>

          <Tooltip
            side="right"
            sideOffset={10}
            content={
              authTokenPermission.canClone === false
                ? "Cloning has been disabled by the project owner"
                : undefined
            }
          >
            <DropdownMenuItem
              onSelect={() => {
                if ($authToken.get() === undefined) {
                  $isCloneDialogOpen.set(true);
                  return;
                }
              }}
              disabled={authTokenPermission.canClone === false}
              asChild={cloneIsExternal}
            >
              {cloneIsExternal ? (
                <a
                  className={menuItemCss()}
                  href={cloneProjectUrl({
                    origin: window.origin,
                    sourceAuthToken: authToken,
                  })}
                >
                  Clone
                </a>
              ) : (
                "Clone"
              )}
            </DropdownMenuItem>
          </Tooltip>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => {
              window.open(
                "https://docs.webstudio.is/university/foundations/shortcuts"
              );
            }}
          >
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              window.open("https://docs.webstudio.is");
            }}
          >
            Learn Webstudio
          </DropdownMenuItem>
          {hasProPlan === false && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  window.open("https://webstudio.is/pricing");
                }}
                css={{ gap: theme.spacing[3] }}
              >
                <UpgradeIcon />
                <div>Upgrade to Pro</div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
