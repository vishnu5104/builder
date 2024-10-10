import { colord } from "colord";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "@nanostores/react";
import { computed } from "nanostores";
import { matchSorter } from "match-sorter";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";
import { PlusIcon } from "@webstudio-is/icons";
import {
  Box,
  Combobox,
  Flex,
  Label,
  SectionTitle,
  SectionTitleButton,
  SectionTitleLabel,
  Text,
  theme,
  Tooltip,
} from "@webstudio-is/design-system";
import {
  properties as propertiesData,
  propertyDescriptions,
} from "@webstudio-is/css-data";
import { ROOT_INSTANCE_ID } from "@webstudio-is/sdk";
import {
  hyphenateProperty,
  toValue,
  type StyleProperty,
} from "@webstudio-is/css-engine";
import {
  CollapsibleSectionRoot,
  useOpenState,
} from "~/builder/shared/collapsible-section";
import { CssValueInputContainer } from "../../shared/css-value-input";
import { styleConfigByName } from "../../shared/configs";
import { deleteProperty, setProperty } from "../../shared/use-style-data";
import {
  $availableVariables,
  $matchingBreakpoints,
  getDefinedStyles,
  useComputedStyleDecl,
  useComputedStyles,
} from "../../shared/model";
import { getDots } from "../../shared/style-section";
import { PropertyInfo } from "../../property-label";
import { sections } from "../sections";
import { ColorPopover } from "../../shared/color-picker";
import {
  $selectedInstanceSelector,
  $styles,
  $styleSourceSelections,
} from "~/shared/nano-states";
import { useClientSupports } from "~/shared/client-supports";

// Only here to keep the same section module interface
export const properties = [];

const AdvancedStyleSection = (props: {
  label: string;
  properties: StyleProperty[];
  onAdd: () => void;
  children: ReactNode;
}) => {
  const { label, children, properties, onAdd } = props;
  const [isOpen, setIsOpen] = useOpenState(props);
  const styles = useComputedStyles(properties);
  return (
    <CollapsibleSectionRoot
      label={label}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <SectionTitle
          dots={getDots(styles)}
          suffix={
            <SectionTitleButton
              prefix={<PlusIcon />}
              onClick={() => {
                setIsOpen(true);
                onAdd();
              }}
            />
          }
        >
          <SectionTitleLabel>{label}</SectionTitleLabel>
        </SectionTitle>
      }
    >
      {children}
    </CollapsibleSectionRoot>
  );
};

type SearchItem = { value: string; label: string };

const matchOrSuggestToCreate = (
  search: string,
  items: Array<SearchItem>,
  itemToString: (item: SearchItem) => string
) => {
  const matched = matchSorter(items, search, {
    keys: [itemToString],
  });
  if (isFeatureEnabled("cssVars") === false) {
    return matched;
  }
  if (search.trim().startsWith("--")) {
    matched.unshift({
      value: search.trim(),
      label: `Create "${search.trim()}"`,
    });
  }
  return matched;
};

const AdvancedSearch = ({
  usedProperties,
  onSelect,
}: {
  usedProperties: string[];
  onSelect: (value: StyleProperty) => void;
}) => {
  const availableProperties = useMemo(() => {
    const properties = Object.keys(propertiesData).sort(
      Intl.Collator().compare
    ) as StyleProperty[];
    const availableProperties: SearchItem[] = [];
    for (const property of properties) {
      if (usedProperties.includes(property) === false) {
        availableProperties.push({
          value: property,
          label: hyphenateProperty(property),
        });
      }
    }
    return availableProperties;
  }, [usedProperties]);
  const [item, setItem] = useState<SearchItem>({
    value: "",
    label: "",
  });

  return (
    <Combobox
      autoFocus
      placeholder="Find or create a property"
      getItems={() => availableProperties}
      defaultHighlightedIndex={0}
      value={item}
      itemToString={(item) => item?.label ?? ""}
      getItemProps={() => ({ text: "sentence" })}
      getDescription={(item) => {
        let description = `Unknown CSS property.`;
        if (item && item.value in propertyDescriptions) {
          description =
            propertyDescriptions[
              item.value as keyof typeof propertyDescriptions
            ];
        }
        return <Box css={{ width: theme.spacing[28] }}>{description}</Box>;
      }}
      match={matchOrSuggestToCreate}
      onChange={(value) => {
        setItem({ value: value ?? "", label: value ?? "" });
      }}
      onItemSelect={(item) => onSelect(item.value as StyleProperty)}
    />
  );
};

const AdvancedPropertyLabel = ({ property }: { property: StyleProperty }) => {
  const styleDecl = useComputedStyleDecl(property);
  const label = hyphenateProperty(property);
  const description =
    propertyDescriptions[property as keyof typeof propertyDescriptions];
  const color =
    styleDecl.source.name === "default" ? "code" : styleDecl.source.name;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Tooltip
      open={isOpen}
      onOpenChange={setIsOpen}
      // prevent closing tooltip on content click
      onPointerDown={(event) => event.preventDefault()}
      triggerProps={{
        onClick: (event) => {
          if (event.altKey) {
            event.preventDefault();
            deleteProperty(property);
            return;
          }
          setIsOpen(true);
        },
      }}
      content={
        <PropertyInfo
          title={label}
          description={description}
          styles={[styleDecl]}
          onReset={() => {
            deleteProperty(property);
            setIsOpen(false);
          }}
        />
      }
    >
      <Label color={color} text="mono">
        {label}
      </Label>
    </Tooltip>
  );
};

const AdvancedPropertyValue = ({
  autoFocus,
  property,
}: {
  autoFocus?: boolean;
  property: StyleProperty;
}) => {
  const styleDecl = useComputedStyleDecl(property);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);
  const isColor = colord(toValue(styleDecl.usedValue)).isValid();
  return (
    <CssValueInputContainer
      inputRef={inputRef}
      variant="chromeless"
      size="2"
      text="mono"
      fieldSizing="content"
      prefix={
        isColor && (
          <ColorPopover
            size={1}
            value={styleDecl.usedValue}
            onChange={(styleValue) => {
              const options = { isEphemeral: true, listed: true };
              if (styleValue) {
                setProperty(property)(styleValue, options);
              } else {
                deleteProperty(property, options);
              }
            }}
            onChangeComplete={(styleValue) => {
              setProperty(property)(styleValue);
            }}
          />
        )
      }
      property={property}
      styleSource={styleDecl.source.name}
      getOptions={() => [
        ...styleConfigByName(property).items.map((item) => ({
          type: "keyword" as const,
          value: item.name,
        })),
        ...$availableVariables.get(),
      ]}
      value={styleDecl.cascadedValue}
      setValue={(styleValue, options) => {
        if (
          styleValue.type === "keyword" &&
          styleValue.value.startsWith("--")
        ) {
          setProperty(property)(
            { type: "var", value: styleValue.value.slice(2) },
            { ...options, listed: true }
          );
        } else {
          setProperty(property)(styleValue, { ...options, listed: true });
        }
      }}
      deleteProperty={deleteProperty}
    />
  );
};

const initialProperties = new Set<StyleProperty>([
  "userSelect",
  "pointerEvents",
  "mixBlendMode",
  "cursor",
  "opacity",
]);

const $advancedProperties = computed(
  [
    $selectedInstanceSelector,
    $styleSourceSelections,
    $matchingBreakpoints,
    $styles,
  ],
  (instanceSelector, styleSourceSelections, matchingBreakpoints, styles) => {
    if (instanceSelector === undefined) {
      return [];
    }
    const instanceAndRootSelector =
      instanceSelector[0] === ROOT_INSTANCE_ID
        ? instanceSelector
        : // prevent showing properties inherited from root
          // to not bloat advanced panel
          instanceSelector;
    const definedStyles = getDefinedStyles({
      instanceSelector: instanceAndRootSelector,
      matchingBreakpoints,
      styleSourceSelections,
      styles,
    });
    // All properties used by the panels except the advanced panel
    const baseProperties = new Set<StyleProperty>([]);
    for (const { properties } of sections.values()) {
      for (const property of properties) {
        baseProperties.add(property);
      }
    }
    const advancedProperties = new Set<StyleProperty>(initialProperties);
    for (const { property, listed } of definedStyles) {
      // exclude properties from style panel UI unless edited in advanced section
      if (baseProperties.has(property) === false || listed) {
        advancedProperties.add(property);
      }
    }
    return Array.from(advancedProperties).reverse();
  }
);

/**
 * The Advanced section in the Style Panel on </> Global Root has performance issues.
 * To fix this, we skip rendering properties not visible in the viewport using the contentvisibilityautostatechange event,
 * and the contentVisibility and containIntrinsicSize CSS properties.
 */
const AdvancedProperty = memo(
  ({
    property,
    autoFocus,
  }: {
    property: StyleProperty;
    autoFocus: boolean;
  }) => {
    const visibilityChangeEventSupported = useClientSupports(
      () => "oncontentvisibilityautostatechange" in document.body
    );
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(!visibilityChangeEventSupported);

    useEffect(() => {
      if (!visibilityChangeEventSupported) {
        return;
      }

      if (ref.current == null) {
        return;
      }

      const controller = new AbortController();

      ref.current.addEventListener(
        "contentvisibilityautostatechange",
        (event) => {
          setIsVisible(!event.skipped);
        },
        {
          signal: controller.signal,
        }
      );

      return () => {
        controller.abort();
      };
    }, [visibilityChangeEventSupported]);

    return (
      <Flex
        ref={ref}
        css={{
          contentVisibility: "auto",
          // https://developer.mozilla.org/en-US/docs/Web/CSS/contain-intrinsic-size
          // containIntrinsicSize is used to set the default size of an element before any content is loaded.
          // This helps in preventing layout shifts and provides a better user experience by maintaining a consistent layout.
          // It also affects the contentvisibilityautostatechange event to be called properly,
          // with "auto" it will call it with skipped false for all initial elements.
          // 44px is the height of the property row with 2 lines of text. This value can be adjusted slightly.
          containIntrinsicSize: "auto 44px",
        }}
        key={property}
        wrap="wrap"
        align="center"
        justify="start"
      >
        {isVisible && (
          <>
            <AdvancedPropertyLabel property={property} />
            <Text>:</Text>
            <AdvancedPropertyValue autoFocus={autoFocus} property={property} />
          </>
        )}
      </Flex>
    );
  }
);

export const Section = () => {
  const [isAdding, setIsAdding] = useState(false);
  const advancedProperties = useStore($advancedProperties);
  const newlyAddedProperty = useRef<undefined | StyleProperty>(undefined);

  return (
    <AdvancedStyleSection
      label="Advanced"
      properties={advancedProperties}
      onAdd={() => setIsAdding(true)}
    >
      {isAdding && (
        <AdvancedSearch
          usedProperties={advancedProperties}
          onSelect={(property) => {
            newlyAddedProperty.current = property;
            setIsAdding(false);
            setProperty(property)(
              { type: "guaranteedInvalid" },
              { listed: true }
            );
          }}
        />
      )}
      <Box>
        {advancedProperties.map((property) => (
          <AdvancedProperty
            key={property}
            property={property}
            autoFocus={newlyAddedProperty.current === property}
          />
        ))}
      </Box>
    </AdvancedStyleSection>
  );
};
