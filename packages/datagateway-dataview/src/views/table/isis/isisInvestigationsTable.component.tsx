import {
  addToCart,
  // clearTable,
  DateColumnFilter,
  DateFilter,
  DownloadCartItem,
  Entity,
  fetchAllISISInvestigationIds,
  fetchInvestigationDetails,
  fetchISISInvestigationCount,
  fetchISISInvestigations,
  Filter,
  FiltersType,
  formatBytes,
  Investigation,
  Order,
  pushPageFilter,
  removeFromCart,
  // sortTable,
  Table,
  tableLink,
  TextColumnFilter,
  pushPageSort,
} from 'datagateway-common';
import React from 'react';
import { connect } from 'react-redux';
import { IndexRange, TableCellProps } from 'react-virtualized';
import { AnyAction } from 'redux'; // Action
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from '../../../state/app.types';
// import useAfterMountEffect from '../../../utils';
import InvestigationDetailsPanel from '../../detailsPanels/isis/investigationDetailsPanel.component';

interface ISISInvestigationsTableProps {
  instrumentId: string;
  facilityCycleId: string;
}

interface ISISInvestigationsTableStoreProps {
  sort: {
    [column: string]: Order;
  };
  filters: FiltersType;
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
  cartItems: DownloadCartItem[];
  allIds: number[];
}

interface ISISInvestigationsTableDispatchProps {
  // sortTable: (column: string, order: Order | null) => Action;
  pushSort: (sort: string, order: Order | null) => Promise<void>;
  // filterTable: (column: string, filter: Filter | null) => Action;
  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  fetchData: (
    instrumentId: number,
    facilityCycleId: number,
    offsetParams: IndexRange
  ) => Promise<void>;
  fetchCount: (instrumentId: number, facilityCycleId: number) => Promise<void>;
  // clearTable: () => Action;
  fetchDetails: (investigationId: number) => Promise<void>;
  addToCart: (entityIds: number[]) => Promise<void>;
  removeFromCart: (entityIds: number[]) => Promise<void>;
  fetchAllIds: () => Promise<void>;
}

type ISISInvestigationsTableCombinedProps = ISISInvestigationsTableProps &
  ISISInvestigationsTableStoreProps &
  ISISInvestigationsTableDispatchProps;

const ISISInvestigationsTable = (
  props: ISISInvestigationsTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    // clearTable,
    sort,
    // sortTable,
    pushSort,
    filters,
    // filterTable,
    pushFilters,
    instrumentId,
    facilityCycleId,
    loading,
    cartItems,
    addToCart,
    removeFromCart,
    allIds,
    fetchAllIds,
  } = props;

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
      // onChange={(value: string) => filterTable(dataKey, value ? value : null)}
      onChange={(value: string) => pushFilters(dataKey, value ? value : null)}
    />
  );

  const dateFilter = (label: string, dataKey: string): React.ReactElement => (
    <DateColumnFilter
      label={label}
      value={filters[dataKey] as DateFilter}
      onChange={(value: { startDate?: string; endDate?: string } | null) =>
        // filterTable(dataKey, value)
        pushFilters(dataKey, value ? value : null)
      }
    />
  );

  // React.useEffect(() => {
  //   clearTable();
  // }, [clearTable]);

  // useAfterMountEffect(() => {
  //   fetchCount(parseInt(instrumentId), parseInt(facilityCycleId));
  //   fetchData(parseInt(instrumentId), parseInt(facilityCycleId), {
  //     startIndex: 0,
  //     stopIndex: 49,
  //   });
  //   fetchAllIds();
  // }, [fetchData, instrumentId, facilityCycleId, sort, filters, fetchAllIds]);

  React.useEffect(() => {
    fetchCount(parseInt(instrumentId), parseInt(facilityCycleId));
    fetchData(parseInt(instrumentId), parseInt(facilityCycleId), {
      startIndex: 0,
      stopIndex: 49,
    });
    fetchAllIds();
  }, [
    fetchCount,
    fetchData,
    instrumentId,
    facilityCycleId,
    sort,
    filters,
    fetchAllIds,
  ]);

  const urlPrefix = `/browse/instrument/${instrumentId}/facilityCycle/${facilityCycleId}/investigation`;

  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={(params) =>
        fetchData(parseInt(instrumentId), parseInt(facilityCycleId), params)
      }
      totalRowCount={totalDataCount}
      sort={sort}
      // onSort={sortTable}
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
          />
        );
      }}
      columns={[
        {
          label: 'Title',
          dataKey: 'TITLE',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            return tableLink(
              `${urlPrefix}/${investigationData.ID}/dataset`,
              investigationData.TITLE
            );
          },
          filterComponent: textFilter,
        },
        {
          label: 'Visit Id',
          dataKey: 'VISIT_ID',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            return tableLink(
              `${urlPrefix}/${investigationData.ID}/dataset`,
              investigationData.VISIT_ID
            );
          },
          filterComponent: textFilter,
        },
        {
          label: 'RB Number',
          dataKey: 'NAME',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            return tableLink(
              `${urlPrefix}/${investigationData.ID}/dataset`,
              investigationData.NAME
            );
          },
          filterComponent: textFilter,
        },
        {
          label: 'DOI',
          dataKey: 'STUDYINVESTIGATION.STUDY.PID',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            if (
              investigationData.STUDYINVESTIGATION &&
              investigationData.STUDYINVESTIGATION[0].STUDY
            ) {
              return tableLink(
                `${urlPrefix}/${investigationData.ID}/dataset`,
                investigationData.STUDYINVESTIGATION[0].STUDY.PID
              );
            } else {
              return '';
            }
          },
          filterComponent: textFilter,
        },
        {
          label: 'Size',
          dataKey: 'SIZE',
          cellContentRenderer: (props) => {
            return formatBytes(props.cellData);
          },
          disableSort: true,
        },
        {
          label: 'Instrument',
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
          label: 'Start Date',
          dataKey: 'STARTDATE',
          filterComponent: dateFilter,
        },
        {
          label: 'End Date',
          dataKey: 'ENDDATE',
          filterComponent: dateFilter,
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>,
  ownProps: ISISInvestigationsTableProps
): ISISInvestigationsTableDispatchProps => ({
  // sortTable: (column: string, order: Order | null) =>
  //   dispatch(sortTable(column, order)),
  pushSort: (sort: string, order: Order | null) =>
    dispatch(pushPageSort(sort, order)),
  // filterTable: (column: string, filter: Filter | null) =>
  //   dispatch(filterTable(column, filter)),
  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  fetchData: (
    instrumentId: number,
    facilityCycleId: number,
    offsetParams: IndexRange
  ) =>
    dispatch(
      fetchISISInvestigations({
        instrumentId,
        facilityCycleId,
        offsetParams,
        optionalParams: { getSize: true },
      })
    ),
  fetchCount: (instrumentId: number, facilityCycleId: number) =>
    dispatch(fetchISISInvestigationCount(instrumentId, facilityCycleId)),
  // clearTable: () => dispatch(clearTable()),
  fetchDetails: (investigationId: number) =>
    dispatch(fetchInvestigationDetails(investigationId)),
  addToCart: (entityIds: number[]) =>
    dispatch(addToCart('investigation', entityIds)),
  removeFromCart: (entityIds: number[]) =>
    dispatch(removeFromCart('investigation', entityIds)),
  fetchAllIds: () =>
    dispatch(
      fetchAllISISInvestigationIds(
        parseInt(ownProps.instrumentId),
        parseInt(ownProps.facilityCycleId)
      )
    ),
});

const mapStateToProps = (
  state: StateType
): ISISInvestigationsTableStoreProps => {
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ISISInvestigationsTable);