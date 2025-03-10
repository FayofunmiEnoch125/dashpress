import {
  FormSkeleton,
  FormSkeletonSchema,
} from "frontend/design-system/components/Skeleton/Form";
import { SchemaForm } from "frontend/components/SchemaForm";
import { useEntityConfiguration } from "frontend/hooks/configuration/configuration.store";
import {
  useEntityFields,
  useEntityToOneReferenceFields,
} from "frontend/hooks/entity/entity.store";
import {
  useEntityFieldLabels,
  useEntityFieldSelections,
  useProcessedEntityFieldTypes,
  useEntityFieldValidations,
} from "frontend/hooks/entity/entity.config";
import { useMemo } from "react";
import { ViewStateMachine } from "frontend/components/ViewStateMachine";
import { DataStateKeys, DataStates } from "frontend/lib/data/types";
import { SLUG_LOADING_VALUE } from "frontend/lib/routing/constants";
import { ButtonIconTypes } from "frontend/design-system/components/Button/constants";
import { buildAppliedSchemaFormConfig } from "./buildAppliedSchemaFormConfig";
import { useEntityViewStateMachine } from "./useEntityViewStateMachine";
import { filterOutHiddenScalarColumns } from "./utils";
import { usePortalExtendEntityFormConfig } from "./portal";

type IProps = {
  entity: string;
  initialValues?: Record<string, unknown>;
  crudAction: "create" | "update";
  hiddenColumns: DataStateKeys<string[]>;
  additionalDataState?: DataStateKeys<unknown>;
  allOptional?: boolean;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  resetForm?: true;
  buttonText: (submitting: boolean) => string;
  icon: ButtonIconTypes;
};

export function BaseEntityForm({
  entity,
  initialValues,
  crudAction,
  allOptional,
  icon,
  resetForm,
  buttonText,
  additionalDataState,
  hiddenColumns,
  onSubmit,
}: IProps) {
  const entityValidationsMap = useEntityFieldValidations(entity);
  const entityFields = useEntityFields(entity);
  const getEntityFieldLabels = useEntityFieldLabels(entity);
  const entityFieldTypes = useProcessedEntityFieldTypes(entity);
  const entityFieldSelections = useEntityFieldSelections(entity);
  const entityFieldTypesMap = useEntityConfiguration(
    "entity_columns_types",
    entity
  );

  const extendEntityFormConfig = usePortalExtendEntityFormConfig(crudAction);

  const entityFormExtension = useEntityConfiguration(
    "entity_form_extension",
    entity
  );
  const entityToOneReferenceFields = useEntityToOneReferenceFields(entity);

  const error =
    entityFieldTypesMap.error ||
    hiddenColumns.error ||
    additionalDataState?.error ||
    entityFormExtension.error ||
    entityToOneReferenceFields.error ||
    entityFields.error;

  const isLoading =
    entityFields.isLoading ||
    hiddenColumns.isLoading ||
    entityToOneReferenceFields.isLoading ||
    entityFormExtension.isLoading ||
    entity === SLUG_LOADING_VALUE ||
    entityFieldTypesMap.isLoading ||
    extendEntityFormConfig === "loading" ||
    additionalDataState?.isLoading;

  const viewState = useEntityViewStateMachine(isLoading, error, crudAction);

  const fields = filterOutHiddenScalarColumns(
    entityFields.data.filter(({ isId }) => !isId),
    hiddenColumns.data
  ).map(({ name }) => name);

  const fieldsInitialValues = useMemo(() => {
    if (!initialValues) {
      return initialValues;
    }
    return Object.fromEntries(
      fields.map((field) => {
        let value = initialValues[field];

        if (typeof value === "object" && value !== null) {
          value = JSON.stringify(value);
        }

        return [field, value];
      })
    );
  }, [initialValues, hiddenColumns]);

  const formSchemaConfig = {
    entityToOneReferenceFields: entityToOneReferenceFields.data,
    getEntityFieldLabels,
    entityFieldTypes,
    entityFieldSelections,
    entityValidationsMap,
    fields,
  };

  const formConfig = buildAppliedSchemaFormConfig(
    formSchemaConfig,
    allOptional
  );

  return (
    <ViewStateMachine
      loading={viewState.type === DataStates.Loading}
      error={
        viewState.type === DataStates.Error ? viewState.message : undefined
      }
      loader={
        <FormSkeleton
          schema={[
            FormSkeletonSchema.Input,
            FormSkeletonSchema.Input,
            FormSkeletonSchema.Input,
            FormSkeletonSchema.Textarea,
          ]}
        />
      }
    >
      <SchemaForm
        buttonText={buttonText}
        resetForm={resetForm}
        onSubmit={onSubmit}
        action={crudAction}
        icon={icon}
        initialValues={fieldsInitialValues}
        fields={
          typeof extendEntityFormConfig === "string"
            ? formConfig
            : extendEntityFormConfig(formConfig)
        }
        formExtension={entityFormExtension.data}
      />
    </ViewStateMachine>
  );
}
