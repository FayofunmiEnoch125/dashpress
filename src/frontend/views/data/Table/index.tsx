import { useSetPageDetails } from "frontend/lib/routing/usePageDetails";
import { META_USER_PERMISSIONS } from "shared/constants/user";
import { GranularEntityPermissions } from "shared/types/user";
import {
  useEntityCrudConfig,
  useEntitySlug,
} from "frontend/hooks/entity/entity.config";
import { AppLayout } from "frontend/_layouts/app";
import {
  EntityActionTypes,
  useEntityActionMenuItems,
} from "../../entity/constants";
import { useTableMenuItems } from "./useTableMenuItems";
import { WholeEntityTable } from "./_WholeEntityTable";

export function EntityTable() {
  const entity = useEntitySlug();
  const entityCrudConfig = useEntityCrudConfig(entity);

  const actionItems = useEntityActionMenuItems([
    EntityActionTypes.Table,
    EntityActionTypes.Diction,
    EntityActionTypes.Labels,
    EntityActionTypes.Form,
  ]);

  useSetPageDetails({
    pageTitle: entityCrudConfig.TEXT_LANG.TITLE,
    viewKey: "ENTITY_TABLE",
    permission: META_USER_PERMISSIONS.APPLIED_CAN_ACCESS_ENTITY(
      entity,
      GranularEntityPermissions.Show
    ),
  });

  const menuItems = useTableMenuItems(entity);

  return (
    <AppLayout actionItems={menuItems} secondaryActionItems={actionItems}>
      <WholeEntityTable entity={entity} />
    </AppLayout>
  );
}
