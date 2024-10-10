import { Grid, theme } from "@webstudio-is/design-system";
import { useRef, useState } from "react";
import { movementMapInset, useKeyboardNavigation } from "../shared/keyboard";
import { createBatchUpdate, deleteProperty } from "../../shared/use-style-data";
import { getInsetModifiersGroup, useScrub } from "../shared/scrub";
import { ValueText } from "../shared/value-text";
import type { StyleValue } from "@webstudio-is/css-engine";
import { InputPopover } from "../shared/input-popover";
import { InsetLayout, type InsetProperty } from "./inset-layout";
import { InsetTooltip } from "./inset-tooltip";
import { useComputedStyleDecl, useComputedStyles } from "../../shared/model";

const Cell = ({
  scrubStatus,
  property,
  onHover,
  isPopoverOpen,
  onPopoverClose,
}: {
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  scrubStatus: ReturnType<typeof useScrub>;
  property: InsetProperty;
  onHover: (target: HoverTarget | undefined) => void;
}) => {
  const styleDecl = useComputedStyleDecl(property);
  const finalValue: StyleValue | undefined =
    (scrubStatus.isActive && scrubStatus.values[property]) ||
    styleDecl.cascadedValue;

  return (
    <>
      <InputPopover
        styleSource={styleDecl.source.name}
        value={finalValue}
        isOpen={isPopoverOpen}
        property={property}
        onClose={onPopoverClose}
      />
      <InsetTooltip property={property} preventOpen={scrubStatus.isActive}>
        <ValueText
          css={{
            // We want value to have `default` cursor to indicate that it's clickable,
            // unlike the rest of the value area that has cursor that indicates scrubbing.
            // Click and scrub works everywhere anyway, but we want cursors to be different.
            //
            // In order to have control over cursor we're setting pointerEvents to "all" here
            // because SpaceLayout sets it to "none" for cells' content.
            pointerEvents: "all",
          }}
          value={finalValue}
          source={styleDecl.source.name}
          onMouseEnter={(event) =>
            onHover({ property, element: event.currentTarget })
          }
          onMouseLeave={() => onHover(undefined)}
        />
      </InsetTooltip>
    </>
  );
};

type HoverTarget = {
  element: HTMLElement;
  property: InsetProperty;
};

export const InsetControl = () => {
  const styles = useComputedStyles(["top", "right", "bottom", "left"]);
  const [hoverTarget, setHoverTarget] = useState<HoverTarget>();

  const scrubStatus = useScrub({
    value: styles.find(
      (styleDecl) => styleDecl.property === hoverTarget?.property
    )?.usedValue,
    target: hoverTarget,
    getModifiersGroup: getInsetModifiersGroup,
    onChange: (values, options) => {
      const batch = createBatchUpdate();
      for (const property of ["top", "right", "bottom", "left"] as const) {
        const value = values[property];
        if (value !== undefined) {
          batch.setProperty(property)(value);
        }
      }
      batch.publish(options);
    },
  });

  const [openProperty, setOpenProperty] = useState<InsetProperty>();

  const layoutRef = useRef<HTMLDivElement>(null);

  const keyboardNavigation = useKeyboardNavigation({
    onOpen: setOpenProperty,
    movementMap: movementMapInset,
  });

  // by deafult highlight hovered or scrubbed properties
  let activeProperties = scrubStatus.properties;

  // if keyboard navigation is active, highlight its active property
  if (keyboardNavigation.isActive) {
    activeProperties = [keyboardNavigation.activeProperty];
  }

  // if popover is open, highlight its property and hovered properties
  if (openProperty !== undefined) {
    activeProperties = [openProperty, ...scrubStatus.properties];
  }

  const handleHover = (target: HoverTarget | undefined) => {
    setHoverTarget(target);
    keyboardNavigation.handleHover(target?.property);
  };

  return (
    <Grid
      ref={layoutRef}
      tabIndex={0}
      css={{
        // Create stacking context to prevent z-index issues with internal z-indexes
        zIndex: 0,
        // InputPopover is not working properly without position relative
        position: "relative",
        width: theme.spacing[22],
        height: theme.spacing[18],
        "&:focus-visible": {
          borderRadius: theme.borderRadius[3],
          outline: `2px solid ${theme.colors.blue10}`,
        },
      }}
      onFocus={keyboardNavigation.handleFocus}
      onBlur={keyboardNavigation.handleBlur}
      onKeyDown={keyboardNavigation.handleKeyDown}
      onMouseMove={keyboardNavigation.handleMouseMove}
      onMouseLeave={keyboardNavigation.handleMouseLeave}
      onClick={(event) => {
        const property = hoverTarget?.property;
        if (event.altKey && property) {
          deleteProperty(property);
          return;
        }
        setOpenProperty(property);
      }}
    >
      <InsetLayout
        activeProperties={activeProperties}
        renderCell={(property) => (
          <Cell
            scrubStatus={scrubStatus}
            property={property}
            onHover={handleHover}
            isPopoverOpen={openProperty === property}
            onPopoverClose={() => {
              if (openProperty === property) {
                setOpenProperty(undefined);
                layoutRef.current?.focus();
              }
            }}
          />
        )}
        onHover={handleHover}
      />
    </Grid>
  );
};
