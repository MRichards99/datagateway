import {
  addToCart,
  DateColumnFilter,
  DateFilter,
  DownloadCartItem,
  Entity,
  fetchAllIds,
  fetchInvestigationCount,
  fetchInvestigationDetails,
  fetchInvestigations,
  Filter,
  FiltersType,
  formatBytes,
  Investigation,
  Order,
  pushPageFilter,
  pushPageSort,
  readSciGatewayToken,
  removeFromCart,
  SortType,
  Table,
  tableLink,
  TextColumnFilter,
} from 'datagateway-common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { IndexRange, TableCellProps } from 'react-virtualized';
import { Action, AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from '../../../state/app.types';
import InvestigationDetailsPanel from '../../detailsPanels/isis/investigationDetailsPanel.component';

import TitleIcon from '@material-ui/icons/Title';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import PublicIcon from '@material-ui/icons/Public';
import SaveIcon from '@material-ui/icons/Save';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import { push } from 'connected-react-router';

interface ISISMyDataTableStoreProps {
  sort: SortType;
  filters: FiltersType;
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
  cartItems: DownloadCartItem[];
  allIds: number[];
}

interface ISISMyDataTableDispatchProps {
  pushSort: (sort: string, order: Order | null) => Promise<void>;

  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  fetchData: (username: string, offsetParams: IndexRange) => Promise<void>;
  fetchCount: (username: string) => Promise<void>;

  fetchDetails: (investigationId: number) => Promise<void>;
  addToCart: (entityIds: number[]) => Promise<void>;
  removeFromCart: (entityIds: number[]) => Promise<void>;
  fetchAllIds: (username: string) => Promise<void>;
  viewDatasets: (urlPrefix: string) => (id: number) => Action;
}

type ISISMyDataTableCombinedProps = ISISMyDataTableStoreProps &
  ISISMyDataTableDispatchProps;

const ISISMyDataTable = (
  props: ISISMyDataTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    sort,
    pushSort,
    filters,
    pushFilters,
    loading,
    cartItems,
    addToCart,
    removeFromCart,
    allIds,
    fetchAllIds,
    viewDatasets,
  } = props;

  const [t] = useTranslation();
  const username = readSciGatewayToken().username || '';

  const selectedRows = React.useMemo(
    () =>
      cartItems
        .filter(
          (cartItem) =>
            cartItem.entityType === 'investigation' &&
            allIds.includes(cartItem.entityId)
        )
        .map((cartItem) => cartItem.entityId),
    [cartItems, allIds]
  );

  const textFilter = (label: string, dataKey: string): React.ReactElement => (
    <TextColumnFilter
      label={label}
      value={filters[dataKey] as string}
      onChange={(value: string) => pushFilters(dataKey, value ? value : null)}
    />
  );

  const dateFilter = (label: string, dataKey: string): React.ReactElement => (
    <DateColumnFilter
      label={label}
      value={filters[dataKey] as DateFilter}
      onChange={(value: { startDate?: string; endDate?: string } | null) =>
        pushFilters(dataKey, value ? value : null)
      }
    />
  );

  React.useEffect(() => {
    // Sort by STARTDATE on load.
    pushSort('STARTDATE', 'desc');
  }, [pushSort]);

  React.useEffect(() => {
    fetchCount(username);
    fetchData(username, {
      startIndex: 0,
      stopIndex: 49,
    });
    fetchAllIds(username);
  }, [fetchCount, fetchData, username, sort, filters, fetchAllIds]);

  const urlPrefix = (investigationData: Investigation): string => {
    if (
      investigationData.INVESTIGATIONINSTRUMENT &&
      investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT &&
      investigationData.FACILITY &&
      investigationData.FACILITY.FACILITYCYCLE
    ) {
      const facilityCycle = investigationData.FACILITY.FACILITYCYCLE.find(
        (facilitycycle) =>
          facilitycycle.STARTDATE &&
          facilitycycle.ENDDATE &&
          investigationData.STARTDATE &&
          facilitycycle.STARTDATE <= investigationData.STARTDATE &&
          facilitycycle.ENDDATE >= investigationData.STARTDATE
      );
      if (facilityCycle) {
        return `/browse/instrument/${investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT.ID}/facilityCycle/${facilityCycle.ID}/investigation`;
      }
    }
    return '';
  };

  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={(params) => fetchData(username, params)}
      totalRowCount={totalDataCount}
      sort={sort}
      onSort={pushSort}
      selectedRows={selectedRows}
      allIds={allIds}
      onCheck={addToCart}
      onUncheck={removeFromCart}
      detailsPanel={({ rowData, detailsPanelResize }) => {
        return (
          <InvestigationDetailsPanel
            rowData={rowData}
            detailsPanelResize={detailsPanelResize}
            fetchDetails={props.fetchDetails}
            viewDatasets={
              urlPrefix(rowData as Investigation)
                ? viewDatasets(urlPrefix(rowData as Investigation))
                : undefined
            }
          />
        );
      }}
      columns={[
        {
          icon: <TitleIcon />,
          label: t('investigations.title'),
          dataKey: 'TITLE',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            const url = urlPrefix(investigationData);
            if (url) {
              return tableLink(
                `${url}/${investigationData.ID}`,
                investigationData.TITLE
              );
            } else {
              return investigationData.TITLE;
            }
          },
          filterComponent: textFilter,
        },
        {
          icon: <PublicIcon />,
          label: t('investigations.doi'),
          dataKey: 'STUDYINVESTIGATION.STUDY.PID',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            if (
              investigationData.STUDYINVESTIGATION &&
              investigationData.STUDYINVESTIGATION[0].STUDY
            ) {
              return investigationData.STUDYINVESTIGATION[0].STUDY.PID;
            } else {
              return '';
            }
          },
          filterComponent: textFilter,
        },
        {
          icon: <FingerprintIcon />,
          label: t('investigations.visit_id'),
          dataKey: 'VISIT_ID',
          filterComponent: textFilter,
        },
        {
          icon: <TitleIcon />,
          label: t('investigations.name'),
          dataKey: 'NAME',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            const url = urlPrefix(investigationData);
            if (url) {
              return tableLink(
                `${url}/${investigationData.ID}`,
                investigationData.NAME
              );
            } else {
              return investigationData.NAME;
            }
          },
          filterComponent: textFilter,
        },
        {
          icon: <AssessmentIcon />,
          label: t('investigations.instrument'),
          dataKey: 'INVESTIGATIONINSTRUMENT.INSTRUMENT.FULLNAME',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            if (
              investigationData.INVESTIGATIONINSTRUMENT &&
              investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT
            ) {
              return investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT
                .FULLNAME;
            } else {
              return '';
            }
          },
          filterComponent: textFilter,
        },
        {
          icon: <SaveIcon />,
          label: t('investigations.size'),
          dataKey: 'SIZE',
          cellContentRenderer: (props) => {
            return formatBytes(props.cellData);
          },
          disableSort: true,
        },
        {
          icon: <CalendarTodayIcon />,
          label: t('investigations.start_date'),
          dataKey: 'STARTDATE',
          filterComponent: dateFilter,
        },
        {
          icon: <CalendarTodayIcon />,
          label: t('investigations.end_date'),
          dataKey: 'ENDDATE',
          filterComponent: dateFilter,
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): ISISMyDataTableDispatchProps => ({
  pushSort: (sort: string, order: Order | null) =>
    dispatch(pushPageSort(sort, order)),
  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  fetchData: (username: string, offsetParams: IndexRange) =>
    dispatch(
      fetchInvestigations({
        offsetParams,
        additionalFilters: [
          {
            filterType: 'where',
            filterValue: JSON.stringify({
              'INVESTIGATIONUSER.USER.NAME': { eq: username },
            }),
          },
          {
            filterType: 'include',
            filterValue: JSON.stringify([
              {
                INVESTIGATIONINSTRUMENT: 'INSTRUMENT',
              },
              { INVESTIGATIONUSER: 'USER_' },
              { STUDYINVESTIGATION: 'STUDY' },
              { FACILITY: 'FACILITYCYCLE' },
            ]),
          },
        ],
        getSize: true,
      })
    ),
  fetchCount: (username: string) =>
    dispatch(
      fetchInvestigationCount([
        {
          filterType: 'where',
          filterValue: JSON.stringify({
            'INVESTIGATIONUSER.USER.NAME': { eq: username },
          }),
        },
        {
          filterType: 'include',
          filterValue: JSON.stringify({ INVESTIGATIONUSER: 'USER_' }),
        },
      ])
    ),
  fetchDetails: (investigationId: number) =>
    dispatch(fetchInvestigationDetails(investigationId)),
  addToCart: (entityIds: number[]) =>
    dispatch(addToCart('investigation', entityIds)),
  removeFromCart: (entityIds: number[]) =>
    dispatch(removeFromCart('investigation', entityIds)),
  fetchAllIds: (username: string) =>
    dispatch(
      fetchAllIds('investigation', [
        {
          filterType: 'where',
          filterValue: JSON.stringify({
            'INVESTIGATIONUSER.USER.NAME': { eq: username },
          }),
        },
        {
          filterType: 'include',
          filterValue: JSON.stringify({ INVESTIGATIONUSER: 'USER_' }),
        },
      ])
    ),
  viewDatasets: (urlPrefix: string) => {
    return (id: number) => {
      return dispatch(push(`${urlPrefix}/${id}/dataset`));
    };
  },
});

const mapStateToProps = (state: StateType): ISISMyDataTableStoreProps => {
  return {
    sort: state.dgcommon.sort,
    filters: state.dgcommon.filters,
    data: state.dgcommon.data,
    totalDataCount: state.dgcommon.totalDataCount,
    loading: state.dgcommon.loading,
    error: state.dgcommon.error,
    cartItems: state.dgcommon.cartItems,
    allIds: state.dgcommon.allIds,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ISISMyDataTable);
