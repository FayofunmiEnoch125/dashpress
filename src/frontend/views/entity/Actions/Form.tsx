/* eslint-disable no-param-reassign */
import { ILabelValue } from "shared/types/options";
import { SchemaForm } from "frontend/components/SchemaForm";
import { useState } from "react";
import { IAppliedSchemaFormConfig } from "shared/form-schemas/types";
import {
  IActionInstance,
  IIntegrationsList,
  IActivatedAction,
  BaseAction,
} from "shared/types/actions";
import { userFriendlyCase } from "shared/lib/strings/friendly-case";
import { useIntegrationImplementationsList } from "./instances.store";
import { ADMIN_ACTION_INSTANCES_CRUD_CONFIG } from "./constants";
import { ActionInstanceView } from "./types";

interface IProps {
  onSubmit: (instance: IActionInstance) => Promise<void>;
  initialValues?: Partial<IActionInstance>;
  entities: ILabelValue[];
  formAction: "create" | "update";
  integrationsList: IIntegrationsList[];
  activatedActions: IActivatedAction[];
  currentView: ActionInstanceView;
}

const CONFIGURATION_FORM_PREFIX = "configuration__";

export function ActionForm({
  onSubmit,
  initialValues = {},
  entities,
  formAction,
  integrationsList,
  activatedActions,
  currentView,
}: IProps) {
  const integrationsListMap = Object.fromEntries(
    integrationsList.map((action) => [action.key, action])
  );
  const activatedOptions = activatedActions
    .filter(({ integrationKey }) => {
      if (currentView.type !== "integrationKey") {
        return true;
      }
      return currentView.id === integrationKey;
    })
    .map(({ activationId, integrationKey }) => ({
      label: integrationsListMap[integrationKey].title,
      value: activationId,
    }));

  const [formValues, setFormValues] = useState<Partial<IActionInstance>>({});

  const implementations = useIntegrationImplementationsList(
    activatedActions.find(
      ({ activationId }) => formValues.activatedActionId === activationId
    )?.integrationKey
  );

  const currentActionTitle =
    integrationsListMap[
      activatedActions.find(
        ({ activationId }) => formValues.activatedActionId === activationId
      )?.integrationKey
    ]?.title;

  const selectedImplementation = Object.fromEntries(
    Object.entries(
      implementations.data.find(
        ({ key }) => key === formValues.implementationKey
      )?.configurationSchema || {}
    ).map(([key, value]) => [
      `${CONFIGURATION_FORM_PREFIX}${key}`,
      { ...value, label: `${currentActionTitle}: ${userFriendlyCase(key)}` },
    ])
  );

  const fields: IAppliedSchemaFormConfig<any> = {
    formAction: {
      label: "Trigger",
      type: "selection",
      selections: [
        {
          label: "On Create",
          value: BaseAction.Create,
        },
        {
          label: "On Update",
          value: BaseAction.Update,
        },
        {
          label: "On Delete",
          value: BaseAction.Delete,
        },
      ],
      validations: [
        {
          validationType: "required",
        },
      ],
    },
    entity: {
      type: "selection",
      validations: [{ validationType: "required" }],
      selections: entities,
    },
    activatedActionId: {
      label: "Integration",
      selections: activatedOptions,
      type: "selection",
      validations: [{ validationType: "required" }],
    },
    implementationKey: {
      label: "Action",
      type: "selection",
      validations: [{ validationType: "required" }],
      selections: implementations.data.map(({ key, label }) => ({
        label,
        value: key,
      })),
    },
    ...selectedImplementation,
  };
  if (currentView.type === "entity") {
    delete fields.entity;
    initialValues = { ...initialValues, entity: currentView.id };
  }
  if (currentView.type === "integrationKey" && activatedOptions.length === 1) {
    delete fields.activatedActionId;
    initialValues = {
      ...initialValues,
      activatedActionId: activatedOptions[0].value,
    };
  }

  const initialValues$1 = Object.entries(
    initialValues.configuration || {}
  ).reduce((values, [key, value]) => {
    return { ...values, [`${CONFIGURATION_FORM_PREFIX}${key}`]: value };
  }, initialValues);

  return (
    <SchemaForm<IActionInstance>
      buttonText={
        formAction === "create"
          ? ADMIN_ACTION_INSTANCES_CRUD_CONFIG.FORM_LANG.CREATE
          : ADMIN_ACTION_INSTANCES_CRUD_CONFIG.FORM_LANG.UPDATE
      }
      initialValues={initialValues$1}
      fields={fields}
      icon={formAction === "create" ? "add" : "save"}
      onChange={setFormValues}
      action={formAction}
      onSubmit={async (instance) => {
        const integrationKey = activatedActions.find(
          ({ activationId }) => instance.activatedActionId === activationId
        )?.integrationKey;

        const cleanedConfigurationForm = Object.entries(instance).reduce(
          (cleanForm, [formKey, formValue]) => {
            if (formKey.startsWith(CONFIGURATION_FORM_PREFIX)) {
              const key = formKey.replace(CONFIGURATION_FORM_PREFIX, "");
              return {
                ...cleanForm,
                configuration: { ...cleanForm.configuration, [key]: formValue },
              };
            }
            return { ...cleanForm, [formKey]: formValue };
          },
          { configuration: {} }
        ) as IActionInstance;

        await onSubmit({ ...cleanedConfigurationForm, integrationKey });
      }}
      // TEST: unit test this
      formExtension={{
        fieldsState: `
            return {
                entity: {
                    disabled: $.action === "update" || !$.formValues.formAction
                },
                activatedActionId: {
                   disabled: $.action === "update" || !$.formValues.formAction
                },
                implementationKey: {
                    disabled: !$.formValues.formAction
                }
            }
        `,
      }}
    />
  );
}
