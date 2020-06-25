import React from 'react';
import { Typography } from '@material-ui/core';
import {
  Table,
  TextColumnFilter,
  DateColumnFilter,
  Order,
  Filter,
  Investigation,
  Entity,
  DownloadCartItem,
  fetchInvestigations,
  fetchInvestigationCount,
  addToCart,
  removeFromCart,
  investigationLink,
  fetchAllIds,
  sortTable,
  filterTable,
  clearTable,
} from 'datagateway-common';
import { StateType } from '../state/app.types';
import { connect } from 'react-redux';
import { Action, AnyAction } from 'redux';
import { TableCellProps, IndexRange } from 'react-virtualized';
import { ThunkDispatch } from 'redux-thunk';
import useAfterMountEffect from '../state/utils';

interface InvestigationTableProps {
  sort: {
    [column: string]: Order;
  };
  filters: {
    [column: string]: Filter;
  };
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
  cartItems: DownloadCartItem[];
  allIds: number[];
  luceneData: number[];
}

interface InvestigationTableDispatchProps {
  sortTable: (column: string, order: Order | null) => Action;
  filterTable: (column: string, filter: Filter | null) => Action;
  addToCart: (entityIds: number[]) => Promise<void>;
  removeFromCart: (entityIds: number[]) => Promise<void>;
  fetchData: (luceneData: number[], offsetParams: IndexRange) => Promise<void>;
  fetchCount: (luceneData: number[]) => Promise<void>;
  fetchAllIds: (luceneData: number[]) => Promise<void>;
  clearTable: () => Action;
}

type InvestigationTableCombinedProps = InvestigationTableProps &
  InvestigationTableDispatchProps;

const InvestigationSearchTable = (
  props: InvestigationTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    clearTable,
    sort,
    sortTable,
    filters,
    filterTable,
    cartItems,
    addToCart,
    removeFromCart,
    allIds,
    fetchAllIds,
    luceneData,
    loading,
  } = props;

  const selectedRows = React.useMemo(
    () =>
      cartItems
        .filter(
          cartItem =>
            cartItem.entityType === 'investigation' &&
            allIds.includes(cartItem.entityId)
        )
        .map(cartItem => cartItem.entityId),
    [cartItems, allIds]
  );

  const textFilter = (label: string, dataKey: string): React.ReactElement => (
    <TextColumnFilter
      label={label}
      onChange={(value: string) => filterTable(dataKey, value ? value : null)}
    />
  );

  const dateFilter = (label: string, dataKey: string): React.ReactElement => (
    <DateColumnFilter
      label={label}
      onChange={(value: { startDate?: string; endDate?: string } | null) =>
        filterTable(dataKey, value)
      }
    />
  );

  React.useEffect(() => {
    clearTable();
  }, [clearTable, luceneData]);

  useAfterMountEffect(() => {
    fetchCount(luceneData);
    fetchData(luceneData, { startIndex: 0, stopIndex: 49 });
    fetchAllIds(luceneData);
  }, [fetchCount, fetchData, fetchAllIds, sort, filters, luceneData]);

  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={params => fetchData(luceneData, params)}
      totalRowCount={totalDataCount}
      sort={sort}
      onSort={sortTable}
      selectedRows={selectedRows}
      allIds={allIds}
      onCheck={addToCart}
      onUncheck={removeFromCart}
      detailsPanel={({ rowData }) => {
        const investigationData = rowData as Investigation;
        return (
          <div>
            <Typography>
              <b>Proposal:</b> {investigationData.RB_NUMBER}
            </Typography>
            <Typography>
              <b>Title:</b> {investigationData.TITLE}
            </Typography>
            <Typography>
              <b>Start Date:</b> {investigationData.STARTDATE}
            </Typography>
            <Typography>
              <b>End Date:</b> {investigationData.ENDDATE}
            </Typography>
          </div>
        );
      }}
      columns={[
        {
          label: 'Title',
          dataKey: 'TITLE',
          cellContentRenderer: (props: TableCellProps) => {
            const investigationData = props.rowData as Investigation;
            return investigationLink(
              investigationData.ID,
              investigationData.TITLE
            );
          },
          filterComponent: textFilter,
        },
        {
          label: 'Visit ID',
          dataKey: 'VISIT_ID',
          filterComponent: textFilter,
        },
        {
          label: 'RB Number',
          dataKey: 'NAME',
          filterComponent: textFilter,
        },
        {
          label: 'DOI',
          dataKey: 'DOI',
          filterComponent: textFilter,
        },
        {
          label: 'Dataset Count',
          dataKey: 'DATASET_COUNT',
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
          cellContentRenderer: (props: TableCellProps) => {
            if (props.cellData) return props.cellData.toString().split(' ')[0];
          },
        },
        {
          label: 'End Date',
          dataKey: 'ENDDATE',
          filterComponent: dateFilter,
          cellContentRenderer: (props: TableCellProps) => {
            if (props.cellData) return props.cellData.toString().split(' ')[0];
          },
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): InvestigationTableDispatchProps => ({
  sortTable: (column: string, order: Order | null) =>
    dispatch(sortTable(column, order)),
  filterTable: (column: string, filter: Filter | null) =>
    dispatch(filterTable(column, filter)),
  fetchData: (luceneData: number[], offsetParams?: IndexRange) =>
    dispatch(
      fetchInvestigations({
        offsetParams,
        getDatasetCount: true,
        additionalFilters: [
          {
            filterType: 'where',
            filterValue: JSON.stringify({
              ID: { in: luceneData },
            }),
          },
          {
            filterType: 'include',
            filterValue: JSON.stringify({
              INVESTIGATIONINSTRUMENT: 'INSTRUMENT',
            }),
          },
        ],
      })
    ),
  fetchCount: () => dispatch(fetchInvestigationCount()),
  clearTable: () => dispatch(clearTable()),
  addToCart: (entityIds: number[]) =>
    dispatch(addToCart('investigation', entityIds)),
  removeFromCart: (entityIds: number[]) =>
    dispatch(removeFromCart('investigation', entityIds)),
  fetchAllIds: () => dispatch(fetchAllIds('investigation')),
});

const mapStateToProps = (state: StateType): InvestigationTableProps => {
  return {
    sort: state.dgcommon.sort,
    filters: state.dgcommon.filters,
    data: state.dgcommon.data,
    totalDataCount: state.dgcommon.totalDataCount,
    loading: state.dgcommon.loading,
    error: state.dgcommon.error,
    cartItems: state.dgcommon.cartItems,
    allIds: state.dgcommon.allIds,
    luceneData: state.dgsearch.searchData.investigation,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InvestigationSearchTable);