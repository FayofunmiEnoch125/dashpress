import { ViewStateMachine } from "frontend/components/ViewStateMachine";
import { useEffect, useState } from "react";
import { FormButton } from "frontend/design-system/components/Button/FormButton";
import { ListSkeleton } from "frontend/design-system/components/Skeleton/List";
import { RenderList } from "frontend/design-system/components/RenderList";
import { Spacer } from "frontend/design-system/primitives/Spacer";
import { SectionListItem } from "frontend/design-system/components/Section/SectionList";
import { Stack } from "frontend/design-system/primitives/Stack";
import { useStringSelections } from "frontend/lib/selection";
import { useEntityFields } from "frontend/hooks/entity/entity.store";
import {
  useEntityFieldLabels,
  useEntitySlug,
} from "frontend/hooks/entity/entity.config";
import { IEntityCrudSettings } from "shared/configurations";
import { ENTITY_CRUD_LABELS } from "../constants";
import { makeEntityFieldsSelectionKey } from "./constants";

interface IProps {
  columns?: {
    submit?: (columnsSelection: string[]) => Promise<string[]>;
    hidden: string[];
  };
  toggling: {
    onToggle?: () => void;
    enabled: boolean;
  };
  isLoading: boolean;
  error: unknown;
  crudKey: keyof IEntityCrudSettings | "table";
}

export function EntityFieldsSelectionSettings({
  columns,
  isLoading,
  toggling,
  error,
  crudKey,
}: IProps) {
  const entity = useEntitySlug();

  const entityFields = useEntityFields(entity);

  const getEntityFieldLabels = useEntityFieldLabels();

  const { toggleSelection, allSelections, selectMutiple, isSelected } =
    useStringSelections(makeEntityFieldsSelectionKey(entity, crudKey));

  const [touched, setTouched] = useState(false);

  const [isMakingRequest, setIsMakingRequest] = useState(false);

  useEffect(() => {
    selectMutiple(columns?.hidden || []);
  }, [columns?.hidden]);

  return (
    <ViewStateMachine
      error={error}
      loading={isLoading}
      loader={<ListSkeleton count={10} />}
    >
      <Stack justify="space-between" align="flex-start">
        {toggling && toggling.onToggle && (
          <FormButton
            isMakingRequest={false}
            icon={toggling.enabled ? "check" : "square"}
            size="sm"
            isInverse
            text={() => `Enable ${ENTITY_CRUD_LABELS[crudKey]} Functionality`}
            onClick={() => toggling.onToggle()}
          />
        )}
      </Stack>
      <Spacer size="xxl" />
      {columns && (
        <>
          <RenderList
            items={entityFields.data}
            singular="Field"
            getLabel={getEntityFieldLabels}
            render={(menuItem) => {
              const isHidden = isSelected(menuItem.name);

              const disabled = menuItem.isId || !toggling.enabled;

              return (
                <SectionListItem
                  label={menuItem.label}
                  key={menuItem.name}
                  disabled={disabled}
                  subtle={disabled}
                  toggle={
                    disabled
                      ? undefined
                      : {
                          selected: !isHidden,
                          onChange: () => {
                            setTouched(true);
                            toggleSelection(menuItem.name);
                          },
                        }
                  }
                />
              );
            }}
          />

          <Spacer size="xxl" />
          <FormButton
            onClick={async () => {
              setIsMakingRequest(true);
              await columns.submit(allSelections);
              setIsMakingRequest(false);
              setTouched(false);
            }}
            text={(isSubmitting) =>
              isSubmitting
                ? `Saving ${ENTITY_CRUD_LABELS[crudKey]} Selections`
                : `Save ${ENTITY_CRUD_LABELS[crudKey]} Selections`
            }
            icon="save"
            disabled={!touched}
            isMakingRequest={isMakingRequest}
          />
        </>
      )}
    </ViewStateMachine>
  );
}
