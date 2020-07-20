import { Typography } from '@material-ui/core';
import {
  addToCart,
  // clearTable,
  Datafile,
  DateColumnFilter,
  DateFilter,
  DownloadCartItem,
  Entity,
  fetchAllIds,
  fetchDatafileCount,
  fetchDatafiles,
  Filter,
  FiltersType,
  formatBytes,
  Order,
  pushPageFilter,
  removeFromCart,
  // sortTable,
  Table,
  TextColumnFilter,
  pushPageSort,
} from 'datagateway-common';
import React from 'react';
import { connect } from 'react-redux';
import { IndexRange } from 'react-virtualized';
import { AnyAction } from 'redux'; // Action
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from '../../../state/app.types';
// import useAfterMountEffect from '../../../utils';

interface DLSDatafilesTableProps {
  datasetId: string;
}

interface DLSDatafilesTableStoreProps {
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

interface DLSDatafilesTableDispatchProps {
  // sortTable: (column: string, order: Order | null) => Action;
  pushSort: (sort: string, order: Order | null) => Promise<void>;
  // filterTable: (column: string, filter: Filter | null) => Action;
  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  fetchData: (datasetId: number, offsetParams: IndexRange) => Promise<void>;
  fetchCount: (datasetId: number) => Promise<void>;
  // clearTable: () => Action;
  addToCart: (entityIds: number[]) => Promise<void>;
  removeFromCart: (entityIds: number[]) => Promise<void>;
  fetchAllIds: () => Promise<void>;
}

type DLSDatafilesTableCombinedProps = DLSDatafilesTableProps &
  DLSDatafilesTableStoreProps &
  DLSDatafilesTableDispatchProps;

const DLSDatafilesTable = (
  props: DLSDatafilesTableCombinedProps
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
    datasetId,
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
            cartItem.entityType === 'datafile' &&
            allIds.includes(cartItem.entityId)
        )
        .map((cartItem) => cartItem.entityId),
    [cartItems, allIds]
  );

  // React.useEffect(() => {
  //   clearTable();
  // }, [clearTable]);

  // useAfterMountEffect(() => {
  //   fetchCount(parseInt(datasetId));
  //   fetchData(parseInt(datasetId), { startIndex: 0, stopIndex: 49 });
  //   fetchAllIds();
  // }, [fetchCount, fetchData, sort, filters, datasetId, fetchAllIds]);

  React.useEffect(() => {
    fetchCount(parseInt(datasetId));
    fetchData(parseInt(datasetId), { startIndex: 0, stopIndex: 49 });
    fetchAllIds();
  }, [fetchCount, fetchData, sort, filters, datasetId, fetchAllIds]);

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
  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={(params) => fetchData(parseInt(datasetId), params)}
      totalRowCount={totalDataCount}
      sort={sort}
      // onSort={sortTable}
      onSort={pushSort}
      selectedRows={selectedRows}
      allIds={allIds}
      onCheck={addToCart}
      onUncheck={removeFromCart}
      detailsPanel={({ rowData }) => {
        const datafileData = rowData as Datafile;
        return (
          <div>
            <Typography variant="body2">
              <b>Name:</b> {datafileData.NAME}
            </Typography>
            <Typography variant="body2">
              <b>Description:</b> {datafileData.DESCRIPTION}
            </Typography>
            <Typography variant="body2">
              <b>File Size:</b> {formatBytes(datafileData.FILESIZE)}
            </Typography>
            <Typography variant="body2">
              <b>Location:</b> {datafileData.LOCATION}
            </Typography>
          </div>
        );
      }}
      columns={[
        {
          label: 'Name',
          dataKey: 'NAME',
          filterComponent: textFilter,
        },
        {
          label: 'Location',
          dataKey: 'LOCATION',
          filterComponent: textFilter,
        },
        {
          label: 'Size',
          dataKey: 'FILESIZE',
          cellContentRenderer: (props) => {
            return formatBytes(props.cellData);
          },
          filterComponent: textFilter,
        },
        {
          label: 'Create Time',
          dataKey: 'CREATE_TIME',
          filterComponent: dateFilter,
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>,
  ownProps: DLSDatafilesTableProps
): DLSDatafilesTableDispatchProps => ({
  // sortTable: (column: string, order: Order | null) =>
  //   dispatch(sortTable(column, order)),
  pushSort: (sort: string, order: Order | null) =>
    dispatch(pushPageSort(sort, order)),
  // filterTable: (column: string, filter: Filter | null) =>
  //   dispatch(filterTable(column, filter)),
  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  fetchData: (datasetId: number, offsetParams: IndexRange) =>
    dispatch(fetchDatafiles(datasetId, offsetParams)),
  fetchCount: (datasetId: number) => dispatch(fetchDatafileCount(datasetId)),
  // clearTable: () => dispatch(clearTable()),
  addToCart: (entityIds: number[]) =>
    dispatch(addToCart('datafile', entityIds)),
  removeFromCart: (entityIds: number[]) =>
    dispatch(removeFromCart('datafile', entityIds)),
  fetchAllIds: () =>
    dispatch(
      fetchAllIds('datafile', [
        {
          filterType: 'where',
          filterValue: JSON.stringify({
            DATASET_ID: { eq: parseInt(ownProps.datasetId) },
          }),
        },
      ])
    ),
});

const mapStateToProps = (state: StateType): DLSDatafilesTableStoreProps => {
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

export default connect(mapStateToProps, mapDispatchToProps)(DLSDatafilesTable);