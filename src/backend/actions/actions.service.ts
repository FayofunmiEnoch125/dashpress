import {
  appConstantsApiService,
  credentialsApiService,
  CredentialsApiService,
} from "backend/integrations-configurations";
import {
  IntegrationsConfigurationApiService,
  INTEGRATION_CONFIG_GROUP_DEMILITER,
} from "backend/integrations-configurations/services/_base";
import {
  createConfigDomainPersistenceService,
  AbstractConfigDataPersistenceService,
} from "backend/lib/config-persistence";
import { BadRequestError } from "backend/lib/errors";
import { validateSchemaRequestBody } from "backend/lib/errors/validate-schema-request-input";
import { IApplicationService } from "backend/types";
import { nanoid } from "nanoid";
import { INTEGRATIONS_GROUP_CONFIG } from "shared/config-bag/integrations";
import {
  IIntegrationsList,
  IActionInstance,
  IActivatedAction,
  IIntegrationImplementationList,
  HTTP_ACTIVATION_ID,
  ActionIntegrationKeys,
} from "shared/types/actions";
import { IAccountProfile } from "shared/types/user";
import { compileTemplateString } from "shared/lib/strings/templates";
import { sluggify } from "shared/lib/strings";
import { ACTION_INTEGRATIONS } from "./integrations";

export class ActionsApiService implements IApplicationService {
  constructor(
    private readonly _activatedActionsPersistenceService: AbstractConfigDataPersistenceService<IActivatedAction>,
    private readonly _actionInstancesPersistenceService: AbstractConfigDataPersistenceService<IActionInstance>,
    private readonly _credentialsApiService: CredentialsApiService,
    private readonly _appConstantsApiService: IntegrationsConfigurationApiService
  ) {}

  async bootstrap() {
    await this._activatedActionsPersistenceService.setup();
    await this._actionInstancesPersistenceService.setup();
  }

  // TODO: job queue https://github.com/bee-queue/bee-queue
  async runAction(
    entity: string,
    formAction: string,
    getData: () => Promise<Record<string, unknown>>,
    accountProfile: IAccountProfile
  ) {
    const instances = await this.listEntityActionInstances(entity);
    const actionsToRun = instances.filter(
      (action) => action.formAction === formAction
    );

    if (actionsToRun.length === 0) {
      return;
    }

    const data = await getData();

    for (const action of actionsToRun) {
      const { configuration, implementationKey, activatedActionId } = action;
      // run triggerLogic

      const integrationKey = await this.getIntegrationKeyFromActivatedActionId(
        activatedActionId
      );

      const actionConfiguration = await this.showActionConfig(
        activatedActionId
      );

      const connection = await ACTION_INTEGRATIONS[integrationKey].connect(
        actionConfiguration
      );

      const appConstants = Object.fromEntries(
        (await this._appConstantsApiService.list()).map(({ key, value }) => [
          key,
          value,
        ])
      );

      const credentials = Object.fromEntries(
        await Promise.all(
          (await this._credentialsApiService.list())
            .filter(
              ({ key }) => !key.includes(INTEGRATION_CONFIG_GROUP_DEMILITER)
            )
            .map(async ({ key, value }) => [
              key,
              await this._credentialsApiService.processDataAfterFetch(value),
            ])
        )
      );

      const compiledConfiguration = Object.fromEntries(
        Object.entries(configuration || {}).map(([key, value]) => [
          key,
          compileTemplateString(value, {
            data,
            [INTEGRATIONS_GROUP_CONFIG.constants.prefix]: appConstants,
            [INTEGRATIONS_GROUP_CONFIG.credentials.prefix]: credentials,
            auth: accountProfile,
          }),
        ])
      );

      await ACTION_INTEGRATIONS[integrationKey].performsImplementation[
        implementationKey
      ].do(connection, compiledConfiguration);
    }
  }

  async instantiateAction(action: Omit<IActionInstance, "instanceId">) {
    const instanceId = nanoid();
    const activatedActions = await this.listActivatedActions();

    const integrationKey = activatedActions.find(
      ({ activationId }) => action.activatedActionId === activationId
    )?.integrationKey;

    if (!integrationKey) {
      throw new BadRequestError(
        `Integration Key not found for activatedActionId '${action.activatedActionId}'`
      );
    }

    await this._actionInstancesPersistenceService.createItem(instanceId, {
      ...action,
      integrationKey,
      instanceId,
    });
  }

  async updateActionInstance(
    instanceId: string,
    instance: Omit<IActionInstance, "instanceId">
  ) {
    await this._actionInstancesPersistenceService.upsertItem(instanceId, {
      ...instance,
      instanceId,
    });
  }

  async deleteActionInstance(instanceId: string) {
    await this._actionInstancesPersistenceService.removeItem(instanceId);
  }

  async listEntityActionInstances(entity$1: string) {
    return (await this._actionInstancesPersistenceService.getAllItems()).filter(
      ({ entity }) => entity === entity$1
    );
  }

  async listIntegrationActions(integrationKey$1: string) {
    return (await this._actionInstancesPersistenceService.getAllItems()).filter(
      ({ integrationKey }) => integrationKey === integrationKey$1
    );
  }

  listActionIntegrations(): IIntegrationsList[] {
    return Object.entries(ACTION_INTEGRATIONS).map(
      ([key, { title, description, configurationSchema }]) => ({
        description,
        title,
        key,
        configurationSchema,
      })
    );
  }

  listIntegrationImplementations(
    integrationKey: ActionIntegrationKeys
  ): IIntegrationImplementationList[] {
    return Object.entries(
      ACTION_INTEGRATIONS[integrationKey].performsImplementation
    ).map(([key, { configurationSchema, label }]) => ({
      label,
      key,
      configurationSchema,
    }));
  }

  async listActivatedActions(): Promise<IActivatedAction[]> {
    const activatedActions =
      await this._activatedActionsPersistenceService.getAllItems();
    return [
      ...activatedActions,
      {
        activationId: HTTP_ACTIVATION_ID,
        credentialsGroupKey: "none-existent",
        integrationKey: ActionIntegrationKeys.HTTP,
      },
    ];
  }

  async activateAction(
    integrationKey: ActionIntegrationKeys,
    configuration: Record<string, string>
  ): Promise<void> {
    validateSchemaRequestBody(
      ACTION_INTEGRATIONS[integrationKey].configurationSchema,
      configuration
    );

    const activationId = nanoid();

    const credentialsGroupKey = this.makeCredentialsGroupKey(integrationKey);

    await this._activatedActionsPersistenceService.createItem(activationId, {
      activationId,
      integrationKey,
      credentialsGroupKey,
    });

    await this._credentialsApiService.upsertGroup(
      {
        key: credentialsGroupKey,
        fields: Object.keys(
          ACTION_INTEGRATIONS[integrationKey].configurationSchema
        ),
      },
      configuration
    );
  }

  private makeCredentialsGroupKey(integrationKey: ActionIntegrationKeys) {
    return sluggify(`ACTION__${integrationKey}`).toUpperCase();
  }

  private async getIntegrationKeyFromActivatedActionId(
    activatedActionId: string
  ): Promise<string> {
    if (activatedActionId === HTTP_ACTIVATION_ID) {
      return ActionIntegrationKeys.HTTP;
    }
    const activatedAction =
      await this._activatedActionsPersistenceService.getItemOrFail(
        activatedActionId
      );
    return activatedAction.integrationKey;
  }

  async showActionConfig(
    activationId: string
  ): Promise<Record<string, unknown>> {
    if (activationId === HTTP_ACTIVATION_ID) {
      return {};
    }
    const { credentialsGroupKey, integrationKey } =
      await this._activatedActionsPersistenceService.getItemOrFail(
        activationId
      );

    return await this._credentialsApiService.useGroupValue({
      key: credentialsGroupKey,
      fields: Object.keys(
        ACTION_INTEGRATIONS[integrationKey].configurationSchema
      ),
    });
  }

  async updateActionConfig(
    activationId: string,
    configuration: Record<string, string>
  ): Promise<void> {
    const { integrationKey, credentialsGroupKey } =
      await this._activatedActionsPersistenceService.getItemOrFail(
        activationId
      );

    validateSchemaRequestBody(
      ACTION_INTEGRATIONS[integrationKey].configurationSchema,
      configuration
    );

    await this._credentialsApiService.upsertGroup(
      {
        key: credentialsGroupKey,
        fields: Object.keys(
          ACTION_INTEGRATIONS[integrationKey].configurationSchema
        ),
      },
      configuration
    );
  }

  async deactivateAction(activationId: string): Promise<void> {
    const action = await this._activatedActionsPersistenceService.getItemOrFail(
      activationId
    );

    await this._credentialsApiService.deleteGroup({
      key: action.credentialsGroupKey,
      fields: Object.keys(
        ACTION_INTEGRATIONS[action.integrationKey].configurationSchema
      ),
    });

    await this._activatedActionsPersistenceService.removeItem(activationId);

    const instances =
      await this._actionInstancesPersistenceService.getAllItems();

    for (const instance of instances) {
      if (instance.activatedActionId === activationId) {
        await this._actionInstancesPersistenceService.removeItem(
          instance.instanceId
        );
      }
    }
  }
}

const activatedActionsPersistenceService =
  createConfigDomainPersistenceService<IActivatedAction>("activated-actions");

const actionInstancesPersistenceService =
  createConfigDomainPersistenceService<IActionInstance>("action-instances");

export const actionsApiService = new ActionsApiService(
  activatedActionsPersistenceService,
  actionInstancesPersistenceService,
  credentialsApiService,
  appConstantsApiService
);
