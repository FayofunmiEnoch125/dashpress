import { SectionBox } from "frontend/design-system/components/Section/SectionBox";
import {
  FormSkeleton,
  FormSkeletonSchema,
} from "frontend/design-system/components/Skeleton/Form";
import { useAuthenticatedUserBag } from "frontend/hooks/auth/user.store";
import { useSetPageDetails } from "frontend/lib/routing/usePageDetails";
import { ViewStateMachine } from "frontend/components/ViewStateMachine";
import { META_USER_PERMISSIONS } from "shared/constants/user";
import { ACCOUNT_PROFILE_CRUD_CONFIG } from "frontend/hooks/auth/constants";
import { useUpdateProfileMutation } from "../account.store";
import { ACCOUNT_VIEW_KEY } from "../constants";
import { BaseAccountLayout } from "../_Base";
import { UpdateProfileForm } from "./Form";

export function AccountProfile() {
  const authenticatedUserBag = useAuthenticatedUserBag();
  const updateProfileMutation = useUpdateProfileMutation();

  useSetPageDetails({
    pageTitle: ACCOUNT_PROFILE_CRUD_CONFIG.TEXT_LANG.EDIT,
    viewKey: ACCOUNT_VIEW_KEY,
    permission: META_USER_PERMISSIONS.NO_PERMISSION_REQUIRED,
  });

  return (
    <BaseAccountLayout>
      <SectionBox title={ACCOUNT_PROFILE_CRUD_CONFIG.TEXT_LANG.EDIT}>
        <ViewStateMachine
          loading={authenticatedUserBag.isLoading}
          error={authenticatedUserBag.error}
          loader={<FormSkeleton schema={[FormSkeletonSchema.Input]} />}
        >
          <UpdateProfileForm
            onSubmit={updateProfileMutation.mutateAsync}
            initialValues={authenticatedUserBag.data}
          />
        </ViewStateMachine>
      </SectionBox>
    </BaseAccountLayout>
  );
}
