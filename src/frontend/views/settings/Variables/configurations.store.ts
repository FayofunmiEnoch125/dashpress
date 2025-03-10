import { usePasswordStore } from "frontend/views/integrations/password.store";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { IntegrationsConfigurationGroup } from "shared/types/integrations";
import { INTEGRATIONS_GROUP_CONFIG } from "shared/config-bag/integrations";
import { CRUD_CONFIG_NOT_FOUND } from "frontend/lib/crud-config";
import { makeActionRequest } from "frontend/lib/data/makeRequest";
import { reduceStringToNumber } from "shared/lib/strings";
import { useWaitForResponseMutationOptions } from "frontend/lib/data/useMutate/useWaitForResponseMutationOptions";
import { MutationHelpers } from "frontend/lib/data/useMutate/mutation-helpers";
import { useApiMutateOptimisticOptions } from "frontend/lib/data/useMutate/useApiMutateOptimisticOptions";
import { useApi } from "frontend/lib/data/useApi";
import { getQueryCachekey } from "frontend/lib/data/constants/getQueryCacheKey";
import { IKeyValue } from "./types";

export const INTEGRATIONS_GROUP_ENDPOINT = (
  group: IntegrationsConfigurationGroup
) => `/api/integrations/${group}`;

const REVEAL_CREDENTIALS_ENDPOINT = `/api/integrations/credentials/reveal`;

export function useIntegrationConfigurationUpsertationMutation(
  group: IntegrationsConfigurationGroup
) {
  const rootPassword = usePasswordStore((state) => state.password);

  const apiMutateOptions = useWaitForResponseMutationOptions<
    Record<string, string>
  >({
    endpoints: rootPassword
      ? [REVEAL_CREDENTIALS_ENDPOINT, INTEGRATIONS_GROUP_ENDPOINT(group)]
      : [INTEGRATIONS_GROUP_ENDPOINT(group)],
    successMessage:
      INTEGRATIONS_GROUP_CONFIG[group].crudConfig.MUTATION_LANG.SAVED,
  });

  return useMutation(
    async (data: { key: string; value: string }) =>
      await makeActionRequest("PUT", `/api/integrations/${group}/${data.key}`, {
        value: data.value,
        _password: rootPassword,
      }),
    apiMutateOptions
  );
}

export function useIntegrationConfigurationDeletionMutation(
  group: IntegrationsConfigurationGroup
) {
  const rootPassword = usePasswordStore((state) => state.password);

  const apiMutateOptions = useApiMutateOptimisticOptions<IKeyValue[], string>({
    dataQueryPath: INTEGRATIONS_GROUP_ENDPOINT(group),
    otherEndpoints: rootPassword ? [REVEAL_CREDENTIALS_ENDPOINT] : [],
    successMessage:
      INTEGRATIONS_GROUP_CONFIG[group].crudConfig.MUTATION_LANG.DELETE,
    onMutate: MutationHelpers.deleteByKey("key"),
  });

  return useMutation(
    async (key: string) =>
      await makeActionRequest("DELETE", `/api/integrations/${group}/${key}`, {
        _password: rootPassword,
      }),
    apiMutateOptions
  );
}

export const useRevealedCredentialsList = (
  group: IntegrationsConfigurationGroup
) => {
  const rootPassword = usePasswordStore((state) => state.password);
  const queryClient = useQueryClient();

  const response = useApi<IKeyValue[]>(
    `${REVEAL_CREDENTIALS_ENDPOINT}?${reduceStringToNumber(rootPassword)}`,
    {
      request: {
        body: {
          _password: rootPassword,
        },
        method: "POST",
      },
      errorMessage: CRUD_CONFIG_NOT_FOUND("Revealed Credentials"),
      enabled:
        group === IntegrationsConfigurationGroup.Credentials && !!rootPassword,
      defaultData: undefined,
    }
  );

  useEffect(() => {
    if (response.data && response.data.length) {
      queryClient.setQueryData(
        getQueryCachekey(
          INTEGRATIONS_GROUP_ENDPOINT(
            IntegrationsConfigurationGroup.Credentials
          )
        ),
        response.data
      );
    }
  }, [response.data]);

  return response;
};
