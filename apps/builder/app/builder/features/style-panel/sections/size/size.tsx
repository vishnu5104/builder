import { propertyDescriptions } from "@webstudio-is/css-data";
import type { StyleProperty } from "@webstudio-is/css-engine";
import {
  Flex,
  Grid,
  IconButton,
  Separator,
  styled,
} from "@webstudio-is/design-system";
import { PositionControl, SelectControl, TextControl } from "../../controls";
import {
  EyeconOpenIcon,
  EyeconClosedIcon,
  ScrollIcon,
  AutoScrollIcon,
  EllipsesIcon,
} from "@webstudio-is/icons";
import { StyleSection } from "../../shared/style-section";
import { theme } from "@webstudio-is/design-system";
import { ToggleGroupControl } from "../../controls/toggle-group/toggle-group-control";
import { FloatingPanel } from "~/builder/shared/floating-panel";
import { humanizeString } from "~/shared/string-utils";
import { PropertyLabel } from "../../property-label";
import { useComputedStyleDecl } from "../../shared/model";
import { deleteProperty } from "../../shared/use-style-data";

const SizeProperty = ({ property }: { property: StyleProperty }) => {
  return (
    <Grid gap={1}>
      <PropertyLabel
        label={humanizeString(property)}
        description={
          propertyDescriptions[property as keyof typeof propertyDescriptions]
        }
        properties={[property]}
      />
      <TextControl property={property} />
    </Grid>
  );
};

const ObjectPosition = () => {
  const styleDecl = useComputedStyleDecl("objectPosition");
  return (
    <Flex justify="end">
      <FloatingPanel
        title="Object Position"
        content={
          <Flex css={{ px: theme.spacing[9], py: theme.spacing[5] }}>
            <PositionControl property="objectPosition" styleDecl={styleDecl} />
          </Flex>
        }
      >
        <IconButton
          variant={styleDecl.source.name}
          onClick={(event) => {
            if (event.altKey) {
              event.preventDefault();
              deleteProperty("objectPosition");
            }
          }}
        >
          <EllipsesIcon />
        </IconButton>
      </FloatingPanel>
    </Flex>
  );
};

export const properties = [
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "overflowX",
  "overflowY",
  "objectFit",
  "objectPosition",
  "aspectRatio",
] satisfies Array<StyleProperty>;

const SectionLayout = styled(Grid, {
  columnGap: theme.spacing[5],
  rowGap: theme.spacing[5],
  px: theme.spacing[9],
});

export const Section = () => {
  return (
    <StyleSection label="Size" properties={properties} fullWidth>
      <SectionLayout columns={2}>
        <SizeProperty property="width" />
        <SizeProperty property="height" />
        <SizeProperty property="minWidth" />
        <SizeProperty property="minHeight" />
        <SizeProperty property="maxWidth" />
        <SizeProperty property="maxHeight" />
        <PropertyLabel
          label="Aspect Ratio"
          description={propertyDescriptions.aspectRatio}
          properties={["aspectRatio"]}
        />
        <TextControl property="aspectRatio" />
      </SectionLayout>
      <Separator />
      <SectionLayout columns={2}>
        <PropertyLabel
          label="Overflow"
          description={propertyDescriptions.overflow}
          properties={["overflowX", "overflowY"]}
        />
        <ToggleGroupControl
          label="Overflow"
          properties={["overflowX", "overflowY"]}
          items={[
            {
              child: <EyeconOpenIcon />,
              description:
                "Content is fully visible and extends beyond the container if it exceeds its size.",
              value: "visible",
            },
            {
              child: <EyeconClosedIcon />,
              description:
                "Content that exceeds the container's size is clipped and hidden without scrollbars.",
              value: "hidden",
            },
            {
              child: <ScrollIcon />,
              description:
                "Scrollbars are added to the container, allowing users to scroll and view the exceeding content.",
              value: "scroll",
            },

            {
              child: <AutoScrollIcon />,
              description:
                "Scrollbars are added to the container only when necessary, based on the content size.",
              value: "auto",
            },
          ]}
        />
        <PropertyLabel
          label="Object Fit"
          description={propertyDescriptions.objectFit}
          properties={["objectFit"]}
        />
        <SelectControl property="objectFit" />
        <PropertyLabel
          label="Object Position"
          description={propertyDescriptions.objectPosition}
          properties={["objectPosition"]}
        />
        <ObjectPosition />
      </SectionLayout>
    </StyleSection>
  );
};
