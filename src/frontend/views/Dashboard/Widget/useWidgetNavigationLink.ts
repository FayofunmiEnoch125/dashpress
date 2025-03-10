import { SLUG_LOADING_VALUE } from "frontend/lib/routing/constants";
import { useEntityConfiguration } from "frontend/hooks/configuration/configuration.store";
import { NAVIGATION_LINKS } from "frontend/lib/routing/links";
import { useCanUserPerformCrudAction } from "frontend/views/data/useCanUserPerformCrudAction";

export const useWidgetNavigationLink = (entity?: string, queryId?: string) => {
  const canUserPerformCrudAction = useCanUserPerformCrudAction(entity);
  const entityViews = useEntityConfiguration(
    "entity_views",
    queryId ? entity : SLUG_LOADING_VALUE
  );

  if (!entity) {
    return undefined;
  }

  if (!canUserPerformCrudAction("table")) {
    return undefined;
  }

  const tabTitle = entityViews.data.find(({ id }) => id === queryId)?.title;

  const tabLink = queryId ? `?tab=${tabTitle}` : "";

  return NAVIGATION_LINKS.ENTITY.TABLE(entity) + tabLink;
};
