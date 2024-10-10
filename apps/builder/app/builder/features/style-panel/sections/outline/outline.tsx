import { theme, Grid, Box } from "@webstudio-is/design-system";
import {
  DashBorderIcon,
  DashedBorderIcon,
  DottedBorderIcon,
  SmallXIcon,
} from "@webstudio-is/icons";
import { propertyDescriptions } from "@webstudio-is/css-data";
import { toValue, type StyleProperty } from "@webstudio-is/css-engine";
import { ColorControl, TextControl } from "../../controls";
import { StyleSection } from "../../shared/style-section";
import { PropertyLabel } from "../../property-label";
import { useComputedStyleDecl } from "../../shared/model";
import { ToggleGroupControl } from "../../controls/toggle-group/toggle-group-control";

export const properties = [
  "outlineStyle",
  "outlineColor",
  "outlineWidth",
  "outlineOffset",
] satisfies Array<StyleProperty>;

export const Section = () => {
  const outlineStyle = useComputedStyleDecl("outlineStyle");
  const outlineStyleValue = toValue(outlineStyle.cascadedValue);

  return (
    <StyleSection label="Outline" properties={properties}>
      <Grid
        css={{
          // label gap (input gap expand)
          gridTemplateColumns: `1fr calc(${theme.spacing[20]} + ${theme.spacing[5]} + ${theme.spacing[12]})`,
        }}
        gap={2}
      >
        <PropertyLabel
          label="Style"
          description={propertyDescriptions.outlineStyle}
          properties={["outlineStyle"]}
        />
        <Box css={{ justifySelf: "end" }}>
          <ToggleGroupControl
            label="Style"
            properties={["outlineStyle"]}
            items={[
              { child: <SmallXIcon />, value: "none" },
              { child: <DashBorderIcon />, value: "solid" },
              { child: <DashedBorderIcon />, value: "dashed" },
              { child: <DottedBorderIcon />, value: "dotted" },
            ]}
          />
        </Box>

        {outlineStyleValue !== "none" && (
          <>
            <PropertyLabel
              label="Color"
              description={propertyDescriptions.outlineColor}
              properties={["outlineColor"]}
            />
            <ColorControl property="outlineColor" />
            <PropertyLabel
              label="Width"
              description={propertyDescriptions.outlineWidth}
              properties={["outlineWidth"]}
            />
            <TextControl property="outlineWidth" />
            <PropertyLabel
              label="Offset"
              description={propertyDescriptions.outlineOffset}
              properties={["outlineOffset"]}
            />
            <TextControl property="outlineOffset" />
          </>
        )}
      </Grid>
    </StyleSection>
  );
};
