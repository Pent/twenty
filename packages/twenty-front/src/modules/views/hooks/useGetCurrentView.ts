import { useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { usePrefetchedData } from '@/prefetch/hooks/usePrefetchedData';
import { PrefetchKey } from '@/prefetch/types/PrefetchKey';
import { useAvailableScopeIdOrThrow } from '@/ui/utilities/recoil-scope/scopes-internal/hooks/useAvailableScopeId';
import { useViewStates } from '@/views/hooks/internal/useViewStates';
import { ViewScopeInternalContext } from '@/views/scopes/scope-internal-context/ViewScopeInternalContext';
import { GraphQLView } from '@/views/types/GraphQLView';
import { combinedViewFilters } from '@/views/utils/combinedViewFilters';
import { combinedViewSorts } from '@/views/utils/combinedViewSorts';
import { isDefined } from '~/utils/isDefined';

export const useGetCurrentView = (viewBarComponentId?: string) => {
  const componentId = useAvailableScopeIdOrThrow(
    ViewScopeInternalContext,
    viewBarComponentId,
  );

  const { records: views } = usePrefetchedData<GraphQLView>(
    PrefetchKey.AllViews,
  );

  const {
    currentViewIdState,
    viewObjectMetadataIdState,
    unsavedToUpsertViewFiltersState,
    unsavedToDeleteViewFilterIdsState,
    unsavedToDeleteViewSortIdsState,
    unsavedToUpsertViewSortsState,
    isCurrentViewKeyIndexState,
  } = useViewStates(componentId);

  const currentViewId = useRecoilValue(currentViewIdState);
  const viewObjectMetadataId = useRecoilValue(viewObjectMetadataIdState);
  const setIsCurrentViewKeyIndex = useSetRecoilState(
    isCurrentViewKeyIndexState,
  );

  const currentViewFromCurrentViewId = views.find(
    (view) => view.id === currentViewId,
  );
  const indexView = views.find(
    (view) =>
      view.key === 'INDEX' && view.objectMetadataId === viewObjectMetadataId,
  );

  const currentView = currentViewId ? currentViewFromCurrentViewId : indexView;

  useEffect(() => {
    setIsCurrentViewKeyIndex(currentView?.key === 'INDEX');
  }, [currentView, setIsCurrentViewKeyIndex]);

  const viewsOnCurrentObject = views
    .filter((view) => view.objectMetadataId === viewObjectMetadataId)
    .map((view) => ({
      id: view.id,
      name: view.name,
      type: view.type,
      key: view.key,
      objectMetadataId: view.objectMetadataId,
      icon: view.icon,
    }));

  const unsavedToUpsertViewFilters = useRecoilValue(
    unsavedToUpsertViewFiltersState,
  );
  const unsavedToUpsertViewSorts = useRecoilValue(
    unsavedToUpsertViewSortsState,
  );
  const unsavedToDeleteViewFilterIds = useRecoilValue(
    unsavedToDeleteViewFilterIdsState,
  );
  const unsavedToDeleteViewSortIds = useRecoilValue(
    unsavedToDeleteViewSortIdsState,
  );

  if (!isDefined(currentView)) {
    return {
      componentId,
      currentViewWithSavedFiltersAndSorts: undefined,
      currentViewWithCombinedFiltersAndSorts: undefined,
      viewsOnCurrentObject: viewsOnCurrentObject ?? [],
    };
  }

  const currentViewWithCombinedFiltersAndSorts = {
    ...currentView,
    viewFilters: combinedViewFilters(
      currentView.viewFilters,
      unsavedToUpsertViewFilters,
      unsavedToDeleteViewFilterIds,
    ),
    viewSorts: combinedViewSorts(
      currentView.viewSorts,
      unsavedToUpsertViewSorts,
      unsavedToDeleteViewSortIds,
    ),
  };

  return {
    componentId,
    currentViewWithSavedFiltersAndSorts: currentView,
    currentViewWithCombinedFiltersAndSorts,
    viewsOnCurrentObject: viewsOnCurrentObject ?? [],
  };
};
